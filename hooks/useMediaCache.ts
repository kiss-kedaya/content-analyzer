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

// 全局缓存
const mediaCache = new Map<string, MediaData>()

export function useMediaCache() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  
  const fetchMedia = useCallback(async (url: string): Promise<MediaData | null> => {
    // 检查缓存
    if (mediaCache.has(url)) {
      return mediaCache.get(url)!
    }
    
    // 检查是否正在加载
    if (loading[url]) {
      // 等待加载完成
      return new Promise((resolve) => {
        const checkCache = setInterval(() => {
          if (mediaCache.has(url)) {
            clearInterval(checkCache)
            resolve(mediaCache.get(url)!)
          }
        }, 100)
        
        // 10秒超时
        setTimeout(() => {
          clearInterval(checkCache)
          resolve(null)
        }, 10000)
      })
    }
    
    // 开始加载
    setLoading(prev => ({ ...prev, [url]: true }))
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(`/api/preview-media?url=${encodeURIComponent(url)}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }
      
      const data = await response.json()
      
      // 缓存数据
      mediaCache.set(url, data)
      
      return data
    } catch (error) {
      console.error('Failed to fetch media:', error)
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
