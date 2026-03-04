'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from '@/components/Icon'

interface HoverVideoPreviewProps {
  url: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

interface VideoInfo {
  url: string
  quality: string
  format: string
}

export default function HoverVideoPreview({ url, onMouseEnter, onMouseLeave }: HoverVideoPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    fetchVideoUrl()
  }, [url])
  
  async function fetchVideoUrl() {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/preview-media?url=${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }
      
      const data = await response.json()
      
      // 获取第一个视频
      if (data.videos && data.videos.length > 0) {
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
      className="absolute left-full top-0 ml-2 z-50 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
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
