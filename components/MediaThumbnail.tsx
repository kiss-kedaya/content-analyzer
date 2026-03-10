'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'
import { LazyImage } from './LazyImage'

interface MediaThumbnailProps {
  url: string
  className?: string
  onPreview?: () => void
}

export default function MediaThumbnail({ url, className = '', onPreview }: MediaThumbnailProps) {
  const [loading, setLoading] = useState(true)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [primaryMediaType, setPrimaryMediaType] = useState<'video' | 'image' | null>(null)
  const [mediaLabel, setMediaLabel] = useState<string | null>(null)
  const [extraCount, setExtraCount] = useState(0)
  const [error, setError] = useState(false)
  const { fetchMedia } = useMediaCache()

  useEffect(() => {
    let isMounted = true

    async function fetchThumbnail() {
      if (!isMounted) return
      
      setLoading(true)
      setError(false)

      try {
        const data = await fetchMedia(url)

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
          setThumbnailUrl(ordered[0].url)
          setPrimaryMediaType(ordered[0].type)
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
    }

    fetchThumbnail()

    return () => {
      isMounted = false
    }
  }, [url, fetchMedia])

  const handleClick = () => {
    onPreview?.()
  }

  const containerClass = `relative overflow-hidden bg-black ${className} ${onPreview ? 'cursor-pointer' : ''}`

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error || !thumbnailUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-xs text-gray-400">无预览</span>
      </div>
    )
  }

  return (
    <div
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
      {primaryMediaType === 'video' ? (
        <>
          <video
            src={thumbnailUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            loop
            autoPlay
            onError={() => setError(true)}
          />
        </>
      ) : (
        <LazyImage
          src={thumbnailUrl}
          alt="Thumbnail"
          className="w-full h-full"
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
    </div>
  )
}
