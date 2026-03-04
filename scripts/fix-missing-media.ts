import { PrismaClient } from '@prisma/client'
import { extractTwitterMediaUrls } from '../lib/media-extractor-unified'

const prisma = new PrismaClient()

async function fixMissingMedia() {
  console.log('🔍 查找媒体为空的记录...\n')
  
  try {
    // 查找 mediaUrls 为空的记录（mediaUrls 是 String 类型，存储 JSON）
    const allContents = await prisma.adultContent.findMany()
    
    // 过滤出媒体为空的记录
    const emptyMediaContents = allContents.filter(content => {
      if (!content.mediaUrls) return true
      
      try {
        const urls = JSON.parse(content.mediaUrls)
        return !Array.isArray(urls) || urls.length === 0
      } catch {
        return true
      }
    })
    
    console.log(`找到 ${emptyMediaContents.length} 条需要修复的记录\n`)
    
    if (emptyMediaContents.length === 0) {
      console.log('✅ 没有需要修复的记录')
      return
    }
    
    let successCount = 0
    let failCount = 0
    let skipCount = 0
    
    for (let i = 0; i < emptyMediaContents.length; i++) {
      const content = emptyMediaContents[i]
      console.log(`[${i + 1}/${emptyMediaContents.length}] 处理: ${content.url}`)
      
      try {
        // 重新提取媒体
        const mediaUrls = await extractTwitterMediaUrls(content.url)
        
        if (mediaUrls.length > 0) {
          // 更新数据库
          await prisma.adultContent.update({
            where: { id: content.id },
            data: { 
              mediaUrls: JSON.stringify(mediaUrls)
            }
          })
          
          console.log(`  ✅ 成功: 提取到 ${mediaUrls.length} 个媒体`)
          mediaUrls.forEach((url, idx) => {
            console.log(`     ${idx + 1}. ${url.substring(0, 60)}...`)
          })
          successCount++
        } else {
          console.log(`  ⚠️  警告: 未提取到媒体`)
          skipCount++
        }
      } catch (error) {
        console.error(`  ❌ 失败: ${error instanceof Error ? error.message : error}`)
        failCount++
      }
      
      // 延迟 2 秒，避免 API 限流
      if (i < emptyMediaContents.length - 1) {
        console.log('  ⏳ 等待 2 秒...\n')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 修复完成:')
    console.log(`  ✅ 成功: ${successCount} 条`)
    console.log(`  ⚠️  跳过: ${skipCount} 条（未提取到媒体）`)
    console.log(`  ❌ 失败: ${failCount} 条`)
    console.log(`  📝 总计: ${emptyMediaContents.length} 条`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 运行修复
fixMissingMedia()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
