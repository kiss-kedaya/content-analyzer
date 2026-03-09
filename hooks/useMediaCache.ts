'use client'

import { useState, useCallback } from 'react'

interface VideoInfo {
  url: string
  quality: string
  format: string
}

interface ImageInfo {
  url: string
}

interface MediaData {
  videos: VideoInfo[]
  images: ImageInfo[]
}

interface CacheEntry {
  data: MediaData
  timestamp: number
  isFailed: boolean
}

const mediaCache = new Map<string, CacheEntry>()
const FAILED_TTL_MS = 30 * 1000
const SUCCESS_TTL_MS = 5 * 60 * 1000

interface FetchOptions {
  force?: boolean
}

export function useMediaCache() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const fetchMedia = useCallback(async (url: string, options: FetchOptions = {}): Promise<MediaData | null> => {
    const now = Date.now()
    const cached = mediaCache.get(url)

    if (!options.force && cached) {
      const ttl = cached.isFailed ? FAILED_TTL_MS : SUCCESS_TTL_MS
      if (now - cached.timestamp < ttl) {
        return cached.data
      }
      mediaCache.delete(url)
    }

    if (loading[url]) {
      return new Promise((resolve) => {
        const checkCache = setInterval(() => {
          const updated = mediaCache.get(url)
          if (updated) {
            clearInterval(checkCache)
            resolve(updated.data)
          }
        }, 100)

        setTimeout(() => {
          clearInterval(checkCache)
          resolve(null)
        }, 10000)
      })
    }

    setLoading(prev => ({ ...prev, [url]: true }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`/api/preview-media?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const payload = await response.json()
      const data: MediaData = {
        videos: Array.isArray(payload.videos) ? payload.videos : [],
        images: Array.isArray(payload.images) ? payload.images : []
      }

      const isFailed = data.videos.length === 0 && data.images.length === 0
      mediaCache.set(url, {
        data,
        timestamp: Date.now(),
        isFailed
      })

      return data
    } catch (error) {
      console.error('Failed to fetch media:', error)
      const emptyData: MediaData = { videos: [], images: [] }
      mediaCache.set(url, {
        data: emptyData,
        timestamp: Date.now(),
        isFailed: true
      })
      return null
    } finally {
      setLoading(prev => ({ ...prev, [url]: false }))
    }
  }, [loading])

  const clearCache = useCallback((url?: string) => {
    if (url) {
      mediaCache.delete(url)
    } else {
      mediaCache.clear()
    }
  }, [])

  return { fetchMedia, clearCache }
}
