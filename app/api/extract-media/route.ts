import { NextRequest, NextResponse } from 'next/server'
import { extractTwitterMedia, extractBatchTwitterMedia } from '@/lib/media-extractor'
import { normalizeAndValidateHttpUrl } from '@/lib/url-validate'

// POST /api/extract-media - 提取 Twitter 媒体链接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const MAX_URLS = 20

    // 单个 URL
    if (body.url && typeof body.url === 'string') {
      let normalizedUrl: string
      try {
        normalizedUrl = normalizeAndValidateHttpUrl(body.url)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Invalid url' },
          { status: 400 }
        )
      }

      const mediaList = await extractTwitterMedia(normalizedUrl)

      return NextResponse.json({
        url: normalizedUrl,
        media: mediaList,
        count: mediaList.length
      })
    }

    // 批量 URL
    if (body.urls && Array.isArray(body.urls)) {
      if (body.urls.length > MAX_URLS) {
        return NextResponse.json(
          { error: `Too many urls (max ${MAX_URLS})` },
          { status: 413 }
        )
      }

      const normalizedUrls: string[] = []
      for (const raw of body.urls) {
        if (typeof raw !== 'string') {
          return NextResponse.json(
            { error: 'Invalid url' },
            { status: 400 }
          )
        }
        try {
          normalizedUrls.push(normalizeAndValidateHttpUrl(raw))
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Invalid url' },
            { status: 400 }
          )
        }
      }

      const results = await extractBatchTwitterMedia(normalizedUrls)

      return NextResponse.json({
        results,
        total: Object.keys(results).length
      })
    }

    return NextResponse.json(
      { error: 'Missing required field: url or urls' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error extracting media:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
