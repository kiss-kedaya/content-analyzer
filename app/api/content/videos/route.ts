import { getContentVideoFeedSources } from '@/lib/api'
import { createVideoFeedHandler } from '@/lib/video-feed-route'

export const runtime = 'nodejs'
export const GET = createVideoFeedHandler('GET /api/content/videos', getContentVideoFeedSources)
