const { PrismaClient } = require('@prisma/client');

/**
 * 数据库 source 字段规范化迁移脚本
 * 
 * 将所有现有数据的 source 字段规范化：
 * - twitter/Twitter → X
 * - linuxdo/LinuxDo → Linuxdo
 * - xiaohongshu/XiaoHongShu → Xiaohongshu
 */

const prisma = new PrismaClient();

const SOURCE_MAPPING = {
  // X (Twitter)
  'twitter': 'X',
  'Twitter': 'X',
  'TWITTER': 'X',
  'x': 'X',
  
  // Linuxdo
  'linuxdo': 'Linuxdo',
  'LinuxDo': 'Linuxdo',
  'LINUXDO': 'Linuxdo',
  'linux.do': 'Linuxdo',
  
  // Xiaohongshu
  'xiaohongshu': 'Xiaohongshu',
  'XiaoHongShu': 'Xiaohongshu',
  'XIAOHONGSHU': 'Xiaohongshu',
  'xhs': 'Xiaohongshu',
  'XHS': 'Xiaohongshu',
  '小红书': 'Xiaohongshu',
  
  // GitHub
  'github': 'GitHub',
  'Github': 'GitHub',
  'GITHUB': 'GitHub',
  
  // Reddit
  'reddit': 'Reddit',
  'Reddit': 'Reddit',
  'REDDIT': 'Reddit',
  
  // YouTube
  'youtube': 'YouTube',
  'Youtube': 'YouTube',
  'YOUTUBE': 'YouTube',
  'yt': 'YouTube',
  
  // Bilibili
  'bilibili': 'Bilibili',
  'Bilibili': 'Bilibili',
  'BILIBILI': 'Bilibili',
  'b站': 'Bilibili',
  
  // Weibo
  'weibo': 'Weibo',
  'Weibo': 'Weibo',
  'WEIBO': 'Weibo',
  '微博': 'Weibo',
  
  // Zhihu
  'zhihu': 'Zhihu',
  'Zhihu': 'Zhihu',
  'ZHIHU': 'Zhihu',
  '知乎': 'Zhihu',
};

function normalizeSource(source) {
  if (!source) return source;
  const trimmed = source.trim();
  
  if (SOURCE_MAPPING[trimmed]) {
    return SOURCE_MAPPING[trimmed];
  }
  
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

async function migrateTable(tableName) {
  console.log(`\n=== 迁移 ${tableName} 表 ===\n`);
  
  const table = tableName === 'Content' ? prisma.content : prisma.adultContent;
  
  // 获取所有记录
  const records = await table.findMany({
    select: {
      id: true,
      source: true
    }
  });
  
  console.log(`找到 ${records.length} 条记录`);
  
  // 统计需要更新的记录
  const updates = [];
  const sourceStats = {};
  
  for (const record of records) {
    const normalized = normalizeSource(record.source);
    
    if (normalized !== record.source) {
      updates.push({
        id: record.id,
        oldSource: record.source,
        newSource: normalized
      });
    }
    
    // 统计
    sourceStats[normalized] = (sourceStats[normalized] || 0) + 1;
  }
  
  console.log(`\n需要更新 ${updates.length} 条记录\n`);
  
  if (updates.length > 0) {
    console.log('更新详情（前 10 条）:');
    updates.slice(0, 10).forEach((u, i) => {
      console.log(`${i + 1}. ${u.oldSource} → ${u.newSource}`);
    });
    
    if (updates.length > 10) {
      console.log(`... 还有 ${updates.length - 10} 条`);
    }
    
    console.log('\n开始更新...');
    
    let updated = 0;
    for (const update of updates) {
      await table.update({
        where: { id: update.id },
        data: { source: update.newSource }
      });
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`已更新 ${updated}/${updates.length}`);
      }
    }
    
    console.log(`\n✓ 成功更新 ${updated} 条记录`);
  } else {
    console.log('✓ 所有记录已经是规范格式');
  }
  
  console.log('\nSource 统计:');
  Object.entries(sourceStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Source 字段规范化迁移                                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // 迁移技术内容
    await migrateTable('Content');
    
    // 迁移成人内容
    await migrateTable('AdultContent');
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✓ 迁移完成！                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n✕ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
