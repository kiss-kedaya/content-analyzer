/**
 * 批量抓取、分析、提取媒体并上传 Twitter 推文
 * 
 * 使用方法：
 * npm run batch-scrape
 */

import { extractTwitterMediaUrlsBrowser } from '../lib/media-extractor-browser'

const API_URL = process.env.API_URL || 'https://ca.kedaya.xyz'

interface Tweet {
  url: string
  type: 'adult' | 'tech'
  description?: string
}

interface ContentData {
  source: string
  url: string
  title?: string
  summary: string
  content: string
  score: number
  mediaUrls?: string[]
  analyzedBy: string
}

// 推文列表
const tweets: Tweet[] = [
  { url: 'https://x.com/illqwq1408/status/2028849851010854931', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/jingyeshiwo/status/2028750753293320211', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/bb_xiaokeaii/status/2028849078612951502', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/w0612ang/status/2028068573651087697', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/xiaollei404/status/2028158364073791766', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/Killian_4real/status/2028840999427203268', type: 'adult', description: '成人内容（视频，27分钟）' },
  { url: 'https://x.com/DDjkrd2848/status/2028741105899188626', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/sxiaoliya/status/2028862849918148612', type: 'adult', description: '成人内容（图片）' },
  { url: 'https://x.com/xiaoyy99/status/2027971688651239782', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/okxchinese/status/2028806839773839683', type: 'tech', description: '技术内容（OKX OnchainOS 接入 OpenClaw 教程）' }
]

// 提取媒体链接
async function extractMedia(url: string): Promise<string[]> {
  console.log(`  🔍 提取媒体: ${url}`)
  
  try {
    const mediaUrls = await extractTwitterMediaUrlsBrowser(url)
    console.log(`  ✅ 提取成功: ${mediaUrls.length} 个媒体`)
    return mediaUrls
  } catch (error) {
    console.log(`  ❌ 提取错误: ${error instanceof Error ? error.message : error}`)
    return []
  }
}

// 分析成人内容并打分
function analyzeAdultContent(tweet: Tweet, mediaUrls: string[]): ContentData {
  const username = tweet.url.match(/x\.com\/([^/]+)/)?.[1] || 'unknown'
  const hasVideo = mediaUrls.some(url => url.includes('video.twimg.com'))
  const hasImage = mediaUrls.some(url => url.includes('pbs.twimg.com'))
  
  // 评分标准：画质、内容质量、互动数据
  let score = 7.0
  
  // 有视频 +1分
  if (hasVideo) score += 1.0
  
  // 有图片 +0.5分
  if (hasImage) score += 0.5
  
  // 媒体数量多 +0.5分
  if (mediaUrls.length > 2) score += 0.5
  
  // 长视频（27分钟）+1分
  if (tweet.description?.includes('27分钟')) score += 1.0
  
  // 限制在 0-10 范围
  score = Math.min(10, Math.max(0, score))
  
  return {
    source: 'twitter',
    url: tweet.url,
    title: `@${username} 的推文`,
    summary: tweet.description || '成人内容',
    content: `来自 @${username} 的推文\n\n${tweet.description || '成人内容'}\n\n媒体数量: ${mediaUrls.length}\n类型: ${hasVideo ? '视频' : ''}${hasImage ? '图片' : ''}`,
    score: score,
    mediaUrls: mediaUrls,
    analyzedBy: 'OpenClaw Agent'
  }
}

// 分析技术内容并打分
function analyzeTechContent(tweet: Tweet, mediaUrls: string[]): ContentData {
  const username = tweet.url.match(/x\.com\/([^/]+)/)?.[1] || 'unknown'
  
  // 评分标准：实用性、技术深度、相关性
  let score = 8.0
  
  // OKX + OpenClaw 教程，实用性高
  if (tweet.description?.includes('OpenClaw')) score += 1.0
  if (tweet.description?.includes('教程')) score += 0.5
  
  // 限制在 0-10 范围
  score = Math.min(10, Math.max(0, score))
  
  return {
    source: 'twitter',
    url: tweet.url,
    title: `@${username} 的推文`,
    summary: tweet.description || '技术内容',
    content: `来自 @${username} 的推文\n\n${tweet.description || '技术内容'}\n\nOKX OnchainOS 接入 OpenClaw 教程\n实用性高，技术深度适中`,
    score: score,
    analyzedBy: 'OpenClaw Agent'
  }
}

// 批量上传成人内容
async function uploadAdultContent(contents: ContentData[]) {
  console.log(`\n📤 上传成人内容: ${contents.length} 条`)
  
  try {
    const response = await fetch(`${API_URL}/api/adult-content/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contents)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Upload failed')
    }
    
    const result = await response.json()
    console.log(`✅ 上传成功: ${result.success} 条`)
    console.log(`❌ 上传失败: ${result.failed} 条`)
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n失败详情:')
      result.errors.forEach((err: any) => {
        console.log(`  - [${err.index}] ${err.url}: ${err.error}`)
      })
    }
    
    return result
  } catch (error) {
    console.error('❌ 批量上传失败:', error instanceof Error ? error.message : error)
    throw error
  }
}

// 批量上传技术内容
async function uploadTechContent(contents: ContentData[]) {
  console.log(`\n📤 上传技术内容: ${contents.length} 条`)
  
  try {
    const response = await fetch(`${API_URL}/api/content/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contents)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || error.error || 'Upload failed')
    }
    
    const result = await response.json()
    console.log(`✅ 上传成功: ${result.success} 条`)
    console.log(`❌ 上传失败: ${result.failed} 条`)
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n失败详情:')
      result.errors.forEach((err: any) => {
        console.log(`  - [${err.index}] ${err.url}: ${err.error}`)
      })
    }
    
    return result
  } catch (error) {
    console.error('❌ 批量上传失败:', error instanceof Error ? error.message : error)
    throw error
  }
}

