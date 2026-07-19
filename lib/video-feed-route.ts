import { NextResponse } from 'next/server'
import { buildVideoFeed, type VideoFeedSource } from './media-display'
import { ErrorCodes, errorResponse, logError, successResponse } from './api-response'

type LoadVideoFeedSources = () => Promise<VideoFeedSource[]>

/** Creates the identical lightweight video-directory endpoint for both content models. */
export function createVideoFeedHandler(context: string, loadSources: LoadVideoFeedSources) {
  return async function GET() {
    try {
      const feed = buildVideoFeed(await loadSources())
      return NextResponse.json(successResponse(feed), {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    } catch (error) {
      logError(context, error)
      return NextResponse.json(
        errorResponse('Failed to load video directory', ErrorCodes.DATABASE_ERROR),
        { status: 500 },
      )
    }
  }
}
