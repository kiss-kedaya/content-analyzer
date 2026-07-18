import { NextRequest, NextResponse } from 'next/server'
import { logApiError } from '@/lib/logger'
import { previewMedia, validatePreviewMediaUrl } from '@/lib/preview-media-service'

export const runtime = 'nodejs'

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
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    logApiError('preview-media', error, { url: normalizedUrl })
    return NextResponse.json(
      {
        error: 'Failed to preview media',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
