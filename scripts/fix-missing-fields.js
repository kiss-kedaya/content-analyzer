const { PrismaClient } = require('@prisma/client');

/**
 * 修复脚本：自动生成缺失的标题和摘要
 * 
 * 使用方法：
 * node scripts/fix-missing-fields.js
 * 
 * 或者只修复特定字段：
 * node scripts/fix-missing-fields.js --title-only
 * node scripts/fix-missing-fields.js --summary-only
 * 
 * 或者只修复特定表：
 * node scripts/fix-missing-fields.js --tech-only
 * node scripts/fix-missing-fields.js --adult-only
 */

const prisma = new PrismaClient();

// 从文本中提取标题（取第一句话或前N个字符）
function extractTitle(text, maxLength = 100) {
  if (!text) return '';
  
  // 移除开头的项目名称模式（如 "bounty-hunter - "）
  const cleanText = text.replace(/^[a-zA-Z0-9_-]+\s*-\s*/, '');
  
  // 取第一句话（以句号、问号、感叹号结尾）
  const firstSentence = cleanText.match(/^[^。？！.?!]+[。？！.?!]?/);
  let title = firstSentence ? firstSentence[0].trim() : cleanText.substring(0, 50).trim();
  
  // 如果标题太长，截断并添加省略号
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }
  
  return title;
}

// 从文本中提取摘要（取前几句话或前N个字符）
function extractSummary(text, maxLength = 200) {
  if (!text) return '';
  
  // 移除 Markdown 标记
  let cleanText = text
    .replace(/^#+\s+/gm, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接，保留文本
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`(.+?)`/g, '$1') // 移除行内代码
    .trim();
  
  // 取前几句话（最多3句）
  const sentences = cleanText.match(/[^。？！.?!]+[。？！.?!]/g);
  if (sentences && sentences.length > 0) {
    const summary = sentences.slice(0, 3).join('');
    if (summary.length <= maxLength) {
      return summary;
    }
  }
  
  // 如果没有句子或太长，直接截断
  const summary = cleanText.substring(0, maxLength).trim();
  return summary.length < cleanText.length ? summary + '...' : summary;
}

async function fixMissingTitles(tableName = 'content') {
  const isAdult = tableName === 'adultContent';
  const table = isAdult ? prisma.adultContent : prisma.content;
  const displayName = isAdult ? '成人内容' : '技术内容';
  
  console.log(`\n=== 修复缺失的标题（${displayName}） ===\n`);
  
  // 查找所有没有标题的内容
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
  
  console.log(`找到 ${contentsWithoutTitle.length} 条没有标题的${displayName}`);
  
  if (contentsWithoutTitle.length === 0) {
    console.log(`✓ 所有${displayName}都有标题`);
    return 0;
  }
  
  let updated = 0;
  
  for (const item of contentsWithoutTitle) {
    let title = '';
    
    // 优先从 summary 中提取
    if (item.summary) {
      title = extractTitle(item.summary);
    }
    
    // 如果 summary 没有内容，尝试从 content 中提取
    if (!title && item.content) {
      const firstLine = item.content.split('\n').find(line => line.trim());
      if (firstLine) {
        title = extractTitle(firstLine);
      }
    }
    
    // 如果还是没有标题，使用 URL
    if (!title) {
      title = item.url;
    }
    
    // 更新数据库
    await table.update({
      where: { id: item.id },
      data: { title }
    });
    
    updated++;
    console.log(`[${updated}/${contentsWithoutTitle.length}] 已生成标题: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
  }
  
  console.log(`\n✓ 成功修复 ${updated} 条${displayName}的标题\n`);
  return updated;
}

async function fixMissingSummaries(tableName = 'content') {
  const isAdult = tableName === 'adultContent';
  const table = isAdult ? prisma.adultContent : prisma.content;
  const displayName = isAdult ? '成人内容' : '技术内容';
  
  console.log(`\n=== 修复缺失的摘要（${displayName}） ===\n`);
  
  // 查找所有没有摘要的内容
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
  
  console.log(`找到 ${contentsWithoutSummary.length} 条没有摘要的${displayName}`);
  
  if (contentsWithoutSummary.length === 0) {
    console.log(`✓ 所有${displayName}都有摘要`);
    return 0;
  }
  
  let updated = 0;
  
  for (const item of contentsWithoutSummary) {
    let summary = '';
    
    // 优先从 content 中提取
    if (item.content) {
      summary = extractSummary(item.content);
    }
    
    // 如果 content 没有内容，使用 title
    if (!summary && item.title) {
      summary = item.title;
    }
    
    // 如果还是没有摘要，使用 URL
    if (!summary) {
      summary = `来源: ${item.url}`;
    }
    
    // 更新数据库
    await table.update({
      where: { id: item.id },
      data: { summary }
    });
    
    updated++;
    console.log(`[${updated}/${contentsWithoutSummary.length}] 已生成摘要: ${summary.substring(0, 60)}${summary.length > 60 ? '...' : ''}`);
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
    console.log('║     Content Analyzer - 字段修复脚本                        ║');
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
