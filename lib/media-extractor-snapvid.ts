/**
 * Snapvid.net API 媒体提取器
 * 真实 API 实现（两步调用）
 */

import { isValidTwitterUrl } from './twitter-url-utils'
import { createLogger } from './logger'

const log = createLogger('media/snapvid')

function base64UrlToUtf8(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

function tryDecodeSnapcdnTokenUrl(url: string): { sourceUrl?: string; expiresAt?: number } {
  try {
    const u = new URL(url)
    if (u.hostname !== 'dl.snapcdn.app') return {}
    const token = u.searchParams.get('token')
    if (!token) return {}

    const parts = token.split('.')
    if (parts.length !== 3) return {}

    const payloadJson = base64UrlToUtf8(parts[1])
    const payload = JSON.parse(payloadJson) as any

    const sourceUrl = typeof payload.url === 'string' ? payload.url : undefined
    const expiresAt = typeof payload.exp === 'number' ? payload.exp : undefined

    return { sourceUrl, expiresAt }
  } catch {
    return {}
  }
}

export interface MediaInfo {
  type: 'image' | 'video'
  // snapcdn token URL or direct media URL
  url: string
  // extracted from snapcdn token payload when available (e.g. video.twimg.com/...mp4)
  sourceUrl?: string
  // token expiration time (epoch seconds) when the url is a snapcdn token URL
  expiresAt?: number
  // original snapcdn token URL (kept when we decide to return sourceUrl)
  fallbackUrl?: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
  quality?: string
}

export interface SnapvidExtractionResult {
  media: MediaInfo[]
  rawResponse: unknown
}

/**
 * 使用 snapvid.net API 提取媒体链接
 * 
 * 流程：
 * 1. POST /api/userverify 获取 token
 * 2. POST /api/ajaxSearch 获取视频链接（HTML）
 * 3. 解析 HTML 提取视频直链
 */
export async function extractWithSnapvidDetailed(twitterUrl: string): Promise<SnapvidExtractionResult> {
  log.info({ urlHost: new URL(twitterUrl).hostname }, '提取媒体')
  
  // 验证 URL
  if (!isValidTwitterUrl(twitterUrl)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  try {
    // 步骤 1: 获取 token
    log.debug('步骤 1: 获取 token')
    const tokenRes = await fetch('https://snapvid.net/api/userverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: `url=${encodeURIComponent(twitterUrl)}`
    })
    
    if (!tokenRes.ok) {
      throw new Error(`Token request failed: ${tokenRes.status}`)
    }
    
    const tokenData = await tokenRes.json()
    
    if (!tokenData.success || !tokenData.token) {
      throw new Error('Failed to get token')
    }
    
    const token = tokenData.token
    log.debug('Token 获取成功')
    
    // 步骤 2: 获取视频链接
    log.debug('步骤 2: 获取视频链接')
    const videoRes = await fetch('https://snapvid.net/api/ajaxSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: `q=${encodeURIComponent(twitterUrl)}&w=&v=v2&lang=zh-cn&cftoken=${token}`
    })
    
    if (!videoRes.ok) {
      throw new Error(`Video request failed: ${videoRes.status}`)
    }
    
    const videoData = await videoRes.json()
    
    log.debug({ status: videoData?.status, statusCode: videoData?.statusCode }, '视频数据响应(摘要)')
    
    // 检查是否有错误状态码
    if (videoData.statusCode === 404) {
      log.info({ msg: videoData?.msg }, '视频不可访问（404）')
      return { media: [], rawResponse: videoData } // 返回空数组，表示没有媒体
    }
    
    if (videoData.status !== 'ok' || !videoData.data) {
      log.warn({ hasData: !!videoData?.data, status: videoData?.status }, '视频数据格式错误')
      throw new Error(`Failed to get video data: status=${videoData.status}, hasData=${!!videoData.data}`)
    }
    
    // 步骤 3: 解析 HTML 提取链接
    log.debug('步骤 3: 解析 HTML')
    const mediaList = extractVideoUrlsFromHtml(videoData.data)
    
    log.info({ count: mediaList.length }, '提取成功')
    
    return {
      media: mediaList,
      rawResponse: videoData
    }
  } catch (error) {
    log.error({ err: error instanceof Error ? { name: error.name, message: error.message } : String(error) }, '提取失败')
    throw error
  }
}

/**
 * 从 HTML 中提取媒体链接（优化版：区分纯图片和视频+图片）
 */
