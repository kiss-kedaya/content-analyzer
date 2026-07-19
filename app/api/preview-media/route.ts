import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logger'
import { previewMedia, validatePreviewMediaUrl } from '@/lib/preview-media-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' }

// GET /api/preview-media?url=https://x.com/user/status/123
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing required parameter: url' }, { status: 400 })
  }

  let normalizedUrl: string
  try {
    normalizedUrl = validatePreviewMediaUrl(url)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid url' },
      { status: 400 },
    )
  }

  const persistKindRaw = request.nextUrl.searchParams.get('persistKind')
  const persistKind = persistKindRaw === 'content' || persistKindRaw === 'adultContent'
    ? persistKindRaw
    : null

  try {
    const result = await previewMedia({
      url: normalizedUrl,
      force: request.nextUrl.searchParams.get('force') === '1',
      persistKind,
      persistId: request.nextUrl.searchParams.get('persistId'),
    })

    return NextResponse.json(result, {
      headers: NO_STORE_HEADERS,
    })
  } catch (error) {
    logApiError('preview-media', error, { url: normalizedUrl })
    return NextResponse.json(
      {
        success: false,
        url: normalizedUrl,
        error: {
          code: 'MEDIA_EXTRACTION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 502, headers: NO_STORE_HEADERS },
    )
  }
}
