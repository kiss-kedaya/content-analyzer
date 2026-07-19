import { NextRequest, NextResponse } from 'next/server'
import type { ContentInput } from './content-api-factory'
import { ErrorCodes, errorResponse, logError } from './api-response'
import { normalizeSource } from './normalize-source'
import { ContentCreateSchema } from './validation'

const MAX_BATCH_SIZE = 100
const WRITE_CONCURRENCY = 6

type CreatedRecord = { id: string; url: string }
type CreateRecord = (input: ContentInput) => Promise<CreatedRecord>

type BatchItemResult =
  | { ok: true; index: number; id: string; url: string }
  | { ok: false; index: number; url: string; error: string }

/** Bounded parallelism shortens large imports without exhausting the DB connection pool. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await worker(items[index], index)
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), items.length)
  await Promise.all(Array.from({ length: workerCount }, runWorker))
  return results
}

export function createContentBatchHandler(options: {
  context: string
  allowSourceTime: boolean
  create: CreateRecord
}) {
  return async function POST(request: NextRequest) {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        errorResponse('Request body must be valid JSON', ErrorCodes.VALIDATION_ERROR),
        { status: 400 },
      )
    }

    if (!Array.isArray(body) || body.length === 0 || body.length > MAX_BATCH_SIZE) {
      const message = !Array.isArray(body)
        ? 'Request body must be an array'
        : body.length === 0
          ? 'Array cannot be empty'
          : `Batch size cannot exceed ${MAX_BATCH_SIZE}`
      return NextResponse.json(errorResponse(message, ErrorCodes.VALIDATION_ERROR), { status: 400 })
    }

    try {
      const outcomes = await mapWithConcurrency(body, WRITE_CONCURRENCY, async (item, index): Promise<BatchItemResult> => {
        const parsed = ContentCreateSchema.safeParse(item)
        if (!parsed.success) {
          const inputUrl = typeof item === 'object' && item && 'url' in item ? String(item.url) : 'unknown'
          return { ok: false, index, url: inputUrl, error: parsed.error.issues[0].message }
        }

        const data = parsed.data
        try {
          const created = await options.create({
            source: normalizeSource(data.source),
            url: data.url,
            title: data.title,
            content: data.content,
            analyzedBy: data.analyzedBy,
            sourceTime: options.allowSourceTime ? data.sourceTime : undefined,
            mediaUrls: data.mediaUrls,
          })
          return { ok: true, index, id: created.id, url: created.url }
        } catch (error) {
          return {
            ok: false,
            index,
            url: data.url,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })

      const created = outcomes.filter((item): item is Extract<BatchItemResult, { ok: true }> => item.ok)
      const errors = outcomes.filter((item): item is Extract<BatchItemResult, { ok: false }> => !item.ok)
      return NextResponse.json({
        success: created.length,
        failed: errors.length,
        total: outcomes.length,
        created: created.map(({ index, id, url }) => ({ index, id, url })),
        errors: errors.map(({ index, url, error }) => ({ index, url, error })),
      })
    } catch (error) {
      logError(`POST ${options.context}`, error)
      return NextResponse.json(
        errorResponse('Failed to process batch upload', ErrorCodes.DATABASE_ERROR),
        { status: 500 },
      )
    }
  }
}
