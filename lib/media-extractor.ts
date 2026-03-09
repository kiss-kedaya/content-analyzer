import YTDlpWrap from 'yt-dlp-wrap'
import { createLogger } from './logger'

const logger = createLogger('media-extractor')

export interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
}

/**
 * 重试配置
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 秒
  maxDelay: 5000, // 5 秒
  backoffMultiplier: 2,
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试的媒体提取
 */
async function extractWithRetry<T>(
  fn: () => Promise<T>,
  context: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.debug({ attempt, context }, 'Attempting media extraction')
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < retries) {
        const delayMs = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        )
        
        logger.warn(
          { attempt, delayMs, error: lastError.message, context },
          `Media extraction failed, retrying in ${delayMs}ms`
        )
        
        await delay(delayMs)
      }
    }
  }
  
  logger.error({ error: lastError?.message, context }, 'Media extraction failed after all retries')
  throw lastError
}

/**
 * 从 Twitter URL 提取媒体链接（图片和视频）
 * 使用 yt-dlp 提取高质量媒体链接
 * 
 * 带重试机制：
 * - 最多重试 3 次
 * - 指数退避延迟（1s, 2s, 4s）
 * - 最大延迟 5 秒
 */
export async function extractTwitterMedia(twitterUrl: string): Promise<MediaInfo[]> {
  return extractWithRetry(async () => {
    const ytDlp = new YTDlpWrap()
    
    // 获取视频信息（包括图片）
    const info = await ytDlp.getVideoInfo(twitterUrl)
    
    const mediaList: MediaInfo[] = []
    
    // 处理视频
    if (info.url) {
      // yt-dlp 返回的是最佳质量的视频 URL
      mediaList.push({
        type: 'video',
        url: info.url,
        thumbnail: info.thumbnail,
        width: info.width,
        height: info.height,
        format: info.ext
      })
    }
    
    // 处理图片（从 entries 或 thumbnails 中提取）
    if (info.thumbnails && Array.isArray(info.thumbnails)) {
      // Twitter 图片通常在 thumbnails 中
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
    
    // 去重（基于 URL）
    const uniqueMedia = Array.from(
      new Map(mediaList.map(item => [item.url, item])).values()
    )
    
    logger.info({ count: uniqueMedia.length, url: twitterUrl }, 'Media extraction successful')
    return uniqueMedia
  }, `extractTwitterMedia(${twitterUrl})`)
}

/**
 * 从 Twitter URL 提取所有媒体链接（仅返回 URL 数组）
 */
export async function extractTwitterMediaUrls(twitterUrl: string): Promise<string[]> {
  const mediaList = await extractTwitterMedia(twitterUrl)
  return mediaList.map(media => media.url)
}

/**
 * 批量提取多个 Twitter URL 的媒体链接
 */
export async function extractBatchTwitterMedia(twitterUrls: string[]): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {}
  const queue = [...twitterUrls]
  const concurrency = 4

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()
      if (!url) return

      try {
        results[url] = await extractTwitterMediaUrls(url)
      } catch (error) {
        console.error(`Failed to extract media from ${url}:`, error)
        results[url] = []
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, twitterUrls.length) }, () => worker()))
  return results
}
