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

// 允许的排序字段
const ALLOWED_ORDER_BY = ['score', 'createdAt', 'analyzedAt'] as const
export type OrderBy = typeof ALLOWED_ORDER_BY[number]

/**
 * 验证 orderBy 参数
 */
export function validateOrderBy(value: string): OrderBy {
  if (!ALLOWED_ORDER_BY.includes(value as OrderBy)) {
    throw new Error(`Invalid orderBy parameter: ${value}. Allowed values: ${ALLOWED_ORDER_BY.join(', ')}`)
  }
  return value as OrderBy
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
  orderBy: string = 'score',
  page: number = 1,
  pageSize: number = 20
) {
  const validatedOrderBy = validateOrderBy(orderBy)
  const skip = (page - 1) * pageSize
  
  // 构建排序对象：主排序 + 第二排序（createdAt）
  const orderByClause = validatedOrderBy === 'createdAt'
    ? [{ createdAt: 'desc' as const }]
    : [
        { [validatedOrderBy]: 'desc' as const },
        { createdAt: 'desc' as const }
      ]
  
  return await prisma.adultContent.findMany({
    orderBy: orderByClause,
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
