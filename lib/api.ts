import prisma from './db'
import { normalizeSource } from './source'

export interface ContentInput {
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

/**
 * 创建内容
 */
export async function createContent(data: ContentInput) {
  return await prisma.content.upsert({
    where: { url: data.url },
    update: {
      source: normalizeSource(data.source),
      title: data.title,
      summary: data.summary,
      content: data.content,
      score: data.score,
      analyzedBy: data.analyzedBy,
      analyzedAt: new Date()
    },
    create: {
      source: normalizeSource(data.source),
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
 * 获取所有内容（支持排序和分页）
 */
export async function getAllContents(
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
  
  return await prisma.content.findMany({
    orderBy: orderByClause,
    skip,
    take: pageSize
  })
}

/**
 * 获取内容总数
 */
export async function getContentsCount() {
  return await prisma.content.count()
}

/**
 * 按来源获取内容
 */
export async function getContentsBySource(source: string, orderBy: 'score' | 'createdAt' | 'analyzedAt' = 'score') {
  // 构建排序对象：主排序 + 第二排序（createdAt）
  const orderByClause = orderBy === 'createdAt'
    ? [{ createdAt: 'desc' as const }]
    : [
        { [orderBy]: 'desc' as const },
        { createdAt: 'desc' as const }
      ]
  
  return await prisma.content.findMany({
    where: { source },
    orderBy: orderByClause
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
