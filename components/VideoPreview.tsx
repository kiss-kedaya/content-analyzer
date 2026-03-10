'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

type MediaItem = {
  type: 'video' | 'image'
  url: string
  sourceUrl?: string
  expiresAt?: number
  fallbackUrl?: string
}

interface VideoPreviewProps {
  url: string
  onClose: () => void
}

export default function VideoPreview({ url, onClose }: VideoPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<MediaItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null)
  const touchLockRef = useRef<'x' | 'y' | null>(null)
  const { fetchMedia } = useMediaCache()

  const restoreFocus = useCallback(() => {
    const previousFocus = previousFocusRef.current
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus()
    }
  }, [])

  const handleClose = useCallback(() => {
    onClose()
    requestAnimationFrame(() => {
      restoreFocus()
    })
  }, [onClose, restoreFocus])

  const goPrev = useCallback(() => {
    setActiveIndex(prev => (prev === 0 ? items.length - 1 : prev - 1))
  }, [items.length])

  const goNext = useCallback(() => {
    setActiveIndex(prev => (prev === items.length - 1 ? 0 : prev + 1))
  }, [items.length])

  const fetchMediaUrls = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchMedia(url, { force: true })
      if (!data) {
        throw new Error('Failed to fetch media')
      }

      const merged = (data.media || []).reduce<MediaItem[]>((acc, item) => {
        if (!item?.url || acc.some(existing => existing.url === item.url)) {
          return acc
        }

        // 检查 snapcdn token 是否过期
        const now = Math.floor(Date.now() / 1000)
        let effectiveUrl = item.url
        
        // 如果有 expiresAt 且已过期，且有 sourceUrl，则使用 sourceUrl
        if (item.expiresAt && item.expiresAt < now && item.sourceUrl) {
          effectiveUrl = item.sourceUrl
        }

        acc.push({
          type: item.type,
          url: effectiveUrl,
          sourceUrl: item.sourceUrl,
          expiresAt: item.expiresAt,
          fallbackUrl: item.fallbackUrl,
        })

        return acc
      }, [])

      if (merged.length === 0) {
        throw new Error('No media found')
      }

      setItems(merged)
      setActiveIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [url, fetchMedia])

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    dialogRef.current?.focus()
  }, [activeIndex, loading, error])

  useEffect(() => {
    fetchMediaUrls()
  }, [fetchMediaUrls])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }

      if (items.length < 2) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, handleClose, items.length])

  useEffect(() => {
    return () => {
      restoreFocus()
    }
  }, [restoreFocus])

  const active = items[activeIndex]

  useEffect(() => {
    if (active?.type !== 'video') return

    const el = videoRef.current
    if (!el) return

    const tryPlay = async () => {
      try {
        await el.play()
      } catch {
        // ignore: user gesture may be required
      }
    }

    requestAnimationFrame(() => {
      tryPlay()
    })
  }, [active?.type, active?.url])

  const resetTouchState = () => {
    touchStartRef.current = null
    touchCurrentRef.current = null
    touchLockRef.current = null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="媒体预览"
        tabIndex={-1}
        className="relative w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] bg-white md:rounded-lg shadow-2xl overflow-hidden outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-black">媒体预览</h2>
          <button
            onClick={handleClose}
            aria-label="关闭预览"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-60px)] md:max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">加载失败</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={fetchMediaUrls}
                disabled={loading}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    重试中...
                  </>
                ) : (
                  '重试'
                )}
              </button>
            </div>
          )}

          {!loading && !error && active && (
            <div className="space-y-4">
              <div
                className="flex items-center justify-center"
                onTouchStart={(e) => {
                  const touch = e.changedTouches[0]
                  if (!touch) return

                  touchStartRef.current = { x: touch.clientX, y: touch.clientY }
                  touchCurrentRef.current = { x: touch.clientX, y: touch.clientY }
                  touchLockRef.current = null
                }}
                onTouchMove={(e) => {
                  const start = touchStartRef.current
                  const touch = e.changedTouches[0]
                  if (!start || !touch) return

                  const current = { x: touch.clientX, y: touch.clientY }
                  touchCurrentRef.current = current

                  const deltaX = current.x - start.x
                  const deltaY = current.y - start.y

                  if (!touchLockRef.current && (Math.abs(deltaX) > 12 || Math.abs(deltaY) > 12)) {
                    touchLockRef.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y'
                  }

                  if (touchLockRef.current === 'x' && e.cancelable) {
                    e.preventDefault()
                  }
                }}
                onTouchEnd={() => {
                  const start = touchStartRef.current
                  const current = touchCurrentRef.current
                  const axis = touchLockRef.current

                  if (!start || !current || !axis || items.length < 2) {
                    resetTouchState()
                    return
                  }

                  const deltaX = current.x - start.x

                  if (axis === 'x' && Math.abs(deltaX) >= 50) {
                    if (deltaX > 0) {
                      goPrev()
                    } else {
                      goNext()
                    }
                  }

                  resetTouchState()
                }}
                onTouchCancel={resetTouchState}
              >
                {active.type === 'video' ? (
                  <video
                    key={active.url}
                    ref={videoRef}
                    controls
                    muted
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="w-full rounded-lg bg-black"
                    style={{ maxHeight: '70vh' }}
                  >
                    <source src={active.url} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <img
                    key={active.url}
                    src={active.url}
                    alt={`媒体 ${activeIndex + 1}`}
                    className="w-full rounded-lg bg-black object-contain"
                    style={{ maxHeight: '70vh' }}
                  />
                )}
              </div>

              {items.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={goPrev} className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50">上一个</button>
                    <button onClick={goNext} className="px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50">下一个</button>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {items.map((item, idx) => (
                      <button
                        key={item.url}
                        onClick={() => setActiveIndex(idx)}
                        aria-pressed={idx === activeIndex}
                        className={`border rounded-md p-1 text-xs ${idx === activeIndex ? 'border-black' : 'border-gray-200'}`}
                      >
                        {item.type === 'video' ? '视频' : '图片'} {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
