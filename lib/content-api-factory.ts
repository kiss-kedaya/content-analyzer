import prisma from './db'
import type { AdultContent as AdultContentRecord, Content as ContentRecord } from '@prisma/client'
import { getShanghaiDayRange } from './date'
import { normalizeSource } from './normalize-source'
import { normalizePersistentMediaUrls } from './persistent-media'
import type { VideoFeedSource } from './media-display'
import type { ContentListItem } from '@/types'

const ALLOWED_ORDER_BY = ['createdAt'] as const
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
  content: string
  /** @deprecated The stored excerpt is now derived from content. */
  summary?: string
  /** @deprecated Scores are no longer used and are stored as 0. */
  score?: number
  analyzedBy?: string
  sourceTime?: number
  mediaUrls?: string[]
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
  createdAt: true,
  analyzedBy: true,
  favorited: true,
  mediaUrls: true,
} as const

const FAVORITE_ITEM_SELECT = {
  ...LIST_ITEM_SELECT,
  favoritedAt: true,
} as const

const VIDEO_FEED_SELECT = {
  id: true,
  title: true,
  summary: true,
  mediaUrls: true,
} as const

type ModelRecord<T extends 'content' | 'adultContent'> = T extends 'content'
  ? ContentRecord
  : AdultContentRecord

type FavoriteListItem = Omit<ContentListItem, 'createdAt'> & { createdAt: Date; favoritedAt: Date | null }

/**
 * Prisma generates distinct delegate overloads for structurally identical models.
 * This narrow adapter keeps the shared factory typed without leaking `any`; each
 * result is cast once to the select shape defined immediately above.
 */
type SharedContentDelegate = {
  findMany(args: unknown): Promise<unknown[]>
  count(args?: unknown): Promise<number>
  groupBy(args: unknown): Promise<unknown[]>
  findUnique(args: unknown): Promise<unknown | null>
  create(args: unknown): Promise<unknown>
  upsert(args: unknown): Promise<unknown>
  deleteMany(args: unknown): Promise<{ count: number }>
  updateMany(args: unknown): Promise<{ count: number }>
}

function buildOrderByClause() {
  return [{ createdAt: 'desc' as const }, { id: 'desc' as const }]
}

export function getStoredContentFields(data: Pick<ContentInput, 'content'>) {
  return {
    summary: data.content,
    content: data.content,
    score: 0,
  } as const
}

function normalizeListOptions(options: ContentListOptions = {}) {
  const orderBy = validateOrderBy(options.orderBy || 'createdAt')
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
    and.push({ createdAt: { gte: range.start, lt: range.end } })
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
  const delegate = prisma[model] as unknown as SharedContentDelegate

  async function list(options: ContentListOptions = {}): Promise<ContentListPage<ContentListItem>> {
    const { orderBy, page, pageSize, q, date } = normalizeListOptions(options)
    const where = buildContentWhere({ q, date })
    const skip = (page - 1) * pageSize

    const [rawItems, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: buildOrderByClause(),
        skip,
        take: pageSize,
        select: LIST_ITEM_SELECT,
      }),
      delegate.count({ where }),
    ])
    const items = rawItems as ContentListItem[]

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
        // Keep legacy non-null columns compatible without generating an AI summary or score.
        ...getStoredContentFields(data),
        analyzedBy: data.analyzedBy,
        analyzedAt: new Date(),
      }

      if (model === 'content') {
        normalizedData.sourceTime = data.sourceTime ? new Date(data.sourceTime) : undefined
      }

      if (data.mediaUrls) {
        const mediaUrls = normalizePersistentMediaUrls(data.mediaUrls)
        normalizedData.mediaUrls = mediaUrls
        normalizedData.mediaFetchedAt = mediaUrls.length > 0 ? new Date() : undefined
        normalizedData.mediaSourceUrl = mediaUrls.length > 0 ? data.url : undefined
      }

      if (useUpsert) {
        const result = await delegate.upsert({ where: { url: data.url }, update: normalizedData, create: normalizedData })
        return result as ModelRecord<T>
      }
      const result = await delegate.create({ data: normalizedData })
      return result as ModelRecord<T>
    },

    list,

    async getAll(orderBy: string = 'createdAt', page: number = 1, pageSize: number = 20) {
      const normalized = normalizeListOptions({ orderBy, page, pageSize })
      const rows = await delegate.findMany({
        orderBy: buildOrderByClause(),
        skip: (normalized.page - 1) * normalized.pageSize,
        take: normalized.pageSize,
      })
      return rows as ModelRecord<T>[]
    },

    async getFavorites() {
      const rows = await delegate.findMany({
        where: { favorited: true },
        orderBy: [{ favoritedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: FAVORITE_ITEM_SELECT,
      })
      return rows as FavoriteListItem[]
    },

    async getVideoFeedSources(): Promise<VideoFeedSource[]> {
      const rows = await delegate.findMany({
        where: { mediaUrls: { isEmpty: false } },
        orderBy: buildOrderByClause(),
        select: VIDEO_FEED_SELECT,
      })
      return rows as VideoFeedSource[]
    },

    async getCount(options: Pick<ContentListOptions, 'q' | 'date'> = {}) {
      return delegate.count({ where: buildContentWhere(options) })
    },

    async getBySource(source: string, orderBy: OrderBy = 'createdAt', page: number = 1, pageSize: number = 20) {
      const safePage = Math.max(1, Number(page) || 1)
      const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20))
      const rows = await delegate.findMany({
        where: { source },
        orderBy: buildOrderByClause(),
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
      })
      return rows as ModelRecord<T>[]
    },

    async getById(id: string) {
      const row = await delegate.findUnique({ where: { id } })
      return row as ModelRecord<T> | null
    },

    async delete(id: string) {
      const result = await delegate.deleteMany({ where: { id } })
      return { deleted: Number(result?.count || 0) > 0, count: Number(result?.count || 0) }
    },

    async setFavorite(id: string, favorited: boolean) {
      const result = await delegate.updateMany({
        where: { id },
        data: { favorited, favoritedAt: favorited ? new Date() : null },
      })
      return Number(result?.count || 0) > 0
    },

    async getStats(options: Pick<ContentListOptions, 'q' | 'date'> = {}) {
      const where = buildContentWhere(options)
      const [total, rawBySource] = await Promise.all([
        delegate.count({ where }),
        delegate.groupBy({ by: ['source'], where, _count: true }),
      ])
      const bySource = rawBySource as Array<{ source: string; _count: number }>
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
