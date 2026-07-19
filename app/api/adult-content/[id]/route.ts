import { deleteAdultContent, getAdultContentById } from '@/lib/adult-api'
import { createItemRouteHandlers } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'

const handlers = createItemRouteHandlers({
  context: '/api/adult-content',
  getById: getAdultContentById,
  deleteById: deleteAdultContent,
})

export const GET = handlers.GET
export const DELETE = handlers.DELETE
