import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { createContent } from '@/lib/api'
import { createAdultContent } from '@/lib/adult-api'
import { mapWithConcurrency } from '@/lib/content-batch-handler'
import { ErrorCodes, errorResponse, logError } from '@/lib/api-response'
import { prepareXTimelineImport } from '@/lib/x-timeline-import'
import type { BookmarkImportItem } from '@/lib/x-bookmark-import'

export const runtime = 'nodejs'

type WriteResult = { ok: true; url: string } | { ok: false; url: string; error: string }

async function writeItems(items: BookmarkImportItem[], create: (item: BookmarkImportItem) => Promise<{ url: string }>) {
  return mapWithConcurrency(items, 6, async (item): Promise<WriteResult> => {
    try {
      const record = await create(item)
      return { ok: true, url: record.url }
    } catch (error) {
      return { ok: false, url: item.url, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const prepared = prepareXTimelineImport(await request.json())
    const [contentResults, adultResults] = await Promise.all([
      writeItems(prepared.content, createContent),
      writeItems(prepared.adultContent, createAdultContent),
    ])

    const contentUrls = contentResults.filter((item): item is Extract<WriteResult, { ok: true }> => item.ok).map((item) => item.url)
    const adultUrls = adultResults.filter((item): item is Extract<WriteResult, { ok: true }> => item.ok).map((item) => item.url)
    await Promise.all([
      contentUrls.length ? prisma.adultContent.deleteMany({ where: { url: { in: contentUrls } } }) : Promise.resolve(),
      adultUrls.length ? prisma.content.deleteMany({ where: { url: { in: adultUrls } } }) : Promise.resolve(),
    ])

    const errors = [...contentResults, ...adultResults].filter((item): item is Extract<WriteResult, { ok: false }> => !item.ok)
    return NextResponse.json({
      success: errors.length === 0,
      captured: prepared.payload.data.length,
      imported: contentUrls.length + adultUrls.length,
      ignored: prepared.ignoredPostIds.length,
      content: contentUrls.length,
      adultContent: adultUrls.length,
      acceptedPostIds: prepared.acceptedPostIds,
      ignoredPostIds: prepared.ignoredPostIds,
      errors,
    })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(errorResponse(
        error instanceof z.ZodError ? error.issues[0].message : 'Request body must be valid JSON',
        ErrorCodes.VALIDATION_ERROR,
      ), { status: 400 })
    }

    logError('POST /api/import/x-timeline', error)
    return NextResponse.json(errorResponse('Timeline import failed', ErrorCodes.DATABASE_ERROR), { status: 500 })
  }
}
