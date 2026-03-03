import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
}

/**
 * 使用 agent-browser 从 Twitter URL 提取媒体链接
 * 本地专用（agent-browser 无法在 Vercel 上运行）
 */
export async function extractTwitterMediaBrowser(twitterUrl: string): Promise<MediaInfo[]> {
  try {
    console.log(`[Browser] 打开 Twitter 页面: ${twitterUrl}`)
    
    // 1. 打开页面
    await execAsync(`agent-browser open "${twitterUrl}"`)
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 2. 提取图片链接
    const imagesScript = `
      JSON.stringify(
        Array.from(document.querySelectorAll('img[src*="pbs.twimg.com"]'))
          .map(img => ({
            type: 'image',
            url: img.src.replace(/&name=\\w+/, '&name=large'),
            width: img.naturalWidth,
            height: img.naturalHeight
          }))
          .filter(img => img.url.includes('/media/'))
      )
    `
    
    const { stdout: imagesJson } = await execAsync(`agent-browser eval "${imagesScript.replace(/\n/g, ' ')}"`)
    const images = JSON.parse(imagesJson.trim()) as MediaInfo[]
    
    console.log(`[Browser] 找到 ${images.length} 张图片`)
    
    // 3. 提取视频链接
    // Twitter 视频链接通常在 video 标签的 src 或 poster 属性中
    const videosScript = `
      JSON.stringify(
        Array.from(document.querySelectorAll('video'))
          .map(video => {
            const source = video.querySelector('source');
            return {
              type: 'video',
              url: source ? source.src : '',
              thumbnail: video.poster || '',
              width: video.videoWidth,
              height: video.videoHeight,
              format: 'mp4'
            };
          })
          .filter(v => v.url && v.url.includes('video.twimg.com'))
      )
    `
    
    const { stdout: videosJson } = await execAsync(`agent-browser eval "${videosScript.replace(/\n/g, ' ')}"`)
    const videos = JSON.parse(videosJson.trim()) as MediaInfo[]
    
    console.log(`[Browser] 找到 ${videos.length} 个视频`)
    
    // 4. 合并结果
    const allMedia = [...images, ...videos]
    
    // 去重（基于 URL）
    const uniqueMedia = Array.from(
      new Map(allMedia.map(item => [item.url, item])).values()
    )
    
    console.log(`[Browser] 总计 ${uniqueMedia.length} 个媒体`)
    
    return uniqueMedia
  } catch (error) {
    console.error('[Browser] 提取失败:', error)
    throw new Error(`Failed to extract media using agent-browser: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 从 Twitter URL 提取所有媒体链接（仅返回 URL 数组）
 */
export async function extractTwitterMediaUrlsBrowser(twitterUrl: string): Promise<string[]> {
  const mediaList = await extractTwitterMediaBrowser(twitterUrl)
  return mediaList.map(media => media.url)
}

/**
 * 批量提取多个 Twitter URL 的媒体链接
 */
export async function extractBatchTwitterMediaBrowser(twitterUrls: string[]): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {}
  
  for (const url of twitterUrls) {
    try {
      results[url] = await extractTwitterMediaUrlsBrowser(url)
    } catch (error) {
      console.error(`[Browser] 提取失败 ${url}:`, error)
      results[url] = []
    }
  }
  
  return results
}

/**
 * 备用方案：从 window.__INITIAL_STATE__ 提取媒体数据
 * Twitter 的媒体数据通常存储在这个全局变量中
 */
export async function extractTwitterMediaFromState(twitterUrl: string): Promise<MediaInfo[]> {
  try {
    console.log(`[Browser] 从 __INITIAL_STATE__ 提取媒体: ${twitterUrl}`)
    
    // 打开页面
    await execAsync(`agent-browser open "${twitterUrl}"`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 提取 __INITIAL_STATE__
    const stateScript = `
      JSON.stringify(window.__INITIAL_STATE__ || {})
    `
    
    const { stdout: stateJson } = await execAsync(`agent-browser eval "${stateScript}"`)
    const state = JSON.parse(stateJson.trim())
    
    // 从 state 中提取媒体数据
    // 这需要根据 Twitter 的实际数据结构调整
    const mediaList: MediaInfo[] = []
    
    // 遍历 state 查找媒体数据
    // Twitter 的媒体通常在 entities.media 或 extended_entities.media 中
    if (state.entities?.media) {
      state.entities.media.forEach((media: any) => {
        if (media.type === 'photo') {
          mediaList.push({
            type: 'image',
            url: media.media_url_https + '?name=large',
            width: media.sizes?.large?.w,
            height: media.sizes?.large?.h
          })
        } else if (media.type === 'video' || media.type === 'animated_gif') {
          const bestVariant = media.video_info?.variants
            ?.filter((v: any) => v.content_type === 'video/mp4')
            ?.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
          
          if (bestVariant) {
            mediaList.push({
              type: 'video',
              url: bestVariant.url,
              thumbnail: media.media_url_https,
              format: 'mp4'
            })
          }
        }
      })
    }
    
    console.log(`[Browser] 从 state 提取 ${mediaList.length} 个媒体`)
    
    return mediaList
  } catch (error) {
    console.error('[Browser] 从 state 提取失败:', error)
    return []
  }
}
