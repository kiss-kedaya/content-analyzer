import prisma from './db'

export interface CachedMediaItem {
  type: 'video' | 'image'
  url: string
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
        quality: typeof entry.quality === 'string' ? entry.quality : undefined,
        format: typeof entry.format === 'string' ? entry.format : undefined,
      } as CachedMediaItem
    })
    .filter(Boolean) as CachedMediaItem[]
}
