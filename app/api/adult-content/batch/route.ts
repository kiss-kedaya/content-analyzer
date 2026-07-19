import { createAdultContent } from '@/lib/adult-api'
import { createContentBatchHandler } from '@/lib/content-batch-handler'

export const runtime = 'nodejs'
export const POST = createContentBatchHandler({
  context: '/api/adult-content/batch',
  allowSourceTime: false,
  create: createAdultContent,
})
