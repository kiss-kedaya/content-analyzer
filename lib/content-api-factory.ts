import { Prisma } from '@prisma/client'
import prisma from './db'
import { normalizeSource } from './source'

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
 * 构建排序子句
 */
function buildOrderByClause(orderBy: OrderBy) {
  return orderBy === 'createdAt'
    ? [{ createdAt: 'desc' as const }]
    : [
        { [orderBy]: 'desc' as const },
        { createdAt: 'desc' as const }
      ]
}

/**
 * 创建内容 API 工厂函数
 * @param model - Prisma 模型名称 ('content' 或 'adultContent')
 * @param useUpsert - 是否使用 upsert（content 使用，adultContent 不使用）
 */
export function createContentAPI<T extends 'content' | 'adultContent'>(
  model: T,
  useUpsert: boolean = false
) {
  type ModelDelegate = typeof prisma[T]
  const delegate = prisma[model] as ModelDelegate

  return {
    /**
     * 创建内容
     */
    async create(data: ContentInput) {
      const normalizedData = {
        source: normalizeSource(data.source),
        url: data.url,
        title: data.title,
        summary: data.summary,
        content: data.content,
        score: data.score,
        analyzedBy: data.analyzedBy,
        analyzedAt: new Date()
      }

      if (useUpsert) {
        return await (delegate as any).upsert({
          where: { url: data.url },
          update: normalizedData,
          create: normalizedData
        })
      } else {
        return await (delegate as any).create({
          data: normalizedData
        })
      }
    },

    /**
     * 获取所有内容（支持排序和分页）
     */
    async getAll(
      orderBy: string = 'score',
      page: number = 1,
      pageSize: number = 20
    ) {
      const validatedOrderBy = validateOrderBy(orderBy)

      const safePage = Math.max(1, Number(page) || 1)
      const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20))
      const skip = (safePage - 1) * safePageSize

      const orderByClause = buildOrderByClause(validatedOrderBy)

      return await (delegate as any).findMany({
        orderBy: orderByClause,
        skip,
        take: safePageSize
      })
    },

    /**
     * 获取内容总数
     */
    async getCount() {
      return await (delegate as any).count()
    },

    /**
     * 按来源获取内容
     */
    async getBySource(source: string, orderBy: OrderBy = 'score') {
      const orderByClause = buildOrderByClause(orderBy)

      return await (delegate as any).findMany({
        where: { source },
        orderBy: orderByClause
      })
    },

    /**
     * 获取单个内容详情
     */
    async getById(id: string) {
      return await (delegate as any).findUnique({
        where: { id }
      })
    },

    /**
     * 删除内容
     */
    async delete(id: string) {
      return await (delegate as any).delete({
        where: { id }
      })
    },

    /**
     * 获取统计信息
     */
    async getStats() {
      const total = await (delegate as any).count()
      const bySource = await (delegate as any).groupBy({
        by: ['source'],
        _count: true
      })

      return {
        total,
        bySource: bySource.reduce((acc: Record<string, number>, item: any) => {
          acc[item.source] = item._count
          return acc
        }, {} as Record<string, number>)
      }
    }
  }
}
