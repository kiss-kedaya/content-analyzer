import { NextRequest } from 'next/server'
import { buildOpenApiSpec } from '@/lib/openapi'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const download = searchParams.get('download') !== '0'

  const spec = buildOpenApiSpec()
  const body = JSON.stringify(spec, null, 2)

  const headers = new Headers()
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=60')

  if (download) {
    headers.set('Content-Disposition', 'attachment; filename="openapi.json"')
  }

  return new Response(body, { status: 200, headers })
}
