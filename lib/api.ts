import prisma from './db'

export interface ContentInput {
  source: string
  url: string
  title?: string
  summary: string
  content: string
  score: number
  analyzedBy?: string
}

/**
 * 创建内容
 */
export async function createContent(data: ContentInput) {
  return await prisma.content.upsert({
    where: { url: data.url },
    update: {
      title: data.title,
      summary: data.summary,
      content: data.content,
      score: data.score,
      analyzedBy: data.analyzedBy,
      analyzedAt: new Date()
    },
    create: {
      source: data.source,
      url: data.url,
      title: data.title,
      summary: data.summary,
      content: data.content,
      score: data.score,
      analyzedBy: data.analyzedBy
    }
  })
}

/**
 * 获取所有内容（支持排序）
 */
export async function getAllContents(orderBy: 'score' | 'createdAt' | 'analyzedAt' = 'score') {
  return await prisma.content.findMany({
    orderBy: [
      { [orderBy]: 'desc' }
    ]
  })
}

/**
 * 按来源获取内容
 */
export async function getContentsBySource(source: string, orderBy: 'score' | 'createdAt' | 'analyzedAt' = 'score') {
  return await prisma.content.findMany({
    where: { source },
    orderBy: [
      { [orderBy]: 'desc' }
    ]
  })
}

/**
 * 获取单个内容详情
 */
export async function getContentById(id: string) {
  return await prisma.content.findUnique({
    where: { id }
  })
}

/**
 * 删除内容
 */
export async function deleteContent(id: string) {
  return await prisma.content.delete({
    where: { id }
  })
}

/**
 * 获取统计信息
 */
export async function getStats() {
  const total = await prisma.content.count()
  const bySource = await prisma.content.groupBy({
    by: ['source'],
    _count: true
  })
  
  return {
    total,
    bySource: bySource.reduce((acc, item) => {
      acc[item.source] = item._count
      return acc
    }, {} as Record<string, number>)
  }
}
