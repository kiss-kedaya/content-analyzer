'use client'

import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'
import { LazyImage } from './LazyImage'
import { shouldProxyMediaUrl, toMediaProxyUrl } from '@/lib/media-proxy'
import { withVideoPreviewFrame } from '@/lib/media-display'

interface MediaThumbnailProps {
  url: string
  className?: string
  onPreview?: () => void
  fit?: 'cover' | 'contain'
  persist?: {
    kind: 'content' | 'adultContent'
    id: string
  }
}

export default function MediaThumbnail({ url, className = '', onPreview, fit = 'cover', persist }: MediaThumbnailProps) {
  const [loading, setLoading] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [primaryMediaType, setPrimaryMediaType] = useState<'video' | 'image' | null>(null)
  const [mediaLabel, setMediaLabel] = useState<string | null>(null)
  const [extraCount, setExtraCount] = useState(0)
  const [error, setError] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  const [videoFrameReady, setVideoFrameReady] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { fetchMedia } = useMediaCache()

  useEffect(() => {
    let isMounted = true

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return

        // Only request once per mount.
        observer.disconnect()

        ;(async () => {
          if (!isMounted) return

          setHasRequested(true)
          setLoading(true)
          setError(false)
          setVideoFrameReady(false)

          try {
            const data = await fetchMedia(url, {
              persistKind: persist?.kind,
              persistId: persist?.id,
            })

            if (!isMounted) return

            if (!data) {
              setError(true)
              return
            }

            const ordered = data.media || []
            const videoCount = data.videos?.length || 0
            const imageCount = data.images?.length || 0
            const totalCount = ordered.length || (videoCount + imageCount)

            if (ordered.length > 0) {
              const first = ordered[0]
              const nextUrl = shouldProxyMediaUrl(first.url) ? toMediaProxyUrl(first.url) : first.url
              setThumbnailUrl(nextUrl)
              setPrimaryMediaType(first.type)
            } else {
              setError(true)
              return
            }

            if (videoCount > 0 && imageCount > 0) {
              setMediaLabel('视频/图片')
            } else if (videoCount > 0) {
              setMediaLabel('视频')
            } else {
              setMediaLabel('图片')
            }

            setExtraCount(Math.max(totalCount - 1, 0))
          } catch (err) {
            console.error('Failed to fetch thumbnail:', err)
            if (isMounted) {
              setError(true)
            }
          } finally {
            if (isMounted) {
              setLoading(false)
            }
          }
        })()
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    )

    observer.observe(node)

    return () => {
      isMounted = false
      observer.disconnect()
    }
  }, [url, fetchMedia, persist?.id, persist?.kind])

  const handleClick = () => {
    onPreview?.()
  }

  const containerClass = `relative overflow-hidden bg-black ${className} ${onPreview ? 'cursor-pointer' : ''}`

  // Wrapper always mounts so IntersectionObserver can attach.
  // We show placeholder until in-view fetch completes.
  const Placeholder = () => (
    <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center bg-surface-raised">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-subtle" />
      ) : (
        <ImageIcon className="mb-2 h-8 w-8 text-subtle" />
      )}
      <span className="text-xs text-subtle">{loading || (primaryMediaType === 'video' && !videoFrameReady) ? '加载预览…' : '媒体预览'}</span>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={containerClass}
      onClick={handleClick}
      role={onPreview ? 'button' : undefined}
      tabIndex={onPreview ? 0 : undefined}
      onKeyDown={onPreview ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPreview()
        }
      } : undefined}
    >
      {(!hasRequested || error || !thumbnailUrl || (primaryMediaType === 'video' && !videoFrameReady)) && <Placeholder />}
      {hasRequested && !error && thumbnailUrl && (
        <>
          {primaryMediaType === 'video' ? (
            <video
              src={withVideoPreviewFrame(thumbnailUrl)}
              className={`h-full w-full transition-opacity duration-200 motion-reduce:transition-none ${videoFrameReady ? 'opacity-100' : 'opacity-0'} ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => setVideoFrameReady(true)}
              onCanPlay={() => setVideoFrameReady(true)}
              onError={() => setError(true)}
            />
          ) : (
            <LazyImage
              src={thumbnailUrl}
              alt="Thumbnail"
              fit={fit}
              className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
              onError={() => setError(true)}
            />
          )}

          <div className="absolute top-3 left-3 flex items-center gap-2">
            {mediaLabel && (
              <span className="inline-flex items-center rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                {mediaLabel}
              </span>
            )}
          </div>

          {extraCount > 0 && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-black shadow-sm">
                +{extraCount}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
