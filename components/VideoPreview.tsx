'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Play } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

interface VideoPreviewProps {
  url: string
  onClose: () => void
}

interface VideoInfo {
  url: string
  quality: string
  format: string
}

interface ImageInfo {
  url: string
}

export default function VideoPreview({ url, onClose }: VideoPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [images, setImages] = useState<ImageInfo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null)
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
      
      setVideos(data.videos || [])
      setImages(data.images || [])
      
      // 默认选择第一个视频（最高质量）
      if (data.videos && data.videos.length > 0) {
        setSelectedVideo(data.videos[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div className="relative w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] bg-white md:rounded-lg shadow-2xl overflow-hidden">
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
          
          {!loading && !error && (
            <div className="space-y-6">
              {/* 视频播放器 */}
              {selectedVideo && (
                <div className="space-y-4">
                  <video
                    key={selectedVideo.url}
                    controls
                    className="w-full rounded-lg bg-black"
                    style={{ maxHeight: '60vh' }}
                  >
                    <source src={selectedVideo.url} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                  
                  {/* 质量选择 */}
                  {videos.length > 1 && (
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                      <span className="text-xs md:text-sm text-gray-600">质量：</span>
                      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        {videos.map((video, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedVideo(video)}
                            className={`flex-shrink-0 px-4 py-2.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-colors touch-manipulation ${
                              selectedVideo.url === video.url
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {video.quality}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 图片 */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base md:text-lg font-semibold text-black">图片</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`Image ${index + 1}`}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 无媒体 */}
              {videos.length === 0 && images.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">未找到媒体</p>
                  <p className="text-sm mt-2">该推文可能没有图片或视频</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
