import prisma from './db'

export interface CachedMediaItem {
  type: 'video' | 'image'
  // Primary URL returned to the client.
  url: string
  // Optional source URL (e.g. video.twimg.com) extracted from snapcdn token payload.
  // Used when snapcdn token URL expires.
  sourceUrl?: string
  // Optional expiration time (epoch seconds) extracted from snapcdn token payload.
  expiresAt?: number
  // Optional original provider URL (e.g. snapcdn token URL) kept for refresh/debug.
  fallbackUrl?: string
  quality?: string
  format?: string
}

export async function getMediaCache(url: string) {
  return prisma.mediaCache.findUnique({ where: { url } })
}

export async function saveMediaCache(url: string, rawResponse: unknown, parsedMedia: CachedMediaItem[]) {
  return prisma.mediaCache.upsert({
    where: { url },
    update: {
      status: 'success',
      rawResponse: rawResponse as object,
      parsedMedia: parsedMedia as object,
      lastFetchedAt: new Date(),
    },
    create: {
      url,
      status: 'success',
      rawResponse: rawResponse as object,
      parsedMedia: parsedMedia as object,
      lastFetchedAt: new Date(),
    }
  })
}

export function normalizeCachedMedia(input: unknown): CachedMediaItem[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const entry = item as Record<string, unknown>
      if ((entry.type !== 'video' && entry.type !== 'image') || typeof entry.url !== 'string') return null
      return {
        type: entry.type,
        url: entry.url,
        sourceUrl: typeof entry.sourceUrl === 'string' ? entry.sourceUrl : undefined,
        expiresAt: typeof entry.expiresAt === 'number' ? entry.expiresAt : undefined,
        fallbackUrl: typeof entry.fallbackUrl === 'string' ? entry.fallbackUrl : undefined,
        quality: typeof entry.quality === 'string' ? entry.quality : undefined,
        format: typeof entry.format === 'string' ? entry.format : undefined,
      } as CachedMediaItem
    })
    .filter(Boolean) as CachedMediaItem[]
}
