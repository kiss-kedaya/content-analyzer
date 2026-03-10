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

const DEFAULT_FAILED_TTL_MS = 30 * 1000
const DEFAULT_SUCCESS_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10 * 1000
const EMPTY_MEDIA_DATA: MediaData = { videos: [], images: [], media: [] }

interface FetchOptions {
  force?: boolean
  failedTtlMs?: number
  successTtlMs?: number
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
    if (!options.force) {
      const cachedData = getCachedMedia(url, options)
      if (cachedData) {
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
        const forceParam = options.force ? '&force=1' : ''
        const response = await fetch(`/api/preview-media?url=${encodeURIComponent(url)}${forceParam}`, {
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
