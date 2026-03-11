const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 修复脚本：使用 AI 自动生成缺失的标题和摘要
 * 
 * 使用方法：
 * node scripts/fix-missing-fields.js
 * 
 * 或者只修复特定字段：
 * node scripts/fix-missing-fields.js --title-only
 * node scripts/fix-missing-fields.js --summary-only
 * 
 * 功能：
 * - 修复前自动创建数据库备份
 * - 优先使用 SourceCache 中的原文（避免重复请求）
 * - 技术内容使用 r.jina.ai 获取原文
 * - 成人内容使用 defuddle.md 获取原文
 * - 使用 Cloudflare Workers AI (GLM-4.7-flash) 生成标题和摘要
 */

const prisma = new PrismaClient();

// 创建数据库备份
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    console.log('\n=== 创建数据库备份 ===\n');
    console.log(`备份文件: ${backupFile}`);
    console.log('正在备份数据库...');
    
    // 使用 Prisma 导出关键表数据为 JSON
    const content = await prisma.content.findMany();
    const adultContent = await prisma.adultContent.findMany();
    const sourceCache = await prisma.sourceCache.findMany();
    
    const jsonBackup = {
      timestamp: new Date().toISOString(),
      tables: {
        content: {
          count: content.length,
          data: content
        },
        adultContent: {
          count: adultContent.length,
          data: adultContent
        },
        sourceCache: {
          count: sourceCache.length,
          data: sourceCache
        }
      }
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(jsonBackup, null, 2));
    
    const stats = fs.statSync(backupFile);
    console.log(`✓ 备份成功！文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
    
    return backupFile;
  } catch (error) {
    console.error('✕ 备份失败:', error.message);
    console.error('⚠ 继续执行可能导致数据丢失！');
    console.error('按 Ctrl+C 取消，或等待 5 秒后继续...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return null;
  }
}

// 从 defuddle.md 获取原文（用于成人内容）
async function fetchFromDefuddle(url) {
  try {
    console.log('  → 从 defuddle.md 获取原文...');
    const defuddleUrl = `https://defuddle.md/${url}`;
    
    const response = await fetch(defuddleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Defuddle.md error: ${response.status}`);
    }

    const html = await response.text();
    
    // 简单提取文本内容（移除 HTML 标签）
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length > 100) {
      console.log(`  ✓ 获取成功 (${text.length} 字符)`);
      
      // 保存到缓存
      try {
        await prisma.sourceCache.upsert({
          where: { url },
          create: {
            url,
            provider: 'defuddle',
            status: 'ok',
            text: text,
            wordCount: text.split(/\s+/).length
          },
          update: {
            text: text,
            wordCount: text.split(/\s+/).length,
            lastFetchedAt: new Date()
          }
        });
      } catch (cacheError) {
        console.error('  ⚠ 保存缓存失败:', cacheError.message);
      }
      
      return text;
    }

    throw new Error('Content too short or empty');
  } catch (error) {
    console.error('  ✕ Defuddle.md 请求失败:', error.message);
    return null;
  }
}

// CPA 本地 AI 配置（优先使用）
const CPA_BASE_URL = 'http://localhost:8317';
const CPA_API_KEY = 'sk-codex-proxy-key-1';
const CPA_MODEL = 'gpt-5.2';

// 调用 CPA 本地 AI（anthropic-messages /v1/messages）
async function callCPAAI(messages, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${CPA_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CPA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CPA_MODEL,
          max_tokens: 8192,
          system: 'You are a friendly assistant',
          messages: messages.map(m => ({
            role: m.role,
            content: [{ type: 'text', text: m.content }]
          }))
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`CPA AI API error: ${response.status} ${error}`);
      }

      const data = await response.json();

      // { content: [{type:'text', text:'...'}] }
      if (Array.isArray(data.content)) {
        return data.content.map(c => c && c.text ? c.text : '').join('\n');
      }

      throw new Error(`Invalid response format: ${JSON.stringify(data).substring(0, 120)}`);
    } catch (error) {
      console.error(`  Attempt ${i + 1}/${retries} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 从 SourceCache 获取原文
async function getSourceContent(url) {
  try {
    const cached = await prisma.sourceCache.findUnique({
      where: { url },
      select: {
        text: true,
        status: true
      }
    });

    if (cached && cached.status === 'ok' && cached.text) {
      console.log(`  ✓ 使用缓存的原文 (${cached.text.length} 字符)`);
      return cached.text;
    }

    return null;
  } catch (error) {
    console.error('  ✕ 获取缓存失败:', error.message);
    return null;
  }
}

// 从 jina.ai 获取原文
async function fetchFromJina(url) {
  try {
    console.log('  → 从 jina.ai 获取原文...');
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'text'
      }
    });

    if (!response.ok) {
      throw new Error(`Jina.ai error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.content) {
      console.log(`  ✓ 获取成功 (${data.data.content.length} 字符)`);
      
      // 保存到缓存
      try {
        await prisma.sourceCache.upsert({
          where: { url },
          create: {
            url,
            provider: 'jina',
            status: 'ok',
            text: data.data.content,
            title: data.data.title || null,
            wordCount: data.data.content.split(/\s+/).length
          },
          update: {
            text: data.data.content,
            title: data.data.title || null,
            wordCount: data.data.content.split(/\s+/).length,
            lastFetchedAt: new Date()
          }
        });
      } catch (cacheError) {
        console.error('  ⚠ 保存缓存失败:', cacheError.message);
      }
      
      return data.data.content;
    }

    throw new Error('No content in jina.ai response');
  } catch (error) {
    console.error('  ✕ Jina.ai 请求失败:', error.message);
    return null;
  }
}

// 使用 AI 生成标题（JSON 格式）
async function generateTitleWithAI(sourceContent, url, existingSummary = '', existingContent = '') {
  // callCPAAI is used as the primary model backend (CPA local endpoint)

  // 构建综合内容
  let combinedContent = '';
  
  // 1. 如果有数据库中的摘要，优先使用
  if (existingSummary) {
    combinedContent += `数据库摘要：\n${existingSummary}\n\n`;
  }
  
  // 2. 如果有数据库中的内容，添加
  if (existingContent) {
    combinedContent += `数据库内容：\n${existingContent.substring(0, 500)}\n\n`;
  }
  
  // 3. 添加原文内容
  combinedContent += `原文内容：\n${sourceContent.substring(0, 2000)}`;
  
  const prompt = `请为以下内容生成一个简洁的中文标题。

要求：
1. 标题不超过50字
2. 准确概括主要内容
3. 使用中文
4. 综合所有提供的信息（数据库摘要、数据库内容、原文内容）
5. 以 JSON 格式返回

${combinedContent}

请以以下 JSON 格式返回（不要添加其他文字）：
{"title": "你的标题"}`;

  try {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的内容编辑，擅长为文章生成简洁准确的标题。你会综合多个来源的信息来生成最准确的标题。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await callCPAAI(messages);
    
    // 提取 JSON（可能被包裹在代码块中）
    let jsonStr = response;
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // 解析 JSON
    const parsed = JSON.parse(jsonStr);
    const title = parsed.title || '';
    
    // 清理标题（移除引号、换行等）
    const cleanTitle = title
      .replace(/^["'「『]|["'」』]$/g, '')
      .replace(/\n/g, ' ')
      .trim();
    
    // 限制长度
    return cleanTitle.length > 100 ? cleanTitle.substring(0, 97) + '...' : cleanTitle;
  } catch (error) {
    console.error('  ✕ AI 生成标题失败:', error.message);
    // Fallback: 使用简单提取
    return (existingSummary || sourceContent).substring(0, 50).trim() + '...';
  }
}

// 使用 AI 生成摘要（JSON 格式）
async function generateSummaryWithAI(sourceContent, url, existingTitle = '', existingContent = '') {
  // 构建综合内容
  let combinedContent = '';
  
  // 1. 如果有数据库中的标题，优先使用
  if (existingTitle) {
    combinedContent += `标题：\n${existingTitle}\n\n`;
  }
  
  // 2. 如果有数据库中的内容，添加
  if (existingContent) {
    combinedContent += `数据库内容：\n${existingContent.substring(0, 1000)}\n\n`;
  }
  
  // 3. 添加原文内容
  combinedContent += `原文内容：\n${sourceContent.substring(0, 3000)}`;
  
  const prompt = `请为以下内容生成一个简洁的中文摘要。

要求：
1. 摘要长度 100-200字
2. 概括主要内容和关键信息
3. 使用中文
4. 综合所有提供的信息（标题、数据库内容、原文内容）
5. 以 JSON 格式返回

${combinedContent}

请以以下 JSON 格式返回（不要添加其他文字）：
{"summary": "你的摘要"}`;

  try {
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的内容编辑，擅长为文章生成简洁准确的摘要。你会综合多个来源的信息来生成最准确的摘要。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await callCPAAI(messages);
    
    // 提取 JSON（可能被包裹在代码块中）
    let jsonStr = response;
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // 解析 JSON
    const parsed = JSON.parse(jsonStr);
    const summary = parsed.summary || '';
    
    // 清理摘要
    const cleanSummary = summary
      .replace(/^(摘要：|Summary:|摘要:)/i, '')
      .trim();
    
    // 限制长度
    return cleanSummary.length > 300 ? cleanSummary.substring(0, 297) + '...' : cleanSummary;
  } catch (error) {
    console.error('  ✕ AI 生成摘要失败:', error.message);
    // Fallback: 使用简单提取
    return (existingContent || sourceContent).substring(0, 200).trim() + '...';
  }
}

async function fixMissingTitles(tableName = 'content') {
  const isAdult = tableName === 'adultContent';
  const table = isAdult ? prisma.adultContent : prisma.content;
  const displayName = isAdult ? '成人内容' : '技术内容';
  
  console.log(`\n=== 修复缺失的标题（使用 AI - ${displayName}） ===\n`);
  
  const contentsWithoutTitle = await table.findMany({
    where: {
      OR: [
        { title: null },
        { title: '' }
      ]
    },
    select: {
      id: true,
      url: true,
      title: true,
      summary: true,
      content: true
    }
  });
  
  console.log(`找到 ${contentsWithoutTitle.length} 条没有标题的${displayName}\n`);
  
  if (contentsWithoutTitle.length === 0) {
    console.log(`✓ 所有${displayName}都有标题`);
    return 0;
  }
  
  let updated = 0;
  
  for (const item of contentsWithoutTitle) {
    console.log(`\n[${updated + 1}/${contentsWithoutTitle.length}] 处理: ${item.url}`);
    
    // 1. 获取原文（优先使用缓存）
    let sourceContent = await getSourceContent(item.url);
    
    // 2. 如果没有缓存，根据内容类型选择获取方式
    if (!sourceContent) {
      if (isAdult) {
        // 成人内容使用 defuddle.md
        sourceContent = await fetchFromDefuddle(item.url);
      } else {
        // 技术内容使用 jina.ai
        sourceContent = await fetchFromJina(item.url);
      }
    }
    
    // 3. 如果还是没有原文，使用现有的 content 或 summary
    if (!sourceContent) {
      sourceContent = item.content || item.summary || '';
    }
    
    if (!sourceContent) {
      console.log('  ⚠ 无法获取内容，跳过');
      continue;
    }
    
    // 4. 使用 AI 生成标题（传入已有的摘要和内容）
    console.log('  → 使用 AI 生成标题...');
    const title = await generateTitleWithAI(sourceContent, item.url, item.summary, item.content);
    
    // 5. 更新数据库
    await table.update({
      where: { id: item.id },
      data: { title }
    });
    
    updated++;
    console.log(`  ✓ 标题: ${title}`);
  }
  
  console.log(`\n✓ 成功修复 ${updated} 条${displayName}的标题\n`);
  return updated;
}

async function fixMissingSummaries(tableName = 'content') {
  const isAdult = tableName === 'adultContent';
  const table = isAdult ? prisma.adultContent : prisma.content;
  const displayName = isAdult ? '成人内容' : '技术内容';
  
  console.log(`\n=== 修复缺失的摘要（使用 AI - ${displayName}） ===\n`);
  
  const contentsWithoutSummary = await table.findMany({
    where: {
      summary: ''
    },
    select: {
      id: true,
      url: true,
      title: true,
      summary: true,
      content: true
    }
  });
  
  console.log(`找到 ${contentsWithoutSummary.length} 条没有摘要的${displayName}\n`);
  
  if (contentsWithoutSummary.length === 0) {
    console.log(`✓ 所有${displayName}都有摘要`);
    return 0;
  }
  
  let updated = 0;
  
  for (const item of contentsWithoutSummary) {
    console.log(`\n[${updated + 1}/${contentsWithoutSummary.length}] 处理: ${item.url}`);
    
    // 1. 获取原文（优先使用缓存）
    let sourceContent = await getSourceContent(item.url);
    
    // 2. 如果没有缓存，根据内容类型选择获取方式
    if (!sourceContent) {
      if (isAdult) {
        // 成人内容使用 defuddle.md
        sourceContent = await fetchFromDefuddle(item.url);
      } else {
        // 技术内容使用 jina.ai
        sourceContent = await fetchFromJina(item.url);
      }
    }
    
    // 3. 如果还是没有原文，使用现有的 content
    if (!sourceContent) {
      sourceContent = item.content || '';
    }
    
    if (!sourceContent) {
      console.log('  ⚠ 无法获取内容，跳过');
      continue;
    }
    
    // 4. 使用 AI 生成摘要（传入已有的标题和内容）
    console.log('  → 使用 AI 生成摘要...');
    const summary = await generateSummaryWithAI(sourceContent, item.url, item.title, item.content);
    
    // 5. 更新数据库
    await table.update({
      where: { id: item.id },
      data: { summary }
    });
    
    updated++;
    console.log(`  ✓ 摘要: ${summary.substring(0, 80)}...`);
  }
  
  console.log(`\n✓ 成功修复 ${updated} 条${displayName}的摘要\n`);
  return updated;
}

async function showStatistics() {
  console.log('\n=== 数据统计 ===\n');
  
  // 技术内容统计
  const techTotal = await prisma.content.count();
  const techWithoutTitle = await prisma.content.count({
    where: {
      OR: [
        { title: null },
        { title: '' }
      ]
    }
  });
  const techWithoutSummary = await prisma.content.count({
    where: {
      summary: ''
    }
  });
  
  // 成人内容统计
  const adultTotal = await prisma.adultContent.count();
  const adultWithoutTitle = await prisma.adultContent.count({
    where: {
      OR: [
        { title: null },
        { title: '' }
      ]
    }
  });
  const adultWithoutSummary = await prisma.adultContent.count({
    where: {
      summary: ''
    }
  });
  
  console.log('技术内容:');
  console.log(`  总数: ${techTotal}`);
  console.log(`  缺少标题: ${techWithoutTitle} (${((techWithoutTitle / techTotal) * 100).toFixed(2)}%)`);
  console.log(`  缺少摘要: ${techWithoutSummary} (${((techWithoutSummary / techTotal) * 100).toFixed(2)}%)`);
  
  console.log('\n成人内容:');
  console.log(`  总数: ${adultTotal}`);
  console.log(`  缺少标题: ${adultWithoutTitle} (${((adultWithoutTitle / adultTotal) * 100).toFixed(2)}%)`);
  console.log(`  缺少摘要: ${adultWithoutSummary} (${((adultWithoutSummary / adultTotal) * 100).toFixed(2)}%)`);
  
  console.log('');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const titleOnly = args.includes('--title-only');
    const summaryOnly = args.includes('--summary-only');
    const techOnly = args.includes('--tech-only');
    const adultOnly = args.includes('--adult-only');
    const dryRun = args.includes('--dry-run');
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Content Analyzer - AI 字段修复脚本                     ║');
    console.log('║     Powered by Cloudflare Workers AI (GLM-4.7-flash)      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    if (dryRun) {
      console.log('\n⚠️  DRY RUN 模式 - 不会修改数据库\n');
    }
    
    // 显示修复前的统计
    await showStatistics();
    
    if (dryRun) {
      console.log('✓ DRY RUN 完成，未修改任何数据');
      return;
    }
    
    // 创建数据库备份
    const backupFile = await createBackup();
    if (backupFile) {
      console.log(`备份文件已保存: ${backupFile}\n`);
    }
    
    let totalFixed = 0;
    
    // 处理技术内容
    if (!adultOnly) {
      if (!summaryOnly) {
        totalFixed += await fixMissingTitles('content');
      }
      if (!titleOnly) {
        totalFixed += await fixMissingSummaries('content');
      }
    }
    
    // 处理成人内容
    if (!techOnly) {
      if (!summaryOnly) {
        totalFixed += await fixMissingTitles('adultContent');
      }
      if (!titleOnly) {
        totalFixed += await fixMissingSummaries('adultContent');
      }
    }
    
    // 显示修复后的统计
    if (totalFixed > 0) {
      await showStatistics();
    }
    
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log(`║  ✓ 修复完成！共修复 ${totalFixed.toString().padEnd(3)} 条记录                        ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n✕ 修复失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
main();
