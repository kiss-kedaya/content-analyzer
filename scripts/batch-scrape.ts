/**
 * 批量抓取、分析、提取媒体并上传 Twitter 推文
 * 
 * 使用方法：
 * npm run batch-scrape
 */

import { extractTwitterMediaUrls } from '../lib/media-extractor-unified'

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

// 推文列表（新批次）
const tweets: Tweet[] = [
  { url: 'https://x.com/0xKingsKuan/status/2028998232530137170', type: 'tech', description: '技术内容（OpenClaw 安全警告）' },
  { url: 'https://x.com/Vw6WcQk/status/2028522850907513063', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/DoorAnal/status/2027966513786065011', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/bb__xiaokeai/status/2028848809888104621', type: 'adult', description: '成人内容（视频）' },
  { url: 'https://x.com/LGDYM777/status/2029044163606618460', type: 'adult', description: '成人内容（视频）' }
]

// 提取媒体链接
async function extractMedia(url: string): Promise<string[]> {
  console.log(`  🔍 提取媒体: ${url}`)
  
  try {
    const mediaUrls = await extractTwitterMediaUrls(url)
    console.log(`  ✅ 提取成功: ${mediaUrls.length} 个媒体`)
    return mediaUrls
  } catch (error) {
    console.log(`  ❌ 提取错误: ${error instanceof Error ? error.message : error}`)
    return []
  }
}

// 分析成人内容并打分（更严格的评分标准）
function analyzeAdultContent(tweet: Tweet, mediaUrls: string[]): ContentData {
  const username = tweet.url.match(/x\.com\/([^/]+)/)?.[1] || 'unknown'
  const hasVideo = mediaUrls.some(url => url.includes('video.twimg.com') || url.includes('snapcdn'))
  const hasImage = mediaUrls.some(url => url.includes('pbs.twimg.com') || url.includes('image'))
  
  // 新的评分标准：基础分 5.0（更严格）
  let score = 5.0
  
  // 质量评估
  if (hasVideo && mediaUrls.length > 0) {
    score += 2.0  // 有高质量视频
  } else if (hasImage) {
    score += 1.0  // 只有图片
  } else {
    score -= 1.0  // 无媒体
  }
  
  // 内容描述质量
  if (tweet.description && tweet.description.length > 50) {
    score += 0.5  // 有详细描述
  } else if (!tweet.description || tweet.description.length < 10) {
    score -= 0.5  // 描述太短或无描述
  }
  
  // 媒体数量
  if (mediaUrls.length > 3) {
    score += 0.5  // 多媒体内容
  } else if (mediaUrls.length === 0) {
    score -= 1.0  // 无媒体
  }
  
  // 特殊加分项
  if (tweet.description?.includes('高清') || tweet.description?.includes('1080p')) {
    score += 0.5
  }
  
  // 扣分项
  if (tweet.description?.includes('广告') || tweet.description?.includes('推广')) {
    score -= 2.0  // 广告内容
  }
  
  // 限制在 1.0-10.0 范围
  score = Math.min(10, Math.max(1.0, score))
  
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

// 分析技术内容并打分（更严格的评分标准）
function analyzeTechContent(tweet: Tweet, mediaUrls: string[]): ContentData {
  const username = tweet.url.match(/x\.com\/([^/]+)/)?.[1] || 'unknown'
  
  // 新的评分标准：基础分 5.0（更严格）
  let score = 5.0
  
  // 内容质量评估
  if (tweet.description) {
    const length = tweet.description.length
    if (length > 200) {
      score += 2.0  // 详细内容
    } else if (length > 100) {
      score += 1.0  // 中等长度
    } else if (length < 20) {
      score -= 1.0  // 内容太短
    }
  }
  
  // 技术关键词
  const techKeywords = ['OpenClaw', '教程', 'API', '开发', '代码', '技术', '工具']
  const matchedKeywords = techKeywords.filter(kw => tweet.description?.includes(kw))
  score += matchedKeywords.length * 0.5
  
  // 实用性
  if (tweet.description?.includes('教程') || tweet.description?.includes('指南')) {
    score += 1.0  // 实用教程
  }
  
  // 扣分项
  if (tweet.description?.includes('广告') || tweet.description?.includes('推广')) {
    score -= 2.0  // 广告内容
  }
  
  if (!tweet.description || tweet.description.length < 10) {
    score -= 1.0  // 无描述或太短
  }
  
  // 限制在 1.0-10.0 范围
  score = Math.min(10, Math.max(1.0, score))
  
  return {
    source: 'twitter',
    url: tweet.url,
    title: `@${username} 的推文`,
    summary: tweet.description || '技术内容',
    content: `来自 @${username} 的推文\n\n${tweet.description || '技术内容'}\n\n技术关键词: ${matchedKeywords.join(', ')}\n实用性评估: 高`,
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
