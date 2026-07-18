import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { assessStoredXMedia, CleanupContentKind } from '@/lib/x-media-cleanup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const sourceFilter = { in: ['X', 'Twitter'], mode: 'insensitive' as const }
const cleanupWhere = {
  source: sourceFilter,
  mediaUrls: { isEmpty: false },
}

const scanSchema = z.object({
  kind: z.enum(['all', 'content', 'adultContent']).default('all'),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(20).default(12),
})

const deleteSchema = z.object({
  confirmation: z.literal('DELETE_UNAVAILABLE_X_MEDIA'),
  items: z.array(z.object({
    kind: z.enum(['content', 'adultContent']),
    id: z.string().min(1).max(100),
  })).min(1).max(100),
})

const rowSelect = {
  id: true,
  title: true,
  url: true,
  source: true,
  favorited: true,
  analyzedAt: true,
  mediaUrls: true,
} as const

interface CleanupRow {
  id: string
  title: string | null
  url: string
  source: string
  favorited: boolean
  analyzedAt: Date
  mediaUrls: string[]
  kind: CleanupContentKind
}

async function getCounts() {
  const [content, adultContent] = await Promise.all([
    prisma.content.count({ where: cleanupWhere }),
    prisma.adultContent.count({ where: cleanupWhere }),
  ])
  return { content, adultContent, all: content + adultContent }
}

async function readRows(
  kind: 'all' | CleanupContentKind,
  offset: number,
  limit: number,
  knownCounts?: Awaited<ReturnType<typeof getCounts>>,
): Promise<CleanupRow[]> {
  if (kind === 'content') {
    const rows = await prisma.content.findMany({
      where: cleanupWhere,
      select: rowSelect,
      orderBy: [{ analyzedAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit,
    })
    return rows.map((row) => ({ ...row, kind: 'content' as const }))
  }

  if (kind === 'adultContent') {
    const rows = await prisma.adultContent.findMany({
      where: cleanupWhere,
      select: rowSelect,
      orderBy: [{ analyzedAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit,
    })
    return rows.map((row) => ({ ...row, kind: 'adultContent' as const }))
  }

  const counts = knownCounts ?? await getCounts()
  const rows: CleanupRow[] = []

  if (offset < counts.content) {
    const contentRows = await prisma.content.findMany({
      where: cleanupWhere,
      select: rowSelect,
      orderBy: [{ analyzedAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit,
    })
    rows.push(...contentRows.map((row) => ({ ...row, kind: 'content' as const })))
  }

  const remaining = limit - rows.length
  if (remaining > 0) {
    const adultOffset = Math.max(0, offset - counts.content)
    const adultRows = await prisma.adultContent.findMany({
      where: cleanupWhere,
      select: rowSelect,
      orderBy: [{ analyzedAt: 'desc' }, { id: 'desc' }],
      skip: adultOffset,
      take: remaining,
    })
    rows.push(...adultRows.map((row) => ({ ...row, kind: 'adultContent' as const })))
  }

  return rows
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await work(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: { message: '请求参数无效', details: error.issues },
    }, { status: 400 })
  }

  console.error('[x-media-cleanup]', error)
  return NextResponse.json({
    success: false,
    error: { message: '视频检查失败，请稍后重试' },
  }, { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const input = scanSchema.parse(await request.json())
    const counts = await getCounts()
    const total = counts[input.kind]
    const rows = await readRows(input.kind, input.offset, input.limit, counts)
    const assessed = await mapWithConcurrency(rows, 3, async (row) => ({
      row,
      assessment: await assessStoredXMedia(row.mediaUrls),
    }))

    const stats = { unavailable: 0, available: 0, inconclusive: 0, noVideo: 0 }
    for (const item of assessed) {
      if (item.assessment.state === 'no-video') stats.noVideo++
      else stats[item.assessment.state]++
    }

    const nextOffset = input.offset + rows.length
    return NextResponse.json({
      success: true,
      data: {
        scanned: rows.length,
        total,
        nextOffset: nextOffset < total ? nextOffset : null,
        stats,
        candidates: assessed
          .filter((item) => item.assessment.state === 'unavailable')
          .map(({ row, assessment }) => ({
            id: row.id,
            kind: row.kind,
            title: row.title,
            url: row.url,
            favorited: row.favorited,
            analyzedAt: row.analyzedAt,
            checks: assessment.checks,
          })),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const input = deleteSchema.parse(await request.json())
    const contentIds = input.items.filter((item) => item.kind === 'content').map((item) => item.id)
    const adultIds = input.items.filter((item) => item.kind === 'adultContent').map((item) => item.id)

    const [contentRows, adultRows] = await Promise.all([
      contentIds.length > 0
        ? prisma.content.findMany({ where: { ...cleanupWhere, id: { in: contentIds } }, select: rowSelect })
        : [],
      adultIds.length > 0
        ? prisma.adultContent.findMany({ where: { ...cleanupWhere, id: { in: adultIds } }, select: rowSelect })
        : [],
    ])

    const rows: CleanupRow[] = [
      ...contentRows.map((row) => ({ ...row, kind: 'content' as const })),
      ...adultRows.map((row) => ({ ...row, kind: 'adultContent' as const })),
    ]
    const assessed = await mapWithConcurrency(rows, 3, async (row) => ({
      row,
      assessment: await assessStoredXMedia(row.mediaUrls),
    }))
    const verified = assessed.filter((item) => item.assessment.state === 'unavailable').map((item) => item.row)
    const verifiedContentIds = verified.filter((row) => row.kind === 'content').map((row) => row.id)
    const verifiedAdultIds = verified.filter((row) => row.kind === 'adultContent').map((row) => row.id)

    const [deletedContent, deletedAdult] = await prisma.$transaction([
      prisma.content.deleteMany({ where: { id: { in: verifiedContentIds } } }),
      prisma.adultContent.deleteMany({ where: { id: { in: verifiedAdultIds } } }),
    ])

    const verifiedKeys = new Set(verified.map((row) => `${row.kind}:${row.id}`))
    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedContent.count + deletedAdult.count,
        deleted: verified.map((row) => ({ kind: row.kind, id: row.id })),
        skipped: input.items.filter((item) => !verifiedKeys.has(`${item.kind}:${item.id}`)),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
