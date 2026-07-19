import prisma from '@/lib/db'
import { normalizeSource } from '@/lib/normalize-source'
import { extractWithSnapvidDetailed } from '@/lib/media-extractor-snapvid'
import { extractWithXApiDetailed, hasXApiMediaToken } from '@/lib/media-extractor-x-api'
import { getMediaCache, normalizeCachedMedia, saveMediaCache, saveMediaFailure } from '@/lib/media-cache'
import { createLogger, logApiError } from '@/lib/logger'
import { normalizePersistentMediaUrl, parsePersistentMediaItems } from '@/lib/persistent-media'
import { normalizeAndValidateHttpUrl } from '@/lib/url-validate'

const ALLOWED_MEDIA_HOSTS = ['twitter.com', 'x.com']
const FAILURE_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const previewLogger = createLogger('preview-media')

export type PreviewMediaItem = ReturnType<typeof normalizeCachedMedia>[number]

export interface PreviewMediaResult {
  success: true
  url: string
  media: PreviewMediaItem[]
  videos: Array<{
    url: string
    fallbackUrl?: string
    sourceUrl?: string
    expiresAt?: number
    expired?: boolean
    quality?: string
    format?: string
  }>
  images: Array<{
    url: string
    fallbackUrl?: string
    sourceUrl?: string
    expiresAt?: number
  }>
  count: {
    videos: number
    images: number
    total: number
  }
  extractError?: string
  warning?: string
}

export interface PreviewMediaParams {
  url: string
  force?: boolean
  persistKind?: 'content' | 'adultContent' | null
  persistId?: string | null
}

function isAllowedMediaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return ALLOWED_MEDIA_HOSTS.some((host) => lower === host || lower.endsWith(`.${host}`))
}

function decodeSnapcdnSourceUrl(candidate: string): string | null {
  try {
    const u = new URL(candidate)
    if (u.hostname !== 'dl.snapcdn.app') return null

    const token = u.searchParams.get('token')
    if (!token) return null

    const parts = token.split('.')
    if (parts.length < 2) return null

    const payloadB64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const json = Buffer.from(padded, 'base64').toString('utf8')
    const payload = JSON.parse(json) as { url?: string }

    if (!payload?.url || typeof payload.url !== 'string') return null
    return payload.url
  } catch {
    return null
  }
}

function applyExpiryPolicy(media: ReturnType<typeof normalizeCachedMedia>) {
  const nowSec = Math.floor(Date.now() / 1000)
  return media.map((item) => {
    const isSnapcdn = (() => {
      try {
        return new URL(item.url).hostname === 'dl.snapcdn.app'
      } catch {
        return false
      }
    })()

    const expired = typeof item.expiresAt === 'number' ? item.expiresAt <= nowSec : false

    if (isSnapcdn) {
      const decoded = decodeSnapcdnSourceUrl(item.url)
      const fallback = item.sourceUrl || decoded

      if (fallback) {
        return {
          ...item,
          url: fallback,
          fallbackUrl: item.fallbackUrl || item.url,
          sourceUrl: item.sourceUrl || fallback,
        }
      }
    }

    void expired
    return item
  })
}

function buildPreviewMediaResult(url: string, media: ReturnType<typeof normalizeCachedMedia>): PreviewMediaResult {
  const fixed = applyExpiryPolicy(media)
  const nowSec = Math.floor(Date.now() / 1000)

  return {
    success: true,
    url,
    media: fixed,
    videos: fixed.filter(item => item.type === 'video').map(item => ({
      url: item.url,
      fallbackUrl: item.fallbackUrl,
      sourceUrl: item.sourceUrl,
      expiresAt: item.expiresAt,
      expired: typeof item.expiresAt === 'number' ? item.expiresAt <= nowSec : false,
      quality: item.quality,
      format: item.format,
    })),
    images: fixed.filter(item => item.type === 'image').map(item => ({
      url: item.url,
      fallbackUrl: item.fallbackUrl,
      sourceUrl: item.sourceUrl,
      expiresAt: item.expiresAt,
    })),
    count: {
      videos: fixed.filter(item => item.type === 'video').length,
      images: fixed.filter(item => item.type === 'image').length,
      total: fixed.length,
    },
  }
}

function pickPersistentMediaUrls(media: ReturnType<typeof normalizeCachedMedia>) {
  const out: string[] = []
  const seen = new Set<string>()

  const pushIfAllowed = (candidate?: string) => {
    if (!candidate) return

    const decoded = decodeSnapcdnSourceUrl(candidate)
    if (decoded) {
      pushIfAllowed(decoded)
      return
    }

    const normalized = normalizePersistentMediaUrl(candidate)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      out.push(normalized)
    }
  }

  for (const item of media) {
    if (!item) continue
    pushIfAllowed(item.sourceUrl)
    pushIfAllowed(item.url)
    if (out.length >= 10) break
  }

  return out
}

