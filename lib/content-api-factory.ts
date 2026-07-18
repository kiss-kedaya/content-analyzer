import prisma from './db'
import { getShanghaiDayRange } from './date'
import { normalizeSource } from './normalize-source'

const ALLOWED_ORDER_BY = ['score', 'createdAt', 'analyzedAt'] as const
export type OrderBy = typeof ALLOWED_ORDER_BY[number]

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
  sourceTime?: number
}

export interface ContentListOptions {
  orderBy?: string
  page?: number
  pageSize?: number
  q?: string
  date?: string
}

export interface ContentListPage<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

/** Fields needed by cards and list APIs. Full `content` is fetched only on detail pages. */
const LIST_ITEM_SELECT = {
  id: true,
  source: true,
  url: true,
  title: true,
  summary: true,
  score: true,
  analyzedAt: true,
  analyzedBy: true,
  favorited: true,
  mediaUrls: true,
} as const

const FAVORITE_ITEM_SELECT = {
  ...LIST_ITEM_SELECT,
  favoritedAt: true,
  createdAt: true,
} as const

function buildOrderByClause(orderBy: OrderBy) {
  return orderBy === 'createdAt'
    ? [{ createdAt: 'desc' as const }, { id: 'desc' as const }]
    : [{ [orderBy]: 'desc' as const }, { createdAt: 'desc' as const }, { id: 'desc' as const }]
}

function normalizeListOptions(options: ContentListOptions = {}) {
  const orderBy = validateOrderBy(options.orderBy || 'score')
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.max(1, Math.min(100, Number(options.pageSize) || 20))
  const q = options.q?.trim().slice(0, 100) || undefined
  const date = options.date || undefined
  return { orderBy, page, pageSize, q, date }
}

/** Builds the same filter for item, count, statistics, SSR and client pagination. */
export function buildContentWhere(options: Pick<ContentListOptions, 'q' | 'date'> = {}) {
  const and: Record<string, unknown>[] = []
  const q = options.q?.trim()

  if (options.date) {
    const range = getShanghaiDayRange(options.date)
    and.push({ analyzedAt: { gte: range.start, lt: range.end } })
  }

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { source: { contains: q, mode: 'insensitive' } },
      ],
    })
  }

  if (and.length === 0) return undefined
  if (and.length === 1) return and[0]
  return { AND: and }
}

export function createContentAPI<T extends 'content' | 'adultContent'>(
  model: T,
  useUpsert: boolean = false,
) {
  const delegate = prisma[model] as any

  async function list(options: ContentListOptions = {}): Promise<ContentListPage<any>> {
    const { orderBy, page, pageSize, q, date } = normalizeListOptions(options)
    const where = buildContentWhere({ q, date })
    const skip = (page - 1) * pageSize

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: buildOrderByClause(orderBy),
        skip,
        take: pageSize,
        select: LIST_ITEM_SELECT,
      }),
      delegate.count({ where }),
    ])

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: skip + items.length < total,
    }
  }

  return {
    async create(data: ContentInput) {
      const normalizedData: Record<string, unknown> = {
        source: normalizeSource(data.source),
        url: data.url,
        title: data.title,
        summary: data.summary,
        content: data.content,
        score: data.score,
        analyzedBy: data.analyzedBy,
        analyzedAt: new Date(),
      }

      if (model === 'content') {
        normalizedData.sourceTime = data.sourceTime ? new Date(data.sourceTime) : undefined
      }

      if (useUpsert) {
        return delegate.upsert({ where: { url: data.url }, update: normalizedData, create: normalizedData })
      }
      return delegate.create({ data: normalizedData })
    },

    list,

    async getAll(orderBy: string = 'score', page: number = 1, pageSize: number = 20) {
      const normalized = normalizeListOptions({ orderBy, page, pageSize })
      return delegate.findMany({
        orderBy: buildOrderByClause(normalized.orderBy),
        skip: (normalized.page - 1) * normalized.pageSize,
        take: normalized.pageSize,
      })
    },

    async getFavorites() {
      return delegate.findMany({
        where: { favorited: true },
        orderBy: [{ favoritedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: FAVORITE_ITEM_SELECT,
      })
    },

    async getCount(options: Pick<ContentListOptions, 'q' | 'date'> = {}) {
      return delegate.count({ where: buildContentWhere(options) })
    },

    async getBySource(source: string, orderBy: OrderBy = 'score', page: number = 1, pageSize: number = 20) {
      const safePage = Math.max(1, Number(page) || 1)
      const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20))
      return delegate.findMany({
        where: { source },
        orderBy: buildOrderByClause(orderBy),
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      })
    },

    async getById(id: string) {
      return delegate.findUnique({ where: { id } })
    },

    async delete(id: string) {
      const result = await delegate.deleteMany({ where: { id } })
      return { deleted: Number(result?.count || 0) > 0, count: Number(result?.count || 0) }
    },

    async getStats(options: Pick<ContentListOptions, 'q' | 'date'> = {}) {
      const where = buildContentWhere(options)
      const [total, bySource] = await Promise.all([
        delegate.count({ where }),
        delegate.groupBy({ by: ['source'], where, _count: true }),
      ])
      return {
        total,
        bySource: bySource.reduce((acc: Record<string, number>, item: { source: string; _count: number }) => {
          acc[item.source] = item._count
          return acc
        }, {}),
      }
    },
  }
}

export type { ContentInput as AdultContentInput }
