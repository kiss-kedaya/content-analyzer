import { createContent } from '@/lib/api'
import { createContentBatchHandler } from '@/lib/content-batch-handler'

export const runtime = 'nodejs'
export const POST = createContentBatchHandler({
  context: '/api/content/batch',
  allowSourceTime: true,
  create: createContent,
})
