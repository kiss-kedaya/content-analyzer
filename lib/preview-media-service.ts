import prisma from '@/lib/db'
import { normalizeSource } from '@/lib/normalize-source'
import { extractWithSnapvidDetailed } from '@/lib/media-extractor-snapvid'
import { getMediaCache, normalizeCachedMedia, saveMediaCache } from '@/lib/media-cache'
import { logApiError } from '@/lib/logger'
import { normalizeAndValidateHttpUrl } from '@/lib/url-validate'

const ALLOWED_MEDIA_HOSTS = ['twitter.com', 'x.com']
const MEDIA_PROXY_BASE_PROTOCOL_RELATIVE = '//media.kedaya.xyz'

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

function toProtocolRelativeMediaProxyUrl(rawUrl: string): string {
  return `${MEDIA_PROXY_BASE_PROTOCOL_RELATIVE}/?url=${encodeURIComponent(rawUrl)}`
}

function isAlreadyProxied(candidate: string): boolean {
  return candidate.startsWith(`${MEDIA_PROXY_BASE_PROTOCOL_RELATIVE}/?url=`)
    || candidate.startsWith('https://media.kedaya.xyz/?url=')
    || candidate.startsWith('http://media.kedaya.xyz/?url=')
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

    if (isAlreadyProxied(candidate)) {
      const normalized = candidate
        .replace(/^https:\/\/media\.kedaya\.xyz\/?\?url=/, `${MEDIA_PROXY_BASE_PROTOCOL_RELATIVE}/?url=`)
        .replace(/^http:\/\/media\.kedaya\.xyz\/?\?url=/, `${MEDIA_PROXY_BASE_PROTOCOL_RELATIVE}/?url=`)

      if (!seen.has(normalized)) {
        seen.add(normalized)
        out.push(normalized)
      }
      return
    }

    const decoded = decodeSnapcdnSourceUrl(candidate)
    if (decoded) {
      pushIfAllowed(decoded)
      return
    }

    try {
      const u = new URL(candidate)
      const host = u.hostname.toLowerCase()
      const allowed = host === 'video.twimg.com' || host === 'pbs.twimg.com' || host.endsWith('.twimg.com')
      if (!allowed) return

      const proxied = toProtocolRelativeMediaProxyUrl(candidate)
      if (!seen.has(proxied)) {
        seen.add(proxied)
        out.push(proxied)
      }
    } catch {
      // ignore
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

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    let extraction: Awaited<ReturnType<typeof extractWithSnapvidDetailed>>

    try {
      extraction = await extractWithSnapvidDetailed(normalizedUrl, { signal: controller.signal })
    } finally {
      clearTimeout(timeoutId)
    }

    const media = extraction.media || []

    if (media.length > 0) {
      await saveMediaCache(normalizedUrl, extraction.rawResponse, media)

      if (wantPersist && persistKind && persistId) {
        await persistMediaUrls({
          persistKind,
          persistId,
          normalizedUrl,
          media: normalizeCachedMedia(media),
        })
      }
    }

    return buildPreviewMediaResult(normalizedUrl, media)
  } catch (extractError) {
    logApiError('preview-media-extract', extractError, { url: normalizedUrl })

    return {
      success: true,
      url: normalizedUrl,
      media: [],
      videos: [],
      images: [],
      count: { videos: 0, images: 0, total: 0 },
      extractError: extractError instanceof Error ? extractError.message : 'Extract failed',
      warning: 'Media extraction failed'
    }
  }
}
