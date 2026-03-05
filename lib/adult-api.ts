import prisma from './db'

export interface AdultContentInput {
  source: string
  url: string
  title?: string
  summary: string
  content: string
  score: number
  analyzedBy?: string
}

// 创建成人内容
export async function createAdultContent(data: AdultContentInput) {
  return await prisma.adultContent.create({
    data: {
      source: data.source,
      url: data.url,
      title: data.title,
      summary: data.summary,
      content: data.content,
      score: data.score,
      analyzedBy: data.analyzedBy,
      analyzedAt: new Date()
    }
  })
}

// 获取所有成人内容（支持分页）
export async function getAllAdultContents(
  orderBy: 'score' | 'createdAt' | 'analyzedAt' = 'score',
  page: number = 1,
  pageSize: number = 20
) {
  const skip = (page - 1) * pageSize
  
  return await prisma.adultContent.findMany({
    orderBy: {
      [orderBy]: 'desc'
    },
    skip,
    take: pageSize
  })
}

// 获取成人内容总数
export async function getAdultContentsCount() {
  return await prisma.adultContent.count()
}

// 根据 ID 获取成人内容
export async function getAdultContentById(id: string) {
  return await prisma.adultContent.findUnique({
    where: { id }
  })
}

// 删除成人内容
export async function deleteAdultContent(id: string) {
  return await prisma.adultContent.delete({
    where: { id }
  })
}

// 获取统计信息
export async function getAdultContentStats() {
  const total = await prisma.adultContent.count()
  
  const bySource = await prisma.adultContent.groupBy({
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
