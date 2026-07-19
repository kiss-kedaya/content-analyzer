'use client'

import { useCallback, useEffect, useRef, useState, type TouchEvent, type WheelEvent } from 'react'
import { Pause, Play, Volume2, VolumeX, X } from '@/components/Icon'
import { VIDEO_PLAYBACK_RATES, type VideoFeedItem } from '@/lib/media-display'

interface ShortVideoPlayerProps {
  items: VideoFeedItem[]
  initialIndex: number
  onClose: () => void
}

const SPEED_STORAGE_KEY = 'content-analyzer-video-speed'
const SWIPE_THRESHOLD = 64

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, a, input, select'))
}

export default function ShortVideoPlayer({ items, initialIndex, onClose }: ShortVideoPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, Math.min(initialIndex, items.length - 1)))
  const [playbackRate, setPlaybackRate] = useState(1)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const touchStartRef = useRef<number | null>(null)
  const wheelLockedRef = useRef(false)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const active = items[activeIndex]

  const changeIndex = useCallback((direction: 1 | -1) => {
    if (items.length < 2) return
    setActiveIndex((current) => (current + direction + items.length) % items.length)
    setCurrentTime(0)
    setDuration(0)
    setError(null)
    setPaused(false)
  }, [items.length])

  const goNext = useCallback(() => changeIndex(1), [changeIndex])
  const goPrevious = useCallback(() => changeIndex(-1), [changeIndex])

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      try {
        await video.play()
      } catch {
        setPaused(true)
      }
    } else {
      video.pause()
    }
  }, [])

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    closeButtonRef.current?.focus()

    try {
      const stored = Number(localStorage.getItem(SPEED_STORAGE_KEY))
      if (VIDEO_PLAYBACK_RATES.includes(stored as typeof VIDEO_PLAYBACK_RATES[number])) setPlaybackRate(stored)
    } catch {
      // Storage may be unavailable in private browsing.
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
      returnFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        goNext()
        return
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        goPrevious()
        return
      }
      if (event.key === ' ' && !isInteractiveTarget(event.target)) {
        event.preventDefault()
        void togglePlayback()
        return
      }
      if (event.key === 'm' || event.key === 'M') setMuted((value) => !value)

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select'))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrevious, onClose, togglePlayback])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
    const frame = requestAnimationFrame(() => {
      video.play().catch(() => setPaused(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [activeIndex, playbackRate])

  if (!active) return null

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return
    touchStartRef.current = event.changedTouches[0]?.clientY ?? null
    setDragY(0)
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartRef.current === null || isInteractiveTarget(event.target)) return
    const currentY = event.changedTouches[0]?.clientY
    if (currentY === undefined) return
    const delta = currentY - touchStartRef.current
    if (Math.abs(delta) > 8 && event.cancelable) event.preventDefault()
    setDragY(Math.max(-140, Math.min(140, delta)))
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartRef.current === null) return
    const endY = event.changedTouches[0]?.clientY ?? touchStartRef.current
    const delta = endY - touchStartRef.current
    touchStartRef.current = null
    setDragY(0)
    if (delta <= -SWIPE_THRESHOLD) goNext()
    else if (delta >= SWIPE_THRESHOLD) goPrevious()
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 32 || wheelLockedRef.current || isInteractiveTarget(event.target)) return
    wheelLockedRef.current = true
    if (event.deltaY > 0) goNext()
    else goPrevious()
    window.setTimeout(() => { wheelLockedRef.current = false }, 450)
  }

  const updatePlaybackRate = (value: number) => {
    setPlaybackRate(value)
    if (videoRef.current) videoRef.current.playbackRate = value
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, String(value))
    } catch {
      // Storage is optional.
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white" onWheel={handleWheel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="短视频播放模式"
        tabIndex={-1}
        className="relative h-full w-full overflow-hidden outline-none"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { touchStartRef.current = null; setDragY(0) }}
      >
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))] md:px-6">
          <span className="text-sm tabular-nums text-white/80" aria-live="polite">{activeIndex + 1} / {items.length}</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="关闭短视频模式"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative flex h-full w-full items-center justify-center transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
          style={{ transform: `translateY(${dragY * 0.16}px)`, opacity: 1 - Math.min(Math.abs(dragY) / 700, 0.16) }}
        >
          <video
            key={active.key}
            ref={videoRef}
            src={active.mediaUrl}
            autoPlay
            muted={muted}
            playsInline
            preload="auto"
            className="h-full w-full bg-black object-contain"
            onClick={() => void togglePlayback()}
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = playbackRate
              setDuration(event.currentTarget.duration || 0)
            }}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onError={() => setError('视频加载失败，请切换下一条或稍后重试')}
            aria-label={active.title}
          />

          {paused && !error && (
            <button
              type="button"
              onClick={() => void togglePlayback()}
              className="absolute left-1/2 top-1/2 inline-flex min-h-16 min-w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="继续播放"
            >
              <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true" />
            </button>
          )}

          {error && (
            <div className="absolute left-1/2 top-1/2 w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/75 p-5 text-center backdrop-blur" role="alert">
              <p className="text-sm font-medium">{error}</p>
              <button type="button" onClick={goNext} className="mt-4 min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                播放下一条
              </button>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/75 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 md:px-6">
          <div className="mx-auto max-w-4xl space-y-3">
            <h2 className="line-clamp-2 text-base font-semibold leading-6 text-white md:text-lg">{active.title}</h2>

            <label className="flex min-h-11 items-center gap-3 text-xs tabular-nums text-white/75">
              <span className="w-9 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={Math.max(duration, 0.1)}
                step="0.1"
                value={Math.min(currentTime, duration || 0)}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (videoRef.current) videoRef.current.currentTime = value
                  setCurrentTime(value)
                }}
                className="h-11 min-w-0 flex-1 accent-white"
                aria-label="播放进度"
              />
              <span className="w-9">{formatTime(duration)}</span>
            </label>

            <div className="flex flex-nowrap items-center gap-2">
              <button type="button" onClick={() => void togglePlayback()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black" aria-label={paused ? '播放' : '暂停'}>
                {paused ? <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" /> : <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" />}
              </button>
              <button type="button" onClick={() => setMuted((value) => !value)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={muted ? '开启声音' : '静音'}>
                {muted ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
              </button>
              <label className="inline-flex h-11 shrink-0 items-center rounded-full bg-white/15 px-1 text-white backdrop-blur">
                <select
                  value={playbackRate}
                  onChange={(event) => updatePlaybackRate(Number(event.target.value))}
                  className="h-9 min-w-16 rounded-full bg-black/45 px-2 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="播放速度"
                >
                  {VIDEO_PLAYBACK_RATES.map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
