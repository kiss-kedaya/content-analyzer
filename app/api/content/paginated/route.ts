import { getContentsPage, getStats } from '@/lib/api'
import { createPaginatedRouteHandler } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'
export const GET = createPaginatedRouteHandler({
  context: '/api/content/paginated',
  loadPage: getContentsPage,
  loadStats: getStats,
})
