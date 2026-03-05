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
    
    console.log('[snapvid] 视频数据响应:', JSON.stringify(videoData).substring(0, 500))
    
    // 检查是否有错误状态码
    if (videoData.statusCode === 404) {
      console.log('[snapvid] 视频不可访问（404）:', videoData.msg)
      return [] // 返回空数组，表示没有媒体
    }
    
    if (videoData.status !== 'ok' || !videoData.data) {
      console.error('[snapvid] 视频数据格式错误:', videoData)
      throw new Error(`Failed to get video data: status=${videoData.status}, hasData=${!!videoData.data}`)
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
  
  // 匹配所有视频下载链接
  const videoRegex = /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>.*?下载 MP4 \((\d+)p\)/gs
  
  let match
  const allVideos: MediaInfo[] = []
  
  while ((match = videoRegex.exec(html)) !== null) {
    const url = match[1]
    const quality = match[2] + 'p'
    
    allVideos.push({
      type: 'video',
      url: url,
      quality: quality,
      format: 'mp4'
    })
  }
  
  console.log(`[snapvid] 找到 ${allVideos.length} 个视频链接`)
  
  // 按视频块分组（每个 tw-video div 是一个视频）
  const videoBlocks = html.match(/<div class="tw-video">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g) || []
  console.log(`[snapvid] 找到 ${videoBlocks.length} 个视频块`)
  
  // 从每个视频块中提取最高质量的视频
  for (const block of videoBlocks) {
    const blockVideos: MediaInfo[] = []
    const blockVideoRegex = /href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>.*?下载 MP4 \((\d+)p\)/gs
    
    let blockMatch
    while ((blockMatch = blockVideoRegex.exec(block)) !== null) {
      const url = blockMatch[1]
      const quality = blockMatch[2] + 'p'
      
      blockVideos.push({
        type: 'video',
        url: url,
        quality: quality,
        format: 'mp4'
      })
    }
    
    // 排序并选择最高质量
    blockVideos.sort((a, b) => {
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
        'unknown': -1
      }
      
      const aQuality = qualityOrder[a.quality || 'unknown'] || -1
      const bQuality = qualityOrder[b.quality || 'unknown'] || -1
      
      return bQuality - aQuality
    })
    
    // 添加最高质量的视频
    if (blockVideos.length > 0) {
      mediaList.push(blockVideos[0])
      console.log(`[snapvid] 提取视频: ${blockVideos[0].quality}`)
    }
  }
  
  console.log(`[snapvid] 共提取 ${mediaList.length} 个视频`)
  
  // 提取真实图片下载链接（必须包含"下载图片"文本）
  const imageRegex = /<a[^>]+href="(https:\/\/dl\.snapcdn\.app\/get\?token=[^"]+)"[^>]*>[^<]*<i[^>]*><\/i>[^<]*下载图片/gs
  const imageUrls: string[] = []
  
  while ((match = imageRegex.exec(html)) !== null) {
    const url = match[1]
    
    // 解码 token 中的 URL，检查是否是视频缩略图
    try {
      // 提取 token 参数
      const tokenMatch = url.match(/token=([^&]+)/)
      if (tokenMatch) {
        const token = tokenMatch[1]
        // JWT token 格式：header.payload.signature
        const parts = token.split('.')
        if (parts.length === 3) {
          // 解码 payload（Base64）
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          const actualUrl = payload.url || ''
          
          // 如果是视频缩略图，跳过
          if (actualUrl.includes('video_thumb') || actualUrl.includes('amplify_video_thumb')) {
            console.log('[snapvid] 跳过视频缩略图:', actualUrl)
            continue
          }
        }
      }
    } catch (e) {
      // 解码失败，保守起见跳过
      console.log('[snapvid] 无法解码 token，跳过')
      continue
    }
    
    imageUrls.push(url)
  }
  
  // 添加所有真实图片
  for (const url of imageUrls) {
    mediaList.push({
      type: 'image',
      url: url
    })
  }
  
  console.log(`[snapvid] 提取到 ${imageUrls.length} 张真实图片`)
  
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
