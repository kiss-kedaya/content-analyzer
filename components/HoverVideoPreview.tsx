'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

interface HoverVideoPreviewProps {
  url: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function HoverVideoPreview({ url, onMouseEnter, onMouseLeave }: HoverVideoPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { fetchMedia } = useMediaCache()
  
  useEffect(() => {
    fetchVideoUrl()
  }, [url])
  
  async function fetchVideoUrl() {
    setLoading(true)
    
    try {
      const data = await fetchMedia(url)
      
      if (data && data.videos && data.videos.length > 0) {
        setVideoUrl(data.videos[0].url)
      }
    } catch (err) {
      console.error('Failed to fetch video:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // 自动播放视频
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(err => {
        console.error('Failed to play video:', err)
      })
    }
  }, [videoUrl])
  
  return (
    <div 
      className="absolute left-full top-0 ml-2 z-[9999] bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
      style={{ width: '400px', maxWidth: '90vw' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
        <div className="p-4 text-center text-gray-500 text-sm">
          无视频预览
        </div>
      )}
    </div>
  )
}
