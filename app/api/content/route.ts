import { createContent, getAllContents } from '@/lib/api'
import { createCollectionRouteHandlers } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'

const handlers = createCollectionRouteHandlers({
  context: '/api/content',
  allowSourceTime: true,
  create: createContent,
  list: getAllContents,
})

export const GET = handlers.GET
export const POST = handlers.POST
