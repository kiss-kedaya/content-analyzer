import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getShanghaiDayRange } from '@/lib/date'
import { renderListMarkdown } from '@/lib/md'

const QuerySchema = z.object({
  date: z.string().min(10),
  page: z.string().optional(),
  pageSize: z.string().optional(),
  orderBy: z.enum(['score', 'createdAt', 'analyzedAt']).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const parsed = QuerySchema.safeParse({
    date: searchParams.get('date') ?? '',
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    orderBy: (searchParams.get('orderBy') ?? undefined) as any,
  })

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid query' } }, { status: 400 })
  }

  const page = Math.max(1, Number(parsed.data.page ?? '1') || 1)
  const pageSize = Math.min(10, Math.max(1, Number(parsed.data.pageSize ?? '10') || 10))
  const orderBy = parsed.data.orderBy ?? 'analyzedAt'

  let range
  try {
    range = getShanghaiDayRange(parsed.data.date)
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid date' } }, { status: 400 })
  }

  const skip = (page - 1) * pageSize

  const items = await prisma.adultContent.findMany({
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

  const urls = [...new Set(items.map(i => i.url))]
  let raws = await prisma.sourceCache.findMany({
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

    raws = await prisma.sourceCache.findMany({
      where: { url: { in: urls }, status: 'ok' }
    })
  }

  const rawByUrl = new Map(raws.map(r => [r.url, r]))

  const md = renderListMarkdown(
    {
      title: 'Content Analyzer - 指定日期内容（成人）',
      date: parsed.data.date,
      page,
      pageSize,
      tabLabel: 'adult',
    },
    items,
    rawByUrl
  )

  return new NextResponse(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8'
    }
  })
}
