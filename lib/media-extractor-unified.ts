/**
 * 统一的 Twitter 媒体提取接口
 * 支持两种方案：
 * 1. yt-dlp（优先，稳定可靠）
 * 2. agent-browser（备用，本地专用）
 * 
 * 支持 twitter.com 和 x.com 两种 URL 格式
 */

import YTDlpWrap from 'yt-dlp-wrap'
import { extractTwitterMediaUrlsBrowser } from './media-extractor-browser'
import { isValidTwitterUrl, normalizeToTwitter } from './twitter-url-utils'

export interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
}

export type ExtractorMethod = 'auto' | 'ytdlp' | 'browser'

// 从环境变量读取配置，默认 auto
const EXTRACTOR_METHOD = (process.env.MEDIA_EXTRACTOR_METHOD || 'auto') as ExtractorMethod

/**
 * 使用 yt-dlp 提取媒体链接
 */
async function extractWithYtDlp(twitterUrl: string): Promise<MediaInfo[]> {
  console.log('[yt-dlp] 提取媒体:', twitterUrl)
  
  // 验证 URL
  if (!isValidTwitterUrl(twitterUrl)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  // yt-dlp 可能需要 twitter.com 格式，尝试转换
  const normalizedUrl = normalizeToTwitter(twitterUrl)
  console.log('[yt-dlp] 标准化 URL:', normalizedUrl)
  
  try {
    const ytDlp = new YTDlpWrap()
    
    // 获取视频信息
    const info = await ytDlp.getVideoInfo(normalizedUrl)
    
    const mediaList: MediaInfo[] = []
    
    // 处理视频
    if (info.url) {
      mediaList.push({
        type: 'video',
        url: info.url,
        thumbnail: info.thumbnail,
        width: info.width,
        height: info.height,
        format: info.ext
      })
    }
    
    // 处理图片
    if (info.thumbnails && Array.isArray(info.thumbnails)) {
      const images = info.thumbnails
        .filter((thumb: any) => thumb.url && thumb.url.includes('pbs.twimg.com'))
        .map((thumb: any) => ({
          type: 'image' as const,
          url: thumb.url,
          width: thumb.width,
          height: thumb.height
        }))
      
      mediaList.push(...images)
    }
    
    // 去重
    const uniqueMedia = Array.from(
      new Map(mediaList.map(item => [item.url, item])).values()
    )
    
    console.log(`[yt-dlp] 提取成功: ${uniqueMedia.length} 个媒体`)
    
    return uniqueMedia
  } catch (error) {
    console.error('[yt-dlp] 提取失败:', error)
    throw error
  }
}

/**
 * 使用 agent-browser 提取媒体链接
 */
async function extractWithBrowser(twitterUrl: string): Promise<MediaInfo[]> {
  console.log('[agent-browser] 提取媒体:', twitterUrl)
  
  // 验证 URL
  if (!isValidTwitterUrl(twitterUrl)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  try {
    const { extractTwitterMediaBrowser } = await import('./media-extractor-browser')
    const mediaList = await extractTwitterMediaBrowser(twitterUrl)
    
    console.log(`[agent-browser] 提取成功: ${mediaList.length} 个媒体`)
    
    return mediaList
  } catch (error) {
    console.error('[agent-browser] 提取失败:', error)
    throw error
  }
}

/**
 * 智能提取媒体链接（自动回退）
 */
export async function extractTwitterMedia(
  twitterUrl: string,
  method: ExtractorMethod = EXTRACTOR_METHOD
): Promise<MediaInfo[]> {
  // 手动指定方法
  if (method === 'ytdlp') {
    return await extractWithYtDlp(twitterUrl)
  }
  
  if (method === 'browser') {
    return await extractWithBrowser(twitterUrl)
  }
  
  // 自动回退模式
  try {
    // 优先使用 yt-dlp
    return await extractWithYtDlp(twitterUrl)
  } catch (ytdlpError) {
    console.warn('[auto] yt-dlp 失败，回退到 agent-browser')
    
    try {
      // 回退到 agent-browser
      return await extractWithBrowser(twitterUrl)
    } catch (browserError) {
      console.error('[auto] 两种方法都失败')
      console.error('  yt-dlp:', ytdlpError instanceof Error ? ytdlpError.message : ytdlpError)
      console.error('  browser:', browserError instanceof Error ? browserError.message : browserError)
      
      // 返回空数组而不是抛出错误
      return []
    }
  }
}

/**
 * 提取媒体 URL（仅返回 URL 数组）
 */
export async function extractTwitterMediaUrls(
  twitterUrl: string,
  method: ExtractorMethod = EXTRACTOR_METHOD
): Promise<string[]> {
  const mediaList = await extractTwitterMedia(twitterUrl, method)
  return mediaList.map(media => media.url)
}

/**
 * 批量提取多个 Twitter URL 的媒体链接
 */
export async function extractBatchTwitterMedia(
  twitterUrls: string[],
  method: ExtractorMethod = EXTRACTOR_METHOD
): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {}
  
  for (const url of twitterUrls) {
    try {
      results[url] = await extractTwitterMediaUrls(url, method)
    } catch (error) {
      console.error(`提取失败 ${url}:`, error)
      results[url] = []
    }
  }
  
  return results
}

/**
 * 测试提取器可用性
 */
export async function testExtractors(): Promise<{
  ytdlp: boolean
  browser: boolean
}> {
  const testUrl = 'https://twitter.com/test/status/1'
  
  const result = {
    ytdlp: false,
    browser: false
  }
  
  // 测试 yt-dlp
  try {
    await extractWithYtDlp(testUrl)
    result.ytdlp = true
  } catch (error) {
    console.log('[test] yt-dlp 不可用')
  }
  
  // 测试 agent-browser
  try {
    await extractWithBrowser(testUrl)
    result.browser = true
  } catch (error) {
    console.log('[test] agent-browser 不可用')
  }
  
  return result
}
