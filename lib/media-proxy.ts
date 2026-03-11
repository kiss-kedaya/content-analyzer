const HARD_CODED_MEDIA_PROXY_BASE_URL = 'https://media.kedaya.xyz'

export function shouldProxyMediaUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl)
    const host = u.hostname.toLowerCase()
    return host === 'video.twimg.com' || host === 'pbs.twimg.com'
  } catch {
    return false
  }
}

export function toMediaProxyUrl(rawUrl: string): string {
  return `${HARD_CODED_MEDIA_PROXY_BASE_URL}/?url=${encodeURIComponent(rawUrl)}`
}
