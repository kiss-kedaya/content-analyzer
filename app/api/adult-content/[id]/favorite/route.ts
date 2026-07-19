import { setAdultContentFavorite } from '@/lib/adult-api'
import { createFavoriteRouteHandlers } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'

const handlers = createFavoriteRouteHandlers({
  context: '/api/adult-content',
  setFavorite: setAdultContentFavorite,
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE
