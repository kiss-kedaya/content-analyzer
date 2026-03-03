import { BrowserScraper } from './browser'
import { ContentAnalyzer } from './analyzer'
import prisma from './db'

/**
 * 主抓取和分析流程
 */
export async function scrapeAndAnalyze() {
  console.log('Starting content scraping and analysis...')
  
  const scraper = new BrowserScraper()
  const analyzer = new ContentAnalyzer()
  
  try {
    // 1. 抓取内容
    console.log('Scraping Twitter...')
    const twitterContents = await scraper.scrapeTwitter()
    
    console.log('Scraping Xiaohongshu...')
    const xiaohongshuContents = await scraper.scrapeXiaohongshu()
    
    console.log('Scraping LinuxDo...')
    const linuxdoContents = await scraper.scrapeLinuxDo()
    
    const allContents = [
      ...twitterContents,
      ...xiaohongshuContents,
      ...linuxdoContents
    ]
    
    console.log(`Total contents scraped: ${allContents.length}`)
    
    // 2. AI 分析
    console.log('Analyzing contents with AI...')
    const analyzedContents = await analyzer.analyzeAll(allContents)
    
    // 3. 存储到数据库
    console.log('Saving to database...')
    for (const content of analyzedContents) {
      await prisma.content.upsert({
        where: { url: content.url },
        update: {
          title: content.title,
          summary: content.summary,
          score: content.score,
          analyzedAt: new Date()
        },
        create: {
          source: content.source,
          url: content.url,
          title: content.title,
          summary: content.summary,
          score: content.score
        }
      })
    }
    
    console.log('Done! Analyzed and saved', analyzedContents.length, 'contents')
    return analyzedContents
  } catch (error) {
    console.error('Error in scrapeAndAnalyze:', error)
    throw error
  }
}

/**
 * 获取所有内容（按评分排序）
 */
export async function getAllContents() {
  return await prisma.content.findMany({
    orderBy: [
      { score: 'desc' },
      { analyzedAt: 'desc' }
    ]
  })
}

/**
 * 按来源获取内容
 */
export async function getContentsBySource(source: string) {
  return await prisma.content.findMany({
    where: { source },
    orderBy: [
      { score: 'desc' },
      { analyzedAt: 'desc' }
    ]
  })
}
