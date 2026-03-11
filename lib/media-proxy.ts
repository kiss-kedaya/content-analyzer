export function shouldProxyMediaUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl)
    return u.hostname === 'video.twimg.com'
  } catch {
    return false
  }
}

export function toMediaProxyUrl(rawUrl: string): string {
  return `/api/media-proxy?url=${encodeURIComponent(rawUrl)}`
}
