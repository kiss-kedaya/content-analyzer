import { setContentFavorite } from '@/lib/api'
import { createFavoriteRouteHandlers } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'

const handlers = createFavoriteRouteHandlers({
  context: '/api/content',
  setFavorite: setContentFavorite,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE
