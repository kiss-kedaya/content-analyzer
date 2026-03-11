'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface VideoInfo {
  url: string
  quality: string
  format: string
}

interface ImageInfo {
  url: string
}

interface MediaItem {
  type: 'video' | 'image'
  url: string
  sourceUrl?: string
  expiresAt?: number
  fallbackUrl?: string
  quality?: string
  format?: string
}

interface MediaData {
  videos: VideoInfo[]
  images: ImageInfo[]
  media: MediaItem[]
}

interface CacheEntry {
  data: MediaData
  timestamp: number
  isFailed: boolean
}

const mediaCache = new Map<string, CacheEntry>()
const inFlightRequests = new Map<string, Promise<MediaData | null>>()

// Avoid spamming persist writes when cached media is used repeatedly.
const persistRequests = new Map<string, number>()
const PERSIST_TTL_MS = 5 * 60 * 1000

const DEFAULT_FAILED_TTL_MS = 30 * 1000
const DEFAULT_SUCCESS_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10 * 1000
const EMPTY_MEDIA_DATA: MediaData = { videos: [], images: [], media: [] }

function toAbsoluteUrl(input: string): string {
  return input.startsWith('//') ? `https:${input}` : input
}

function detectMediaTypeByPathname(pathname: string): 'video' | 'image' | null {
  const lower = pathname.toLowerCase()
  if (lower.endsWith('.mp4') || lower.endsWith('.m3u8') || lower.endsWith('.mov')) return 'video'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif')) return 'image'
  return null
}

function tryBuildDirectMediaData(inputUrl: string): MediaData | null {
  try {
    const abs = toAbsoluteUrl(inputUrl)
    const u = new URL(abs)

    // If already proxied through media.kedaya.xyz, just treat it as final media URL.
    const host = u.hostname.toLowerCase()
    const isProxy = host === 'media.kedaya.xyz'

    if (isProxy) {
      // If url param exists, we can detect type from it; otherwise fallback to path.
      const raw = u.searchParams.get('url') || abs
      const rawAbs = toAbsoluteUrl(raw)
      const rawUrl = new URL(rawAbs)
      const t = detectMediaTypeByPathname(rawUrl.pathname) || detectMediaTypeByPathname(u.pathname)
      if (!t) return null

      const item: MediaItem = { type: t, url: inputUrl }
      return { videos: t === 'video' ? [{ url: inputUrl, quality: '', format: '' }] : [], images: t === 'image' ? [{ url: inputUrl }] : [], media: [item] }
    }

    // Direct media hosts (twimg)
    const isTwimg = host === 'video.twimg.com' || host === 'pbs.twimg.com' || host.endsWith('.twimg.com')
    if (!isTwimg) return null

    const t = detectMediaTypeByPathname(u.pathname)
    if (!t) return null

    const item: MediaItem = { type: t, url: inputUrl }
    return { videos: t === 'video' ? [{ url: inputUrl, quality: '', format: '' }] : [], images: t === 'image' ? [{ url: inputUrl }] : [], media: [item] }
  } catch {
    return null
  }
}

interface FetchOptions {
  force?: boolean
  failedTtlMs?: number
  successTtlMs?: number
  persistKind?: 'content' | 'adultContent'
  persistId?: string
}

function getCachedMedia(url: string, options: FetchOptions): MediaData | null {
  const cached = mediaCache.get(url)

  if (!cached) {
    return null
  }

  const failedTtlMs = options.failedTtlMs ?? DEFAULT_FAILED_TTL_MS
  const successTtlMs = options.successTtlMs ?? DEFAULT_SUCCESS_TTL_MS
  const ttl = cached.isFailed ? failedTtlMs : successTtlMs

  if (Date.now() - cached.timestamp < ttl) {
    return cached.data
  }

  mediaCache.delete(url)
  return null
}

export function useMediaCache() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchMedia = useCallback(async (url: string, options: FetchOptions = {}): Promise<MediaData | null> => {
    const wantPersist = Boolean(options.persistKind && options.persistId)

    // Short-circuit: if input is already a direct media URL (twimg) or media proxy URL,
    // do NOT call /api/preview-media.
    if (!options.force) {
      const direct = tryBuildDirectMediaData(url)
      if (direct) {
        mediaCache.set(url, {
          data: direct,
          timestamp: Date.now(),
          isFailed: direct.media.length === 0,
        })
        return direct
      }

      const cachedData = getCachedMedia(url, options)
      if (cachedData) {
        // If caller wants persistence, still issue a best-effort background request
        // (throttled) to allow server to write back mediaUrls.
        if (wantPersist) {
          const persistKey = `${options.persistKind}:${options.persistId}:${url}`
          const last = persistRequests.get(persistKey) || 0
          if (Date.now() - last > PERSIST_TTL_MS) {
            persistRequests.set(persistKey, Date.now())
            fetch(`/api/preview-media?${new URLSearchParams({
              url,
              persistKind: options.persistKind as string,
              persistId: options.persistId as string,
            }).toString()}`, { cache: 'no-store' }).catch(() => {})
          }
        }

        return cachedData
      }
    } else {
      mediaCache.delete(url)
    }

    const existingRequest = inFlightRequests.get(url)
    if (existingRequest) {
      return existingRequest
    }

    if (isMountedRef.current) {
      setLoading(prev => ({ ...prev, [url]: true }))
    }

    const request = (async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      try {
        const params = new URLSearchParams({
          url,
        })

        if (options.force) {
          params.set('force', '1')
        }

        if (options.persistKind && options.persistId) {
          params.set('persistKind', options.persistKind)
          params.set('persistId', options.persistId)
        }

        const response = await fetch(`/api/preview-media?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch media')
        }

        const payload = await response.json()
        const media: MediaItem[] = Array.isArray(payload.media)
          ? payload.media.filter((item: MediaItem) => item?.url && item?.type)
          : [
              ...(Array.isArray(payload.videos) ? payload.videos.map((item: VideoInfo) => ({ ...item, type: 'video' as const })) : []),
              ...(Array.isArray(payload.images) ? payload.images.map((item: ImageInfo) => ({ ...item, type: 'image' as const })) : []),
            ]

        const data: MediaData = {
          videos: Array.isArray(payload.videos) ? payload.videos : media.filter(item => item.type === 'video').map(item => ({ url: item.url, quality: item.quality || '', format: item.format || '' })),
          images: Array.isArray(payload.images) ? payload.images : media.filter(item => item.type === 'image').map(item => ({ url: item.url })),
          media,
        }

        mediaCache.set(url, {
          data,
          timestamp: Date.now(),
          isFailed: data.media.length === 0,
        })

        return data
      } catch (error) {
        console.error('Failed to fetch media:', error)
        mediaCache.set(url, {
          data: EMPTY_MEDIA_DATA,
          timestamp: Date.now(),
          isFailed: true
        })
        return null
      } finally {
        clearTimeout(timeoutId)
        inFlightRequests.delete(url)
        if (isMountedRef.current) {
          setLoading(prev => ({ ...prev, [url]: false }))
        }
      }
    })()

    inFlightRequests.set(url, request)
    return request
  }, [])

  const clearCache = useCallback((url?: string) => {
    if (url) {
      mediaCache.delete(url)
      inFlightRequests.delete(url)
    } else {
      mediaCache.clear()
      inFlightRequests.clear()
    }
  }, [])

  return { fetchMedia, clearCache }
}
