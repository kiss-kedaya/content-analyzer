import YTDlpWrap from 'yt-dlp-wrap'

export interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
}

/**
 * 从 Twitter URL 提取媒体链接（图片和视频）
 * 使用 yt-dlp 提取高质量媒体链接
 */
export async function extractTwitterMedia(twitterUrl: string): Promise<MediaInfo[]> {
  try {
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
    
    return uniqueMedia
  } catch (error) {
    console.error('Error extracting Twitter media:', error)
    throw new Error(`Failed to extract media from Twitter URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
  
  for (const url of twitterUrls) {
    try {
      results[url] = await extractTwitterMediaUrls(url)
    } catch (error) {
      console.error(`Failed to extract media from ${url}:`, error)
      results[url] = []
    }
  }
  
  return results
}
