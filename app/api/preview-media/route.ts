import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { normalizeSource } from '@/lib/normalize-source'
import { extractWithSnapvidDetailed } from '@/lib/media-extractor-snapvid'
import { getMediaCache, normalizeCachedMedia, saveMediaCache } from '@/lib/media-cache'
import { logApiError } from '@/lib/logger'
import { normalizeAndValidateHttpUrl } from '@/lib/url-validate'

const ALLOWED_MEDIA_HOSTS = ['twitter.com', 'x.com']

function isAllowedMediaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  return ALLOWED_MEDIA_HOSTS.some((host) => lower === host || lower.endsWith(`.${host}`))
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

    // New policy: for snapcdn, always prefer sourceUrl if present.
    // - If expired: snapcdn token will 401; must switch.
    // - Even if not expired: sourceUrl is more stable, avoids random 401.
    if (isSnapcdn && item.sourceUrl) {
      return {
        ...item,
        url: item.sourceUrl,
        fallbackUrl: item.fallbackUrl || item.url,
      }
    }

    // Keep an 'expired' variable for future use (do not remove); but no refetch logic here.
    void expired

    return item
  })
}

function formatResponse(url: string, media: ReturnType<typeof normalizeCachedMedia>, raw?: unknown) {
  const fixed = applyExpiryPolicy(media)
  const nowSec = Math.floor(Date.now() / 1000)

  return NextResponse.json({
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
    raw,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400'
    }
  })
}

const MEDIA_PROXY_BASE_PROTOCOL_RELATIVE = '//media.kedaya.xyz'

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

function pickPersistentMediaUrls(media: ReturnType<typeof normalizeCachedMedia>) {
  const out: string[] = []
  const seen = new Set<string>()

  const pushIfAllowed = (candidate?: string) => {
    if (!candidate) return

    // If it is already proxied, accept as-is (normalize to protocol-relative).
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

    // If it is a snapcdn token URL, try to decode the embedded twimg url.
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

    // Prefer sourceUrl if present (more stable than snapcdn token)
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

  if (params.persistKind === 'adultContent') {
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
}

// GET /api/preview-media?url=https://x.com/user/status/123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      )
    }

    let normalizedUrl: string
    try {
      normalizedUrl = normalizeAndValidateHttpUrl(url)
      const hostname = new URL(normalizedUrl).hostname
      if (!isAllowedMediaHost(hostname)) {
        return NextResponse.json(
          { error: 'Only x.com or twitter.com hosts are allowed' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid url' },
        { status: 400 }
      )
    }

    const force = searchParams.get('force') === '1'

    const persistKindRaw = searchParams.get('persistKind')
    const persistId = searchParams.get('persistId')
    const persistKind = (persistKindRaw === 'content' || persistKindRaw === 'adultContent') ? persistKindRaw : null
    const wantPersist = Boolean(persistKind && persistId)

    const cached = await getMediaCache(normalizedUrl)
    if (!force && cached?.status === 'success') {
      const media = normalizeCachedMedia(cached.parsedMedia)
      if (media.length > 0) {
        if (wantPersist && persistKind && persistId) {
          // best-effort; do not block response
          persistMediaUrls({
            persistKind,
            persistId,
            normalizedUrl,
            media,
          }).catch(() => {})
        }

        return formatResponse(normalizedUrl, media, cached.rawResponse)
      }
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000)
      })

      const extraction = await Promise.race([
        extractWithSnapvidDetailed(normalizedUrl),
        timeoutPromise,
      ]) as Awaited<ReturnType<typeof extractWithSnapvidDetailed>>

      const media = extraction.media || []

      if (media.length > 0) {
        await saveMediaCache(normalizedUrl, extraction.rawResponse, media)

        if (wantPersist && persistKind && persistId) {
          await persistMediaUrls({
            persistKind,
            persistId,
            normalizedUrl,
            media: normalizeCachedMedia(media as any),
          })
        }
      }

      return formatResponse(normalizedUrl, media, extraction.rawResponse)
    } catch (extractError) {
      logApiError('preview-media-extract', extractError, { url: normalizedUrl })

      return NextResponse.json({
        success: true,
        url: normalizedUrl,
        media: [],
        videos: [],
        images: [],
        count: { videos: 0, images: 0, total: 0 },
        extractError: extractError instanceof Error ? extractError.message : 'Extract failed',
        warning: 'Media extraction failed'
      })
    }
  } catch (error) {
    logApiError('preview-media', error)
    return NextResponse.json(
      {
        error: 'Failed to preview media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
