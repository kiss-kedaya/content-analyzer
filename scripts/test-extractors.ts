/**
 * 测试两种媒体提取方案
 * 
 * 使用方法：
 * npm run test-extractors -- --url "https://twitter.com/user/status/123456789"
 */

import { extractTwitterMedia, testExtractors } from '../lib/media-extractor-unified'

interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
}

async function testBothMethods(url: string) {
  console.log('🧪 测试两种媒体提取方案\n')
  console.log('URL:', url)
  console.log('')
  
  // 测试提取器可用性
  console.log('📋 检查提取器可用性...\n')
  const availability = await testExtractors()
  console.log('yt-dlp:', availability.ytdlp ? '✅ 可用' : '❌ 不可用')
  console.log('agent-browser:', availability.browser ? '✅ 可用' : '❌ 不可用')
  console.log('')
  
  // 测试 yt-dlp
  console.log('📋 方案 1: yt-dlp\n')
  try {
    const ytdlpMedia = await extractTwitterMedia(url, 'ytdlp')
    console.log('✅ yt-dlp 提取成功')
    console.log('媒体数量:', ytdlpMedia.length)
    console.log('')
    
    if (ytdlpMedia.length > 0) {
      ytdlpMedia.forEach((media: MediaInfo, index: number) => {
        console.log(`媒体 ${index + 1}:`)
        console.log('  类型:', media.type)
        console.log('  URL:', media.url)
        if (media.thumbnail) console.log('  缩略图:', media.thumbnail)
        if (media.width && media.height) console.log('  尺寸:', `${media.width}x${media.height}`)
        if (media.format) console.log('  格式:', media.format)
        console.log('')
      })
    }
  } catch (error) {
    console.log('❌ yt-dlp 提取失败:', error instanceof Error ? error.message : error)
    console.log('')
  }
  
  // 测试 agent-browser
  console.log('📋 方案 2: agent-browser\n')
  try {
    const browserMedia = await extractTwitterMedia(url, 'browser')
    console.log('✅ agent-browser 提取成功')
    console.log('媒体数量:', browserMedia.length)
    console.log('')
    
    if (browserMedia.length > 0) {
      browserMedia.forEach((media: MediaInfo, index: number) => {
        console.log(`媒体 ${index + 1}:`)
        console.log('  类型:', media.type)
        console.log('  URL:', media.url)
        if (media.thumbnail) console.log('  缩略图:', media.thumbnail)
        if (media.width && media.height) console.log('  尺寸:', `${media.width}x${media.height}`)
        if (media.format) console.log('  格式:', media.format)
        console.log('')
      })
    }
  } catch (error) {
    console.log('❌ agent-browser 提取失败:', error instanceof Error ? error.message : error)
    console.log('')
  }
  
  // 测试自动回退
  console.log('📋 方案 3: 自动回退（auto）\n')
  try {
    const autoMedia = await extractTwitterMedia(url, 'auto')
    console.log('✅ 自动回退提取成功')
    console.log('媒体数量:', autoMedia.length)
    console.log('')
    
    if (autoMedia.length > 0) {
      autoMedia.forEach((media: MediaInfo, index: number) => {
        console.log(`媒体 ${index + 1}:`)
        console.log('  类型:', media.type)
        console.log('  URL:', media.url)
        console.log('')
      })
    }
  } catch (error) {
    console.log('❌ 自动回退提取失败:', error instanceof Error ? error.message : error)
    console.log('')
  }
  
  console.log('✅ 测试完成！')
}

// 从命令行参数获取 URL
const args = process.argv.slice(2)
const urlIndex = args.indexOf('--url')

if (urlIndex === -1 || !args[urlIndex + 1]) {
  console.error('❌ 缺少 URL 参数')
  console.log('')
  console.log('使用方法:')
  console.log('  npm run test-extractors -- --url "https://twitter.com/user/status/123456789"')
  process.exit(1)
}

const url = args[urlIndex + 1]
testBothMethods(url)
