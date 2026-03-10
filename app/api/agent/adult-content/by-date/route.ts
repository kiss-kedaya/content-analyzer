import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getShanghaiDayRange } from '@/lib/date'

const QuerySchema = z.object({
  date: z.string().min(10),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  includeRaw: z.string().optional(),
  orderBy: z.enum(['score', 'createdAt', 'analyzedAt']).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const parsed = QuerySchema.safeParse({
    date: searchParams.get('date') ?? '',
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    includeRaw: searchParams.get('includeRaw') ?? undefined,
    orderBy: (searchParams.get('orderBy') ?? undefined) as any,
  })

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid query' } }, { status: 400 })
  }

  const page = Math.max(1, Number(parsed.data.page ?? '1') || 1)
  const pageSize = Math.min(10, Math.max(1, Number(parsed.data.pageSize ?? '10') || 10))
  const includeRaw = parsed.data.includeRaw === '1'
  const orderBy = parsed.data.orderBy ?? 'analyzedAt'

  let range
  try {
    range = getShanghaiDayRange(parsed.data.date)
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid date' } }, { status: 400 })
  }

  const skip = (page - 1) * pageSize

  const [total, items] = await Promise.all([
    prisma.adultContent.count({
      where: {
        analyzedAt: {
          gte: range.start,
          lt: range.end,
        }
      }
    }),
    prisma.adultContent.findMany({
      where: {
        analyzedAt: {
          gte: range.start,
          lt: range.end,
        }
      },
      orderBy: orderBy === 'createdAt'
        ? [{ createdAt: 'desc' }]
        : [{ [orderBy]: 'desc' as const }, { createdAt: 'desc' as const }],
      skip,
      take: pageSize,
    })
  ])

  let rawByUrl: Map<string, any> | undefined
  if (includeRaw && items.length) {
    const urls = [...new Set(items.map(i => i.url))]
    const raws = await prisma.sourceCache.findMany({
      where: { url: { in: urls }, status: 'ok' }
    })

    const missing = urls.filter(url => !raws.some(r => r.url === url))
    if (missing.length) {
      const { getOrFetchSourceText } = await import('@/lib/source-cache')
      const { mapLimit } = await import('@/lib/promise-pool')

      const MAX_MISSING = 20
      const TIME_BUDGET_MS = 10000
      const capped = missing.slice(0, MAX_MISSING)
      const deadline = Date.now() + TIME_BUDGET_MS

      await mapLimit(capped, 3, async (u) => {
        if (Date.now() > deadline) return
        const remaining = Math.max(1, deadline - Date.now())
        try {
          await Promise.race([
            getOrFetchSourceText(u, { preferProvider: 'defuddle' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), Math.min(8000, remaining)))
          ])
        } catch {
          // ignore
        }
      })
    }

    const updated = await prisma.sourceCache.findMany({
      where: { url: { in: urls }, status: 'ok' }
    })
    rawByUrl = new Map(updated.map(r => [r.url, r]))
  }

  return NextResponse.json({
    success: true,
    data: items.map(item => {
      const raw = rawByUrl?.get(item.url)
      return {
        ...item,
        raw: raw ? {
          provider: raw.provider,
          title: raw.title,
          text: raw.text,
          wordCount: raw.wordCount,
          sha256: raw.sha256,
          lastFetchedAt: raw.lastFetchedAt,
        } : null,
        rawStatus: raw ? 'cached' : 'missing'
      }
    }),
    pagination: {
      page,
      pageSize,
      total,
      hasMore: skip + items.length < total
    }
  })
}
