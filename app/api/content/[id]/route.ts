import { deleteContent, getContentById } from '@/lib/api'
import { createItemRouteHandlers } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'

const handlers = createItemRouteHandlers({
  context: '/api/content',
  getById: getContentById,
  deleteById: deleteContent,
})

export const GET = handlers.GET
export const DELETE = handlers.DELETE
