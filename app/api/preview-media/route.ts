import { NextRequest, NextResponse } from 'next/server'
import { extractWithSnapvidDetailed } from '@/lib/media-extractor-snapvid'
import { getMediaCache, normalizeCachedMedia, saveMediaCache } from '@/lib/media-cache'
import { logApiError } from '@/lib/logger'

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

    const cached = await getMediaCache(url)
    if (cached?.status === 'success') {
      const media = normalizeCachedMedia(cached.parsedMedia)
      if (media.length > 0) {
        return formatResponse(url, media, cached.rawResponse)
      }
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000)
      })

      const extraction = await Promise.race([
        extractWithSnapvidDetailed(url),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof extractWithSnapvidDetailed>>

      const media = extraction.media || []

      if (media.length > 0) {
        await saveMediaCache(url, extraction.rawResponse, media)
      }

      return formatResponse(url, media, extraction.rawResponse)
    } catch (extractError) {
      logApiError('preview-media-extract', extractError, { url })

      return NextResponse.json({
        success: true,
        url,
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
