/**
 * 使用 agent-browser 提取 Twitter 媒体链接
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface MediaInfo {
  type: 'image' | 'video'
  url: string
}

/**
 * 提取 Twitter 媒体链接
 */
export async function extractTwitterMediaBrowser(twitterUrl: string): Promise<string[]> {
  try {
    // 1. 打开 Twitter 页面
    await execAsync(`C:\\Users\\34438\\.openclaw\\workspace\\tools\\agent-browser.cmd open "${twitterUrl}"`)
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 2. 执行 JavaScript 提取媒体链接
    const imageScript = `JSON.stringify(Array.from(document.querySelectorAll('img')).filter(img => img.src && img.src.includes('pbs.twimg.com/media/')).map(img => img.src.replace(/name=\\\\w+/, 'name=large')))`
    
    const { stdout: imageOutput } = await execAsync(
      `C:\\Users\\34438\\.openclaw\\workspace\\tools\\agent-browser.cmd eval "${imageScript}"`
    )
    
    // 3. 解析结果
    const mediaUrls: string[] = []
    
    try {
      // 提取 JSON 部分并处理转义
      const jsonMatch = imageOutput.match(/\[.*\]/s)
      if (jsonMatch) {
        // 移除多余的转义
        const jsonStr = jsonMatch[0].replace(/\\"/g, '"')
        const images = JSON.parse(jsonStr)
        // 替换为高质量版本
        mediaUrls.push(...images.map((url: string) => url.replace(/name=\w+/, 'name=large')))
      }
    } catch (e) {
      console.error('Failed to parse image URLs:', e)
      console.error('Raw output:', imageOutput)
    }
    
    // 4. 去重
    return Array.from(new Set(mediaUrls))
  } catch (error) {
    console.error('Failed to extract media:', error)
    return []
  }
}

/**
 * 批量提取媒体链接
 */
export async function extractBatchTwitterMediaBrowser(urls: string[]): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {}
  
  for (const url of urls) {
    console.log(`Extracting media from: ${url}`)
    results[url] = await extractTwitterMediaBrowser(url)
  }
  
  return results
}

// CLI 测试
if (require.main === module) {
  const url = process.argv[2]
  if (!url) {
    console.error('Usage: tsx scripts/extract-media-browser.ts <twitter-url>')
    process.exit(1)
  }
  
  extractTwitterMediaBrowser(url).then(urls => {
    console.log('Media URLs:', urls)
  })
}
