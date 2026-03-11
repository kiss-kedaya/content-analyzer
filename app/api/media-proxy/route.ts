import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_HOSTS = new Set(['video.twimg.com'])

function pickRequestHeaders(request: NextRequest) {
  const headers: Record<string, string> = {}

  const range = request.headers.get('range')
  if (range) headers['range'] = range

  const ifRange = request.headers.get('if-range')
  if (ifRange) headers['if-range'] = ifRange

  const ifModifiedSince = request.headers.get('if-modified-since')
  if (ifModifiedSince) headers['if-modified-since'] = ifModifiedSince

  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch) headers['if-none-match'] = ifNoneMatch

  const userAgent = request.headers.get('user-agent')
  if (userAgent) headers['user-agent'] = userAgent

  const accept = request.headers.get('accept')
  if (accept) headers['accept'] = accept

  return headers
}

function pickResponseHeaders(upstream: Headers) {
  const out = new Headers()

  const passthrough = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'cache-control',
    'etag',
    'last-modified',
  ]

  for (const key of passthrough) {
    const value = upstream.get(key)
    if (value) out.set(key, value)
  }

  // Security: reduce the chance of proxy being used cross-site.
  out.set('x-content-type-options', 'nosniff')

  return out
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('url')

  if (!raw) {
    return new Response('Missing url', { status: 400 })
  }

  if (raw.length > 4000) {
    return new Response('URL too long', { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return new Response('Invalid protocol', { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new Response('Host not allowed', { status: 403 })
  }

  // Avoid becoming an open proxy: only GET and only a strict host allowlist.
  const upstreamResp = await fetch(target.toString(), {
    method: 'GET',
    headers: pickRequestHeaders(request),
    redirect: 'follow',
    cache: 'no-store',
  })

  const headers = pickResponseHeaders(upstreamResp.headers)

  return new Response(upstreamResp.body, {
    status: upstreamResp.status,
    headers,
  })
}