function extractVideoUrlsFromHtml(html: string): MediaInfo[] {
  const mediaList: MediaInfo[] = []
  
  // 情况 1：检查是否是纯图片（photo-list）
  if (html.includes('photo-list')) {
    log.debug('检测到纯图片推文（photo-list）')
    
    // 提取所有图片下载链接
    const photoListRegex = /<a href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*title="下载图片"/g
    let match
    
    while ((match = photoListRegex.exec(html)) !== null) {
      mediaList.push({
        type: 'image',
        url: match[1]
      })
    }
    
    log.info({ count: mediaList.length }, '提取到图片')
    return mediaList
  }
  
  // 情况 2：视频 + 图片（tw-video）
  log.debug('检测到视频推文（tw-video）')

  const qualityOrder: Record<string, number> = {
    '1280p': 5,
    '1080p': 4,
    '960p': 3.5,
    '852p': 3,
    '720p': 2,
    '640p': 1.5,
    '568p': 1,
    '426p': 0.5,
    '360p': 0,
    '270p': -0.5,
    'unknown': -1,
  }

  const segments: Array<{ index: number; media: MediaInfo }> = []
  const videoBlockRegex = /<div class="tw-video">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g
  let blockMatch: RegExpExecArray | null
  while ((blockMatch = videoBlockRegex.exec(html)) !== null) {
    const block = blockMatch[0]
    const blockVideos: MediaInfo[] = []
    const blockVideoRegex = /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>.*?下载 MP4 \((\d+)p\)/gs
    let match: RegExpExecArray | null
    while ((match = blockVideoRegex.exec(block)) !== null) {
      {
        const tokenUrl = match[1]
        const decoded = tryDecodeSnapcdnTokenUrl(tokenUrl)
        blockVideos.push({
          type: 'video',
          url: tokenUrl,
          fallbackUrl: tokenUrl,
          sourceUrl: decoded.sourceUrl,
          expiresAt: decoded.expiresAt,
          quality: match[2] + 'p',
          format: 'mp4',
        })
      }
    }

    blockVideos.sort((a, b) => (qualityOrder[b.quality || 'unknown'] || -1) - (qualityOrder[a.quality || 'unknown'] || -1))
    if (blockVideos[0]) {
      segments.push({ index: blockMatch.index, media: blockVideos[0] })
    }
  }

  const imageRegex = /<a[^>]+href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>[^<]*<i[^>]*><\/i>[^<]*下载图片/gs
  let imageMatch: RegExpExecArray | null
  while ((imageMatch = imageRegex.exec(html)) !== null) {
    const url = imageMatch[1]

    try {
      const tokenMatch = url.match(/token=([^&]+)/)
      if (tokenMatch) {
        const token = tokenMatch[1]
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          const actualUrl = payload.url || ''
          if (actualUrl.includes('video_thumb') || actualUrl.includes('amplify_video_thumb')) {
            continue
          }
        }
      }
    } catch {
      continue
    }

    {
      const decoded = tryDecodeSnapcdnTokenUrl(url)
      segments.push({
        index: imageMatch.index,
        media: {
          type: 'image',
          url,
          fallbackUrl: url,
          sourceUrl: decoded.sourceUrl,
          expiresAt: decoded.expiresAt,
        }
      })
    }
  }

  segments.sort((a, b) => a.index - b.index)

  const uniqueMedia = segments.reduce<MediaInfo[]>((acc, segment) => {
    if (acc.some(item => item.url === segment.media.url)) {
      return acc
    }
    acc.push(segment.media)
    return acc
  }, [])

  log.info({ count: uniqueMedia.length }, '共提取有序媒体')
  return uniqueMedia
}

export async function extractWithSnapvid(twitterUrl: string): Promise<MediaInfo[]> {
  const result = await extractWithSnapvidDetailed(twitterUrl)
  return result.media
}

/**
 * 提取媒体 URL（仅返回 URL 数组）
 */
export async function extractSnapvidMediaUrls(twitterUrl: string): Promise<string[]> {
  const mediaList = await extractWithSnapvid(twitterUrl)
  return mediaList.map(media => media.url)
}

/**
 * 获取最高质量的视频链接
 */
export async function getHighestQualityVideo(twitterUrl: string): Promise<string | null> {
  const mediaList = await extractWithSnapvid(twitterUrl)
  const videos = mediaList.filter(m => m.type === 'video')
  
  // 已经按质量排序，返回第一个
  return videos.length > 0 ? videos[0].url : null
}
