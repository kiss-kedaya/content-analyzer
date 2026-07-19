import { createAdultContent, getAllAdultContents } from '@/lib/adult-api'
import { createCollectionRouteHandlers } from '@/lib/content-route-handlers'

export const runtime = 'nodejs'

const handlers = createCollectionRouteHandlers({
  context: '/api/adult-content',
  allowSourceTime: false,
  create: createAdultContent,
  list: getAllAdultContents,
})

export const GET = handlers.GET
export const POST = handlers.POST
