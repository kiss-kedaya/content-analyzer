'use client'

import { useMemo, useState } from 'react'
import { Image as ImageIcon, Play } from '@/components/Icon'
import MediaThumbnail from '@/components/MediaThumbnail'
import { VideoPreview } from '@/components/DynamicMedia'

interface Props {
  title?: string
  url: string
  mediaUrls?: string[]
}

function isTweetUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl)
    const host = u.hostname.toLowerCase()
    return host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')
  } catch {
    return false
  }
}

export default function DetailMediaPreview({ title, url, mediaUrls }: Props) {
  const [open, setOpen] = useState(false)

  const thumbnailUrl = useMemo(() => {
    if (mediaUrls && mediaUrls.length > 0) {
      return mediaUrls[0]
    }
    return url
  }, [mediaUrls, url])

  const previewUrl = useMemo(() => {
    // Prefer tweet url so VideoPreview can switch multi-media.
    // If not a tweet url, fallback to thumbnail url (direct media or proxy URL).
    return isTweetUrl(url) ? url : thumbnailUrl
  }, [thumbnailUrl, url])

  const label = title || '媒体预览'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-gray-600" />
        <h2 className="text-sm md:text-base font-semibold text-gray-900">媒体预览</h2>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors"
        aria-label={label}
      >
        <MediaThumbnail url={thumbnailUrl} fit="contain" className="w-full h-full" />

        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-black shadow-sm backdrop-blur-sm">
          <Play className="w-3.5 h-3.5" />
          点击放大
        </span>
      </button>

      {open && <VideoPreview url={previewUrl} onClose={() => setOpen(false)} />}
    </div>
  )
}