async function persistMediaUrls(params: {
  persistKind: 'content' | 'adultContent'
  persistId: string
  normalizedUrl: string
  media: ReturnType<typeof normalizeCachedMedia>
}) {
  const urls = pickPersistentMediaUrls(params.media)
  if (urls.length === 0) return

  const now = new Date()

  if (params.persistKind === 'content') {
    const row = await prisma.content.findUnique({
      where: { id: params.persistId },
      select: { id: true, source: true, mediaUrls: true },
    })

    if (!row) return
    if (normalizeSource(row.source) !== 'X') return

    const merged = Array.from(new Set([...(row.mediaUrls || []), ...urls])).slice(0, 20)

    await prisma.content.update({
      where: { id: row.id },
      data: {
        mediaUrls: merged,
        mediaFetchedAt: now,
        mediaSourceUrl: params.normalizedUrl,
      },
    })

    return
  }

  const row = await prisma.adultContent.findUnique({
    where: { id: params.persistId },
    select: { id: true, source: true, mediaUrls: true },
  })

  if (!row) return
  if (normalizeSource(row.source) !== 'X') return

  const merged = Array.from(new Set([...(row.mediaUrls || []), ...urls])).slice(0, 20)

  await prisma.adultContent.update({
    where: { id: row.id },
    data: {
      mediaUrls: merged,
      mediaFetchedAt: now,
      mediaSourceUrl: params.normalizedUrl,
    },
  })
}

export function buildPreviewMediaFailureResult(url: string, message: string): PreviewMediaResult {
  return {
    ...buildPreviewMediaResult(url, []),
    extractError: message,
    warning: 'Media extraction failed',
  }
}

async function getPersistedMedia(params: {
  persistKind: 'content' | 'adultContent'
  persistId: string
  normalizedUrl: string
}) {
  const select = { url: true, source: true, mediaUrls: true } as const
  const row = params.persistKind === 'content'
    ? await prisma.content.findUnique({ where: { id: params.persistId }, select })
    : await prisma.adultContent.findUnique({ where: { id: params.persistId }, select })

  if (!row || normalizeSource(row.source) !== 'X' || row.url !== params.normalizedUrl) return []
  return parsePersistentMediaItems(row.mediaUrls)
}

export function validatePreviewMediaUrl(url: string): string {
  const normalizedUrl = normalizeAndValidateHttpUrl(url)
  const hostname = new URL(normalizedUrl).hostname

  if (!isAllowedMediaHost(hostname)) {
    throw new Error('Only x.com or twitter.com hosts are allowed')
  }

  return normalizedUrl
}

export async function previewMedia(params: PreviewMediaParams): Promise<PreviewMediaResult> {
  const normalizedUrl = validatePreviewMediaUrl(params.url)
  const force = params.force === true
  const persistKind = (params.persistKind === 'content' || params.persistKind === 'adultContent') ? params.persistKind : null
  const persistId = params.persistId ?? null
  const wantPersist = Boolean(persistKind && persistId)

  const cached = await getMediaCache(normalizedUrl)
  if (!force && cached?.status === 'success') {
    const media = normalizeCachedMedia(cached.parsedMedia)
    if (media.length > 0) {
      if (wantPersist && persistKind && persistId) {
        await persistMediaUrls({
          persistKind,
          persistId,
          normalizedUrl,
          media,
        })
      }

      return buildPreviewMediaResult(normalizedUrl, media)
    }
  }

  if (
    !force
    && cached?.status === 'failed'
    && Date.now() - cached.lastFetchedAt.getTime() < FAILURE_CACHE_TTL_MS
  ) {
    return buildPreviewMediaFailureResult(normalizedUrl, 'No media was available during the recent extraction attempt')
  }

  if (!force && wantPersist && persistKind && persistId) {
    const persisted = await getPersistedMedia({ persistKind, persistId, normalizedUrl })
    if (persisted.length > 0) {
      return buildPreviewMediaResult(normalizedUrl, normalizeCachedMedia(persisted))
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    let extraction: Awaited<ReturnType<typeof extractWithSnapvidDetailed>>
    const useXApi = hasXApiMediaToken()

    try {
      if (useXApi) {
        extraction = await extractWithXApiDetailed(normalizedUrl, { signal: controller.signal })
      } else {
        extraction = await extractWithSnapvidDetailed(normalizedUrl, { signal: controller.signal })
      }
    } catch (primaryError) {
      if (!useXApi) throw primaryError
      logApiError('preview-media-x-api', primaryError, { url: normalizedUrl })
      try {
        extraction = await extractWithSnapvidDetailed(normalizedUrl, { signal: controller.signal })
      } catch (fallbackError) {
        const officialMessage = primaryError instanceof Error ? primaryError.message : String(primaryError)
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        throw new Error(`X API failed: ${officialMessage}; Snapvid failed: ${fallbackMessage}`)
      }
    } finally {
      clearTimeout(timeoutId)
    }

    const media = extraction.media || []

    if (media.length === 0) {
      await saveMediaFailure(normalizedUrl, 'No media found')
      return buildPreviewMediaFailureResult(normalizedUrl, 'No media found')
    }

    await saveMediaCache(normalizedUrl, extraction.rawResponse, media)

    if (wantPersist && persistKind && persistId) {
      await persistMediaUrls({
        persistKind,
        persistId,
        normalizedUrl,
        media: normalizeCachedMedia(media),
      })
    }

    return buildPreviewMediaResult(normalizedUrl, media)
  } catch (extractError) {
    const message = extractError instanceof Error ? extractError.message : 'Media extraction failed'
    previewLogger.warn({ url: normalizedUrl, message }, 'Media extraction unavailable')
    try {
      await saveMediaFailure(normalizedUrl, message)
    } catch (cacheError) {
      logApiError('preview-media-failure-cache', cacheError, { url: normalizedUrl })
    }
    return buildPreviewMediaFailureResult(normalizedUrl, message)
  }
}
