'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

interface VideoPreviewProps {
  url: string
  onClose: () => void
}

export default function VideoPreview({ url, onClose }: VideoPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const { fetchMedia } = useMediaCache()
  
  useEffect(() => {
    fetchMediaUrls()
  }, [url])
  
  async function fetchMediaUrls() {
    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchMedia(url)
      
      if (!data) {
        throw new Error('Failed to fetch media')
      }
      
      // 默认选择第一个视频（最高质量）
      if (data.videos && data.videos.length > 0) {
        setVideoUrl(data.videos[0].url)
      } else if (data.images && data.images.length > 0) {
        // 如果没有视频，显示第一张图片
        setVideoUrl(data.images[0].url)
      } else {
        throw new Error('No media found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] bg-white md:rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-black">媒体预览</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
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
            </div>
          )}
          
          {!loading && !error && videoUrl && (
            <div className="flex items-center justify-center">
              <video
                controls
                autoPlay
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '70vh' }}
              >
                <source src={videoUrl} type="video/mp4" />
                您的浏览器不支持视频播放
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
