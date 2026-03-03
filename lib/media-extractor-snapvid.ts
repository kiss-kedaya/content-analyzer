/**
 * Snapvid.net API 媒体提取器
 * 第三方 Twitter 视频下载服务
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
 * 注意：这是第三方服务，可能有速率限制或不稳定
 */
export async function extractWithSnapvid(twitterUrl: string): Promise<MediaInfo[]> {
  console.log('[snapvid] 提取媒体:', twitterUrl)
  
  // 验证 URL
  if (!isValidTwitterUrl(twitterUrl)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  try {
    // 尝试多个可能的 API 端点
    const endpoints = [
      'https://snapvid.net/api/download',
      'https://snapvid.net/api/twitter',
      'https://snapvid.net/api/extract'
    ]
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          body: JSON.stringify({
            url: twitterUrl,
            link: twitterUrl,
            video_url: twitterUrl
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          const mediaList = parseSnapvidResponse(data)
          
          if (mediaList.length > 0) {
            console.log(`[snapvid] 提取成功: ${mediaList.length} 个媒体`)
            return mediaList
          }
        }
      } catch (error) {
        // 尝试下一个端点
        continue
      }
    }
    
    throw new Error('All snapvid API endpoints failed')
  } catch (error) {
    console.error('[snapvid] 提取失败:', error)
    throw error
  }
}

/**
 * 解析 snapvid API 响应
 */
function parseSnapvidResponse(data: any): MediaInfo[] {
  const mediaList: MediaInfo[] = []
  
  // 尝试多种可能的响应格式
  
  // 格式 1: { videos: [...], images: [...] }
  if (data.videos && Array.isArray(data.videos)) {
    data.videos.forEach((video: any) => {
      mediaList.push({
        type: 'video',
        url: video.url || video.download_url || video.link,
        thumbnail: video.thumbnail || video.thumb,
        quality: video.quality || video.resolution,
        format: 'mp4'
      })
    })
  }
  
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((image: any) => {
      mediaList.push({
        type: 'image',
        url: image.url || image.download_url || image.link
      })
    })
  }
  
  // 格式 2: { media: [...] }
  if (data.media && Array.isArray(data.media)) {
    data.media.forEach((item: any) => {
      mediaList.push({
        type: item.type === 'video' ? 'video' : 'image',
        url: item.url || item.download_url,
        thumbnail: item.thumbnail,
        quality: item.quality,
        format: item.format || 'mp4'
      })
    })
  }
  
  // 格式 3: { download_url: "...", type: "video" }
  if (data.download_url) {
    mediaList.push({
      type: data.type === 'video' ? 'video' : 'image',
      url: data.download_url,
      thumbnail: data.thumbnail,
      quality: data.quality,
      format: data.format || 'mp4'
    })
  }
  
  // 格式 4: { url: "...", ... }
  if (data.url && !data.download_url) {
    mediaList.push({
      type: data.type === 'video' ? 'video' : 'image',
      url: data.url,
      thumbnail: data.thumbnail,
      quality: data.quality,
      format: data.format || 'mp4'
    })
  }
  
  return mediaList
}

/**
 * 提取媒体 URL（仅返回 URL 数组）
 */
export async function extractSnapvidMediaUrls(twitterUrl: string): Promise<string[]> {
  const mediaList = await extractWithSnapvid(twitterUrl)
  return mediaList.map(media => media.url)
}
