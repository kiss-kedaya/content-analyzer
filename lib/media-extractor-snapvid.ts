/**
 * Snapvid.net API 媒体提取器
 * 真实 API 实现（两步调用）
 */

import { isValidTwitterUrl } from './twitter-url-utils'

export interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
  quality?: string
}

/**
 * 使用 snapvid.net API 提取媒体链接
 * 
 * 流程：
 * 1. POST /api/userverify 获取 token
 * 2. POST /api/ajaxSearch 获取视频链接（HTML）
 * 3. 解析 HTML 提取视频直链
 */
export async function extractWithSnapvid(twitterUrl: string): Promise<MediaInfo[]> {
  console.log('[snapvid] 提取媒体:', twitterUrl)
  
  // 验证 URL
  if (!isValidTwitterUrl(twitterUrl)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  try {
    // 步骤 1: 获取 token
    console.log('[snapvid] 步骤 1: 获取 token')
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
    console.log('[snapvid] Token 获取成功')
    
    // 步骤 2: 获取视频链接
    console.log('[snapvid] 步骤 2: 获取视频链接')
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
    
    if (videoData.status !== 'ok' || !videoData.data) {
      throw new Error('Failed to get video data')
    }
    
    // 步骤 3: 解析 HTML 提取链接
    console.log('[snapvid] 步骤 3: 解析 HTML')
    const mediaList = extractVideoUrlsFromHtml(videoData.data)
    
    console.log(`[snapvid] 提取成功: ${mediaList.length} 个媒体`)
    
    return mediaList
  } catch (error) {
    console.error('[snapvid] 提取失败:', error)
    throw error
  }
}

/**
 * 从 HTML 中提取视频链接
 */
function extractVideoUrlsFromHtml(html: string): MediaInfo[] {
  const mediaList: MediaInfo[] = []
  
  // 匹配视频下载链接
  // 格式: <a href="https://dl.snapcdn.app/get?token=...">下载 MP4 (1080p)</a>
  const videoRegex = /<a[^>]*href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>([^<]*)<\/a>/g
  
  let match
  while ((match = videoRegex.exec(html)) !== null) {
    const url = match[1]
    const text = match[2]
    
    // 提取质量信息
    const qualityMatch = text.match(/(\d+p)/i)
    const quality = qualityMatch ? qualityMatch[1] : 'unknown'
    
    mediaList.push({
      type: 'video',
      url: url,
      quality: quality,
      format: 'mp4'
    })
  }
  
  // 匹配图片链接
  // 格式: <img src="https://pbs.twimg.com/media/...">
  const imageRegex = /<img[^>]*src="(https:\/\/pbs\.twimg\.com\/media\/[^"]+)"[^>]*>/g
  
  while ((match = imageRegex.exec(html)) !== null) {
    const url = match[1]
    
    // 确保使用最高质量
    const highQualityUrl = url.includes('?') 
      ? url.replace(/name=\w+/, 'name=large')
      : url + '?format=jpg&name=large'
    
    mediaList.push({
      type: 'image',
      url: highQualityUrl
    })
  }
  
  // 按质量排序（1080p > 720p > 360p）
  mediaList.sort((a, b) => {
    if (a.type !== 'video' || b.type !== 'video') return 0
    
    const qualityOrder: Record<string, number> = {
      '1080p': 3,
      '720p': 2,
      '360p': 1,
      'unknown': 0
    }
    
    const aQuality = qualityOrder[a.quality || 'unknown'] || 0
    const bQuality = qualityOrder[b.quality || 'unknown'] || 0
    
    return bQuality - aQuality
  })
  
  return mediaList
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
