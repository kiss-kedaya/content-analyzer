import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanMedia() {
  console.log('开始清理媒体数据...\n')
  
  try {
    // 获取所有成人内容
    const adultContents = await prisma.adultContent.findMany()
    
    console.log(`找到 ${adultContents.length} 条成人内容记录`)
    
    let updatedCount = 0
    
    for (const content of adultContents) {
      if (!content.mediaUrls) {
        console.log(`[跳过] ${content.id}: 无媒体`)
        continue
      }
      
      // 解析 JSON
      let mediaUrls: string[]
      try {
        mediaUrls = typeof content.mediaUrls === 'string' 
          ? JSON.parse(content.mediaUrls)
          : content.mediaUrls
      } catch (error) {
        console.log(`[错误] ${content.id}: 无法解析 mediaUrls`)
        continue
      }
      
      if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
        console.log(`[跳过] ${content.id}: mediaUrls 为空`)
        continue
      }
      
      if (mediaUrls.length === 1) {
        console.log(`[跳过] ${content.id}: 已经只有 1 个媒体`)
        continue
      }
      
      // 只保留第一个（最高质量）
      const newMediaUrls = [mediaUrls[0]]
      
      await prisma.adultContent.update({
        where: { id: content.id },
        data: { 
          mediaUrls: JSON.stringify(newMediaUrls)
        }
      })
      
      console.log(`[更新] ${content.id}: ${mediaUrls.length} 个媒体 -> 1 个媒体`)
      console.log(`  保留: ${mediaUrls[0].substring(0, 60)}...`)
      
      updatedCount++
    }
    
    console.log(`\n清理完成！`)
    console.log(`总记录数: ${adultContents.length}`)
    console.log(`更新记录数: ${updatedCount}`)
    
  } catch (error) {
    console.error('清理失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanMedia()
