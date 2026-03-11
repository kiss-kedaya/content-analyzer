'use client'

import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon } from '@/components/Icon'
import { shouldProxyMediaUrl, toMediaProxyUrl } from '@/lib/media-proxy'

type MediaItem = {
  type: 'video' | 'image'
  url: string
}

interface Props {
  kind: 'content' | 'adultContent'
  id: string
  source: string
  url: string
  mediaUrls?: string[]
}

function toAbsoluteUrl(input: string): string {
  return input.startsWith('//') ? `https:${input}` : input
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

function detectMediaType(rawUrl: string): MediaItem['type'] | null {
  try {
    const u = new URL(toAbsoluteUrl(rawUrl))

    // Support our proxy URL: //media.kedaya.xyz/?url=<real>
    if (u.hostname.toLowerCase() === 'media.kedaya.xyz') {
      const inner = u.searchParams.get('url')
      if (inner) {
        return detectMediaType(inner)
      }
    }

    const p = u.pathname.toLowerCase()
    if (p.endsWith('.mp4') || p.endsWith('.m3u8') || p.endsWith('.mov')) return 'video'
    if (p.endsWith('.jpg') || p.endsWith('.jpeg') || p.endsWith('.png') || p.endsWith('.webp') || p.endsWith('.gif')) return 'image'
    return null
  } catch {
    return null
  }
}

function normalizeDisplayUrl(rawUrl: string): string {
  // If it is a twimg host, proxy it.
  try {
    const u = new URL(toAbsoluteUrl(rawUrl))
    const host = u.hostname.toLowerCase()
    const isTwimg = host === 'video.twimg.com' || host === 'pbs.twimg.com' || host.endsWith('.twimg.com')

    if (isTwimg) {
      // Prefer protocol-relative proxy in persistence, but display proxy is fine.
      return shouldProxyMediaUrl(rawUrl) ? toMediaProxyUrl(rawUrl) : `//media.kedaya.xyz/?url=${encodeURIComponent(rawUrl)}`
    }
  } catch {
    // ignore
  }

  return rawUrl
}

export default function DetailMediaGallery({ kind, id, source, url, mediaUrls }: Props) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const initialItems = useMemo(() => {
    const list = (mediaUrls || [])
      .map((u) => ({ u, t: detectMediaType(u) }))
      .filter((x) => Boolean(x.t))
      .map((x) => ({ type: x.t as MediaItem['type'], url: normalizeDisplayUrl(x.u) }))

    return list
  }, [mediaUrls])

  useEffect(() => {
    setItems(initialItems)
    setActiveIndex(0)
  }, [initialItems])

  const shouldFetchOnce = useMemo(() => {
    // Only fetch/persist for X source and tweet url when mediaUrls is empty.
    const isX = source === 'X'
    const empty = !mediaUrls || mediaUrls.length === 0
    return isX && empty && isTweetUrl(url)
  }, [mediaUrls, source, url])

  useEffect(() => {
    if (!shouldFetchOnce) return

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          url,
          persistKind: kind,
          persistId: id,
        })

        const res = await fetch(`/api/preview-media?${params.toString()}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to fetch media')
        }

        const payload = await res.json()
        const media = Array.isArray(payload?.media) ? payload.media : []
        const mapped: MediaItem[] = media
          .filter((m: any) => m && (m.type === 'video' || m.type === 'image') && typeof m.url === 'string')
          .map((m: any) => ({ type: m.type, url: normalizeDisplayUrl(m.url) }))

        if (!cancelled && mapped.length > 0) {
          setItems(mapped)
          setActiveIndex(0)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [id, kind, shouldFetchOnce, url])

  const active = items[activeIndex]

  // If there is no media and we are not even going to fetch, hide the whole block.
  if (items.length === 0 && !loading && !error && !shouldFetchOnce) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <h2 className="text-sm md:text-base font-semibold text-gray-900">媒体预览</h2>
        </div>

        {active?.type === 'image' && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-2 text-xs md:text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {expanded ? '还原' : '放大'}
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div
          className={`relative w-full overflow-hidden rounded-lg border border-gray-200 bg-black ${expanded ? 'h-[min(92dvh,900px)]' : 'h-64 md:h-96'}`}
        >
          {active && (
            active.type === 'video' ? (
              <video
                key={active.url}
                src={active.url}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={active.url}
                src={active.url}
                alt="media"
                className="w-full h-full object-contain"
              />
            )
          )}
        </div>
      ) : (
        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          {loading ? '加载中...' : (error ? `媒体加载失败：${error}` : '暂无媒体')}
        </div>
      )}

      {items.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {items.map((it, idx) => (
            <button
              key={`${it.url}-${idx}`}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${idx === activeIndex ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              aria-pressed={idx === activeIndex}
            >
              {it.type === 'video' ? '视频' : '图片'} {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
