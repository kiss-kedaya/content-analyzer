const DEFAULT_SAME_ORIGIN_PROXY_PATH = '/api/media-proxy'

export function shouldProxyMediaUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl)
    const host = u.hostname.toLowerCase()
    return host === 'video.twimg.com' || host === 'pbs.twimg.com'
  } catch {
    return false
  }
}

function getProxyBase(): string {
  // Must be NEXT_PUBLIC so client components can read it.
  const base = process.env.NEXT_PUBLIC_MEDIA_PROXY_BASE_URL

  if (!base) {
    return DEFAULT_SAME_ORIGIN_PROXY_PATH
  }

  return base.replace(/\/+$/, '')
}

export function toMediaProxyUrl(rawUrl: string): string {
  const base = getProxyBase()

  // If base is same-origin path (/api/media-proxy), keep existing behavior.
  if (base.startsWith('/')) {
    return `${base}?url=${encodeURIComponent(rawUrl)}`
  }

  // External base, e.g. https://media.kedaya.xyz
  return `${base}/?url=${encodeURIComponent(rawUrl)}`
}
