import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ContentInput } from './content-api-factory'
import { ErrorCodes, errorResponse, logError, successResponse } from './api-response'
import { normalizeSource } from './normalize-source'
import { ContentCreateSchema, ContentListQuerySchema, type ContentListQuery } from './validation'

type RouteContext = { params: Promise<{ id: string }> }
type CreateRecord = (input: ContentInput) => Promise<unknown>
type ListRecords = (orderBy: string) => Promise<unknown[]>
type GetRecord = (id: string) => Promise<unknown | null>
type DeleteRecord = (id: string) => Promise<{ deleted: boolean }>
type SetFavorite = (id: string, favorited: boolean) => Promise<boolean>
type ListPageResult = {
  items: unknown[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}
type LoadPage = (query: ContentListQuery) => Promise<ListPageResult>
type LoadStats = (query: Pick<ContentListQuery, 'q' | 'date'>) => Promise<{ total: number; bySource: Record<string, number> }>

const orderBySchema = z.literal('createdAt')
const idSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid content id')

function jsonError(message: string, code: string, status: number, details?: unknown) {
  return NextResponse.json(errorResponse(message, code, details), { status })
}

async function readContentInput(request: NextRequest, allowSourceTime: boolean) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { response: jsonError('Request body must be valid JSON', ErrorCodes.VALIDATION_ERROR, 400) }
  }

  const parsed = ContentCreateSchema.safeParse(body)
  if (!parsed.success) {
    return {
      response: jsonError(parsed.error.issues[0].message, ErrorCodes.VALIDATION_ERROR, 400, parsed.error.issues),
    }
  }

  const data = parsed.data
  return {
    input: {
      source: normalizeSource(data.source),
      url: data.url,
      title: data.title,
      content: data.content,
      analyzedBy: data.analyzedBy,
      sourceTime: allowSourceTime ? data.sourceTime : undefined,
      mediaUrls: data.mediaUrls,
    } satisfies ContentInput,
  }
}

async function readId(context: RouteContext) {
  const result = idSchema.safeParse((await context.params).id)
  return result.success ? result.data : null
}

export function createCollectionRouteHandlers(options: {
  context: string
  allowSourceTime: boolean
  create: CreateRecord
  list: ListRecords
}) {
  return {
    async GET(request: NextRequest) {
      const orderBy = orderBySchema.safeParse(request.nextUrl.searchParams.get('orderBy') || 'createdAt')
      if (!orderBy.success) return jsonError('Invalid orderBy parameter', ErrorCodes.INVALID_PARAMETER, 400)

      try {
        return NextResponse.json(await options.list(orderBy.data))
      } catch (error) {
        logError(`GET ${options.context}`, error)
        return jsonError('Failed to fetch contents', ErrorCodes.DATABASE_ERROR, 500)
      }
    },

    async POST(request: NextRequest) {
      const parsed = await readContentInput(request, options.allowSourceTime)
      if ('response' in parsed) return parsed.response

      try {
        return NextResponse.json(await options.create(parsed.input), { status: 201 })
      } catch (error) {
        logError(`POST ${options.context}`, error)
        return jsonError('Failed to save content', ErrorCodes.DATABASE_ERROR, 500)
      }
    },
  }
}

export function createItemRouteHandlers(options: {
  context: string
  getById: GetRecord
  deleteById: DeleteRecord
}) {
  return {
    async GET(_request: NextRequest, context: RouteContext) {
      const id = await readId(context)
      if (!id) return jsonError('Invalid content id', ErrorCodes.INVALID_PARAMETER, 400)

      try {
        const record = await options.getById(id)
        return record
          ? NextResponse.json(record)
          : jsonError('Content not found', ErrorCodes.NOT_FOUND, 404)
      } catch (error) {
        logError(`GET ${options.context}/[id]`, error, { id })
        return jsonError('Failed to fetch content', ErrorCodes.DATABASE_ERROR, 500)
      }
    },

    async DELETE(_request: NextRequest, context: RouteContext) {
      const id = await readId(context)
      if (!id) return jsonError('Invalid content id', ErrorCodes.INVALID_PARAMETER, 400)

      try {
        const result = await options.deleteById(id)
        return NextResponse.json({ success: true, deleted: result.deleted })
      } catch (error) {
        logError(`DELETE ${options.context}/[id]`, error, { id })
        return jsonError('Failed to delete content', ErrorCodes.DATABASE_ERROR, 500)
      }
    },
  }
}

export function createFavoriteRouteHandlers(options: { context: string; setFavorite: SetFavorite }) {
  async function update(favorited: boolean, context: RouteContext) {
    const id = await readId(context)
    if (!id) return jsonError('Invalid content id', ErrorCodes.INVALID_PARAMETER, 400)

    try {
      const found = await options.setFavorite(id, favorited)
      return found
        ? NextResponse.json({ success: true, favorited })
        : jsonError('Content not found', ErrorCodes.NOT_FOUND, 404)
    } catch (error) {
      logError(`${favorited ? 'POST' : 'DELETE'} ${options.context}/[id]/favorite`, error, { id })
      return jsonError('Failed to update favorite', ErrorCodes.DATABASE_ERROR, 500)
    }
  }

  return {
    POST: (_request: NextRequest, context: RouteContext) => update(true, context),
    DELETE: (_request: NextRequest, context: RouteContext) => update(false, context),
  }
}

export function createPaginatedRouteHandler(options: { context: string; loadPage: LoadPage; loadStats: LoadStats }) {
  return async function GET(request: NextRequest) {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = ContentListQuerySchema.safeParse(searchParams)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, ErrorCodes.VALIDATION_ERROR, 400, parsed.error.issues)
    }

    try {
      const query = parsed.data
      const [result, stats] = await Promise.all([
        options.loadPage(query),
        query.page === 1 ? options.loadStats({ q: query.q, date: query.date }) : Promise.resolve(undefined),
      ])
      return NextResponse.json({
        ...successResponse(result.items, {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        }),
        ...(stats ? { stats } : {}),
      })
    } catch (error) {
      logError(`GET ${options.context}`, error, { searchParams })
      return jsonError('Failed to fetch contents', ErrorCodes.DATABASE_ERROR, 500)
    }
  }
}
