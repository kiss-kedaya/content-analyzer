'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from '@/components/Icon'
import { useMediaCache } from '@/hooks/useMediaCache'

type MediaItem = {
  type: 'video' | 'image'
  url: string
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
  const { fetchMedia } = useMediaCache()

  useEffect(() => {
    fetchMediaUrls()
  }, [url])

  async function fetchMediaUrls() {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchMedia(url, { force: true })
      if (!data) {
        throw new Error('Failed to fetch media')
      }

      const merged: MediaItem[] = [
        ...data.videos.map(v => ({ type: 'video' as const, url: v.url })),
        ...data.images.map(i => ({ type: 'image' as const, url: i.url }))
      ]

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
  }

  const active = items[activeIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] bg-white md:rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-black">媒体预览</h2>
          <button
            onClick={onClose}
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
                className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                重试
              </button>
            </div>
          )}

          {!loading && !error && active && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {active.type === 'video' ? (
                  <video controls autoPlay className="w-full rounded-lg bg-black" style={{ maxHeight: '70vh' }}>
                    <source src={active.url} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                ) : (
                  <img src={active.url} alt="Media" className="w-full rounded-lg bg-black object-contain" style={{ maxHeight: '70vh' }} />
                )}
              </div>

              {items.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {items.map((item, idx) => (
                    <button
                      key={item.url + idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`border rounded-md p-1 text-xs ${idx === activeIndex ? 'border-black' : 'border-gray-200'}`}
                    >
                      {item.type === 'video' ? '视频' : '图片'} {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
