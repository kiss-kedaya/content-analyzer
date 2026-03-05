'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Image as ImageIcon, Loader2, X } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

interface MediaThumbnailProps {
  url: string
  className?: string
}

export default function MediaThumbnail({ url, className = '' }: MediaThumbnailProps) {
  const [loading, setLoading] = useState(true)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null)
  const [error, setError] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { fetchMedia } = useMediaCache()
  
  useEffect(() => {
    fetchThumbnail()
  }, [url])
  
  async function fetchThumbnail() {
    setLoading(true)
    setError(false)
    
    try {
      const data = await fetchMedia(url)
      
      if (!data) {
        setError(true)
        return
      }
      
      // 优先显示视频缩略图
      if (data.videos && data.videos.length > 0) {
        setThumbnailUrl(data.videos[0].url)
        setMediaType('video')
      } else if (data.images && data.images.length > 0) {
        setThumbnailUrl(data.images[0].url)
        setMediaType('image')
      } else {
        // 没有媒体，显示占位图
        setError(true)
      }
    } catch (err) {
      console.error('Failed to fetch thumbnail:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }
  
  const handleClick = () => {
    if (mediaType === 'video') {
      // 视频：切换播放状态
      setPlaying(!playing)
      if (videoRef.current) {
        if (playing) {
          videoRef.current.pause()
        } else {
          videoRef.current.play()
        }
      }
    } else if (mediaType === 'image') {
      // 图片：显示大图模态框
      setShowImageModal(true)
    }
  }
  
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
    <>
      <div 
        className={`relative overflow-hidden bg-black ${className} cursor-pointer`}
        onClick={handleClick}
      >
        {mediaType === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={thumbnailUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              loop
              onError={() => setError(true)}
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-black ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={thumbnailUrl}
            alt="Thumbnail"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        )}
      </div>
      
      {/* 图片大图模态框 */}
      {showImageModal && mediaType === 'image' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={thumbnailUrl}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
