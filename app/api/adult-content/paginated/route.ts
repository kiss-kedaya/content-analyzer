import { getAdultContentStats, getAdultContentsPage } from '@/lib/adult-api'
import { createPaginatedRouteHandler } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'
export const GET = createPaginatedRouteHandler({
  context: '/api/adult-content/paginated',
  loadPage: getAdultContentsPage,
  loadStats: getAdultContentStats,
})
