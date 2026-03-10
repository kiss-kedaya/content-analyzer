import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

interface Preferences {
  keywords: string[]
  avgScore: number
  preferredSources: string[]
  contentTypes: { tech: number; adult: number }
  totalFavorites: number
  analyzedAt: string
}

export async function GET() {
  try {
    // 获取所有收藏的内容（限制最多 1000 条）
    const [techContents, adultContents] = await Promise.all([
      prisma.content.findMany({
        where: { favorited: true },
        take: 1000
      }),
      prisma.adultContent.findMany({
        where: { favorited: true },
        take: 1000
      })
    ])
    
    const allFavorites = [...techContents, ...adultContents]
    
    if (allFavorites.length === 0) {
      return NextResponse.json({
        message: 'No favorites found',
        preferences: null
      })
    }
    
    // 提取关键词（从摘要和内容中）
    const keywords = extractKeywords(allFavorites)
    
    // 计算平均分
    const avgScore = allFavorites.reduce((sum, c) => sum + c.score, 0) / allFavorites.length
    
    // 提取偏好来源
    const sources = allFavorites.map(c => c.source)
    const preferredSources = [...new Set(sources)]
    
    // 内容类型分布
    const contentTypes = {
      tech: techContents.length,
      adult: adultContents.length
    }
    
    const preferences: Preferences = {
      keywords,
      avgScore: Math.round(avgScore * 10) / 10,
      preferredSources,
      contentTypes,
      totalFavorites: allFavorites.length,
      analyzedAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('Preferences analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze preferences' },
      { status: 500 }
    )
  }
}

// 提取关键词（简单实现）
function extractKeywords(contents: any[]): string[] {
  const allText = contents
    .map(c => `${c.summary} ${c.content}`)
    .join(' ')
  
  // 简单的关键词提取（基于词频）
  const words = allText
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
  
  // 统计词频
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // 排序并取前 20 个
  const sortedWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
  
  // 过滤常见停用词
  const stopWords = ['的', '了', '是', '在', '和', '有', '我', '你', '他', 'the', 'a', 'an', 'and', 'or', 'but']
  return sortedWords.filter(w => !stopWords.includes(w))
}
