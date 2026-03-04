'use client'

import { useState, useEffect } from 'react'
import { Play, Image as ImageIcon, Loader2 } from '@/components/Icon'

interface MediaThumbnailProps {
  url: string
  className?: string
}

export default function MediaThumbnail({ url, className = '' }: MediaThumbnailProps) {
  const [loading, setLoading] = useState(true)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null)
  
  useEffect(() => {
    fetchThumbnail()
  }, [url])
  
  async function fetchThumbnail() {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/preview-media?url=${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }
      
      const data = await response.json()
      
      // 优先显示视频缩略图
      if (data.videos && data.videos.length > 0) {
        setThumbnailUrl(data.videos[0].url)
        setMediaType('video')
      } else if (data.images && data.images.length > 0) {
        setThumbnailUrl(data.images[0].url)
        setMediaType('image')
      }
    } catch (err) {
      console.error('Failed to fetch thumbnail:', err)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }
  
  if (!thumbnailUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }
  
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {mediaType === 'video' ? (
        <>
          <video
            src={thumbnailUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-1" />
            </div>
          </div>
        </>
      ) : (
        <img
          src={thumbnailUrl}
          alt="Thumbnail"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}
