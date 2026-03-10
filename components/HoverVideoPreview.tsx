'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

interface HoverVideoPreviewProps {
  url: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const PREVIEW_OPEN_DELAY_MS = 180
const PREVIEW_CLOSE_GRACE_MS = 160
const HOVER_FAILED_TTL_MS = 8 * 1000

export default function HoverVideoPreview({ url, onMouseEnter, onMouseLeave }: HoverVideoPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [position, setPosition] = useState<'right' | 'left'>('right')
  const [retryToken, setRetryToken] = useState(0)
  const [shouldRender, setShouldRender] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)
  const { fetchMedia } = useMediaCache()

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimerRef.current = setTimeout(() => {
      setShouldRender(false)
    }, PREVIEW_CLOSE_GRACE_MS)
  }, [cancelClose])

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) {
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const previewWidth = 400
    const spaceOnRight = viewportWidth - rect.right

    setPosition(spaceOnRight < previewWidth + 20 ? 'left' : 'right')
  }, [])

  const fetchVideoUrl = useCallback(async (force = false) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setLoading(true)

    try {
      const data = await fetchMedia(url, {
        force,
        failedTtlMs: HOVER_FAILED_TTL_MS
      })

      if (requestIdRef.current !== requestId) {
        return
      }

      if (data?.videos?.length) {
        setVideoUrl(data.videos[0].url)
      } else {
        setVideoUrl(null)
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setVideoUrl(null)
      }
      console.error('Failed to fetch video:', err)
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
        setIsRetrying(false)
      }
    }
  }, [fetchMedia, url])

  const handleRetry = useCallback(() => {
    cancelClose()
    setShouldRender(true)
    setIsRetrying(true)
    setRetryToken(prev => prev + 1)
  }, [cancelClose])

  const handleMouseEnter = useCallback(() => {
    cancelClose()
    setShouldRender(true)
    onMouseEnter?.()
  }, [cancelClose, onMouseEnter])

  const handleMouseLeave = useCallback(() => {
    scheduleClose()
    onMouseLeave?.()
  }, [onMouseLeave, scheduleClose])

  useEffect(() => {
    cancelClose()
    setShouldRender(true)
    setVideoUrl(null)
    setLoading(true)

    if (retryToken === 0) {
      setIsRetrying(false)
    }

    openTimerRef.current = setTimeout(() => {
      calculatePosition()
      fetchVideoUrl(retryToken > 0)
    }, PREVIEW_OPEN_DELAY_MS)

    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current)
        openTimerRef.current = null
      }
    }
  }, [url, retryToken, calculatePosition, fetchVideoUrl, cancelClose])

  useEffect(() => {
    return () => {
      cancelClose()
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current)
      }
    }
  }, [cancelClose])

  useEffect(() => {
    if (videoRef.current && videoUrl && shouldRender) {
      videoRef.current.play().catch(err => {
        console.error('Failed to play video:', err)
      })
    }
  }, [videoUrl, shouldRender])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`absolute ${position === 'right' ? 'left-full ml-2' : 'right-full mr-2'} top-0 z-[9999] bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden`}
      style={{ width: '400px', maxWidth: '90vw' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {!loading && videoUrl && (
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          className="w-full"
          style={{ maxHeight: '300px' }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {!loading && !videoUrl && (
        <div className="p-4 text-center text-gray-500 text-sm space-y-3">
          <div>无视频预览</div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isRetrying}
          >
            {isRetrying ? '重试中...' : '重试预览'}
          </button>
        </div>
      )}
    </div>
  )
}
