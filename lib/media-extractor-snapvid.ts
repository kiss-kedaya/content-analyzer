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
 * 从 HTML 中提取媒体链接（优化版：区分纯图片和视频+图片）
 */
function extractVideoUrlsFromHtml(html: string): MediaInfo[] {
  const mediaList: MediaInfo[] = []
  
  // 情况 1：检查是否是纯图片（photo-list）
  if (html.includes('photo-list')) {
    console.log('[snapvid] 检测到纯图片推文（photo-list）')
    
    // 提取所有图片下载链接
    const photoListRegex = /<a href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*title="下载图片"/g
    let match
    
    while ((match = photoListRegex.exec(html)) !== null) {
      mediaList.push({
        type: 'image',
        url: match[1]
      })
    }
    
    console.log(`[snapvid] 提取到 ${mediaList.length} 张图片`)
    return mediaList
  }
  
  // 情况 2：视频 + 图片（tw-video）
  console.log('[snapvid] 检测到视频推文（tw-video）')
  
  // 匹配视频下载链接
  const videoRegex = /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>.*?下载 MP4 \((\d+)p\)/gs
  
  let match
  const videos: MediaInfo[] = []
  
  while ((match = videoRegex.exec(html)) !== null) {
    const url = match[1]
    const quality = match[2] + 'p'
    
    videos.push({
      type: 'video',
      url: url,
      quality: quality,
      format: 'mp4'
    })
  }
  
  // 只保留最高质量的视频
  videos.sort((a, b) => {
    const qualityOrder: Record<string, number> = {
      '1280p': 5,
      '1080p': 4,
      '852p': 3,
      '720p': 2,
      '568p': 1,
      '360p': 0,
      'unknown': -1
    }
    
    const aQuality = qualityOrder[a.quality || 'unknown'] || -1
    const bQuality = qualityOrder[b.quality || 'unknown'] || -1
    
    return bQuality - aQuality
  })
  
  // 添加最高质量的视频
  if (videos.length > 0) {
    mediaList.push(videos[0])
    console.log(`[snapvid] 提取到视频: ${videos[0].quality}`)
  }
  
  // 提取所有图片下载链接
  const imageRegex = /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>.*?下载图片/gs
  const imageUrls: string[] = []
  
  while ((match = imageRegex.exec(html)) !== null) {
    imageUrls.push(match[1])
  }
  
  // 如果有视频，需要过滤掉视频缩略图
  if (videos.length > 0 && imageUrls.length > 0) {
    console.log('[snapvid] 过滤视频缩略图')
    
    // 查找视频块，提取缩略图 URL
    const videoBlockRegex = /<div class="tw-video">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g
    const videoBlocks = html.match(videoBlockRegex) || []
    
    const thumbnailUrls = new Set<string>()
    for (const block of videoBlocks) {
      // 检查是否包含视频下载链接
      if (block.includes('下载 MP4')) {
        // 提取这个块中的图片 URL（这些是视频缩略图）
        const imgMatch = block.match(/<img[^>]+src="([^"]+)"/)
        if (imgMatch) {
          const imgUrl = imgMatch[1]
          // 如果是 video_thumb 或 amplify_video_thumb，标记为缩略图
          if (imgUrl.includes('video_thumb') || imgUrl.includes('amplify_video_thumb')) {
            // 查找对应的下载链接
            const downloadMatch = block.match(/href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>.*?下载图片/)
            if (downloadMatch) {
              thumbnailUrls.add(downloadMatch[1])
            }
          }
        }
      }
    }
    
    // 过滤掉缩略图，只保留真实图片
    for (const url of imageUrls) {
      if (!thumbnailUrls.has(url)) {
        mediaList.push({
          type: 'image',
          url: url
        })
      }
    }
    
    console.log(`[snapvid] 过滤后剩余 ${imageUrls.length - thumbnailUrls.size} 张真实图片`)
  } else {
    // 没有视频，所有图片都是真实图片
    for (const url of imageUrls) {
      mediaList.push({
        type: 'image',
        url: url
      })
    }
    
    console.log(`[snapvid] 提取到 ${imageUrls.length} 张图片`)
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

/**
 * 获取最高质量的视频链接
 */
export async function getHighestQualityVideo(twitterUrl: string): Promise<string | null> {
  const mediaList = await extractWithSnapvid(twitterUrl)
  const videos = mediaList.filter(m => m.type === 'video')
  
  // 已经按质量排序，返回第一个
  return videos.length > 0 ? videos[0].url : null
}
