import { NextRequest, NextResponse } from 'next/server'
import { extractWithSnapvidDetailed } from '@/lib/media-extractor-snapvid'
import { getMediaCache, normalizeCachedMedia, saveMediaCache } from '@/lib/media-cache'
import { logApiError } from '@/lib/logger'
import { normalizeAndValidateHttpUrl } from '@/lib/url-validate'

const ALLOWED_MEDIA_HOSTS = ['twitter.com', 'x.com']

function isAllowedMediaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return ALLOWED_MEDIA_HOSTS.some((host) => lower === host || lower.endsWith(`.${host}`))
}

function formatResponse(url: string, media: ReturnType<typeof normalizeCachedMedia>, raw?: unknown) {
  return NextResponse.json({
    success: true,
    url,
    media,
    videos: media.filter(item => item.type === 'video').map(item => ({
      url: item.url,
      quality: item.quality,
      format: item.format,
    })),
    images: media.filter(item => item.type === 'image').map(item => ({
      url: item.url,
    })),
    count: {
      videos: media.filter(item => item.type === 'video').length,
      images: media.filter(item => item.type === 'image').length,
      total: media.length,
    },
    raw,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400'
    }
  })
}

// GET /api/preview-media?url=https://x.com/user/status/123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      )
    }

    let normalizedUrl: string
    try {
      normalizedUrl = normalizeAndValidateHttpUrl(url)
      const hostname = new URL(normalizedUrl).hostname
      if (!isAllowedMediaHost(hostname)) {
        return NextResponse.json(
          { error: 'Only x.com or twitter.com hosts are allowed' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid url' },
        { status: 400 }
      )
    }

    const cached = await getMediaCache(normalizedUrl)
    if (cached?.status === 'success') {
      const media = normalizeCachedMedia(cached.parsedMedia)
      if (media.length > 0) {
        return formatResponse(normalizedUrl, media, cached.rawResponse)
      }
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000)
      })

      const extraction = await Promise.race([
        extractWithSnapvidDetailed(normalizedUrl),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof extractWithSnapvidDetailed>>

      const media = extraction.media || []

      if (media.length > 0) {
        await saveMediaCache(normalizedUrl, extraction.rawResponse, media)
      }

      return formatResponse(normalizedUrl, media, extraction.rawResponse)
    } catch (extractError) {
      logApiError('preview-media-extract', extractError, { url: normalizedUrl })

      return NextResponse.json({
        success: true,
        url: normalizedUrl,
        media: [],
        videos: [],
        images: [],
        count: { videos: 0, images: 0, total: 0 },
        extractError: extractError instanceof Error ? extractError.message : 'Extract failed',
        warning: 'Media extraction failed'
      })
    }
  } catch (error) {
    logApiError('preview-media', error)
    return NextResponse.json(
      {
        error: 'Failed to preview media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
