const MEDIA_PROXY_PROTOCOL_RELATIVE = '//media.kedaya.xyz'

function toAbsoluteUrl(value: string): string {
  return value.startsWith('//') ? `https:${value}` : value
}

function isAllowedMediaHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === 'video.twimg.com' || host === 'pbs.twimg.com' || host.endsWith('.twimg.com')
}

/** Convert an X media URL into the stable proxy form stored in PostgreSQL. */
export function normalizePersistentMediaUrl(candidate: string): string | null {
  try {
    const parsed = new URL(toAbsoluteUrl(candidate))
    const host = parsed.hostname.toLowerCase()

    if (host === 'media.kedaya.xyz') {
      const inner = parsed.searchParams.get('url')
      if (!inner) return null

      const target = new URL(inner)
      if (!isAllowedMediaHost(target.hostname)) return null
      return `${MEDIA_PROXY_PROTOCOL_RELATIVE}/?url=${encodeURIComponent(target.toString())}`
    }

    if (!isAllowedMediaHost(host)) return null
    return `${MEDIA_PROXY_PROTOCOL_RELATIVE}/?url=${encodeURIComponent(parsed.toString())}`
  } catch {
    return null
  }
}

export function normalizePersistentMediaUrls(candidates: string[], limit = 20): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const value = normalizePersistentMediaUrl(candidate)
    if (!value || seen.has(value)) continue
    seen.add(value)
    normalized.push(value)
    if (normalized.length >= limit) break
  }

  return normalized
}

export interface PersistedMediaItem {
  type: 'video' | 'image'
  url: string
  sourceUrl?: string
  format?: string
}

/** Rehydrate stored proxy URLs without calling any external extraction service. */
export function parsePersistentMediaItems(candidates: string[]): PersistedMediaItem[] {
  return candidates.flatMap((candidate): PersistedMediaItem[] => {
    try {
      const displayUrl = candidate.startsWith('//') ? `https:${candidate}` : candidate
      const parsed = new URL(displayUrl)
      const sourceUrl = parsed.hostname.toLowerCase() === 'media.kedaya.xyz'
        ? parsed.searchParams.get('url') || displayUrl
        : displayUrl
      const pathname = new URL(sourceUrl).pathname.toLowerCase()

      if (/\.(mp4|mov|m3u8)$/.test(pathname)) {
        return [{ type: 'video', url: candidate, sourceUrl, format: pathname.endsWith('.m3u8') ? 'm3u8' : 'mp4' }]
      }
      if (/\.(jpe?g|png|webp|gif)$/.test(pathname)) {
        return [{ type: 'image', url: candidate, sourceUrl, format: 'image' }]
      }
      return []
    } catch {
      return []
    }
  })
}
