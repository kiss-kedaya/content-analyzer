/**
 * 测试基于 agent-browser 的 Twitter 媒体提取功能
 * 
 * 使用方法：
 * npm run test-media-browser -- --url "https://twitter.com/user/status/123456789"
 */

import { extractTwitterMediaBrowser } from '../lib/media-extractor-browser'

interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
}

async function testMediaExtraction(url: string) {
  console.log('🔍 提取 Twitter 媒体链接（使用 agent-browser）...')
  console.log('URL:', url)
  console.log('')
  
  try {
    const mediaList = await extractTwitterMediaBrowser(url)
    
    console.log('✅ 提取成功！')
    console.log('')
    console.log('媒体数量:', mediaList.length)
    console.log('')
    
    if (mediaList.length > 0) {
      mediaList.forEach((media: MediaInfo, index: number) => {
        console.log(`媒体 ${index + 1}:`)
        console.log('  类型:', media.type)
        console.log('  URL:', media.url)
        if (media.thumbnail) console.log('  缩略图:', media.thumbnail)
        if (media.width && media.height) console.log('  尺寸:', `${media.width}x${media.height}`)
        if (media.format) console.log('  格式:', media.format)
        console.log('')
      })
    } else {
      console.log('⚠️  未找到媒体')
    }
    
    return mediaList
  } catch (error) {
    console.error('❌ 提取失败:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// 从命令行参数获取 URL
const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')

if (urlIndex === -1 || !args[urlIndex + 1]) {
  console.error('❌ 缺少 URL 参数')
  console.log('')
  console.log('使用方法:')
  console.log('  npm run test-media-browser -- --url "https://twitter.com/user/status/123456789"')
  process.exit(1)
}

const url = args[urlIndex + 1]
testMediaExtraction(url)
