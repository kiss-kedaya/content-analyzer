import { getAdultContentVideoFeedSources } from '@/lib/adult-api'
import { createVideoFeedHandler } from '@/lib/video-feed-route'

export const runtime = 'nodejs'
export const GET = createVideoFeedHandler('GET /api/adult-content/videos', getAdultContentVideoFeedSources)