// 主函数
async function main() {
  console.log('🚀 开始批量抓取、分析和上传 Twitter 推文\n')
  console.log(`总推文数: ${tweets.length}`)
  console.log(`成人内容: ${tweets.filter(t => t.type === 'adult').length} 条`)
  console.log(`技术内容: ${tweets.filter(t => t.type === 'tech').length} 条`)
  console.log('')
  
  const adultContents: ContentData[] = []
  const techContents: ContentData[] = []
  
  // 步骤 1: 提取媒体并分析
  console.log('📋 步骤 1: 提取媒体并分析内容\n')
  
  for (let i = 0; i < tweets.length; i++) {
    const tweet = tweets[i]
    console.log(`[${i + 1}/${tweets.length}] ${tweet.url}`)
    console.log(`  类型: ${tweet.type === 'adult' ? '成人内容' : '技术内容'}`)
    
    // 提取媒体
    const mediaUrls = await extractMedia(tweet.url)
    
    // 分析并打分
    if (tweet.type === 'adult') {
      const content = analyzeAdultContent(tweet, mediaUrls)
      adultContents.push(content)
      console.log(`  📊 评分: ${content.score.toFixed(1)}/10`)
    } else {
      const content = analyzeTechContent(tweet, mediaUrls)
      techContents.push(content)
      console.log(`  📊 评分: ${content.score.toFixed(1)}/10`)
    }
    
    console.log('')
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // 步骤 2: 批量上传
  console.log('\n📋 步骤 2: 批量上传到网站\n')
  
  if (adultContents.length > 0) {
    await uploadAdultContent(adultContents)
  }
  
  if (techContents.length > 0) {
    await uploadTechContent(techContents)
  }
  
  // 总结
  console.log('\n✅ 批量处理完成！')
  console.log(`\n📊 统计:`)
  console.log(`  - 成人内容: ${adultContents.length} 条`)
  console.log(`  - 技术内容: ${techContents.length} 条`)
  console.log(`  - 总计: ${adultContents.length + techContents.length} 条`)
  console.log(`\n🌐 查看结果: ${API_URL}`)
}

main().catch(error => {
  console.error('❌ 执行失败:', error)
  process.exit(1)
})
