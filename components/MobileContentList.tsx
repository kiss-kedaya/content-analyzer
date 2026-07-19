'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Trash2, Calendar, Hash, User, Play, Loader2 } from '@/components/Icon'
import MediaThumbnail from './MediaThumbnail'
import ShortVideoPlayer from './ShortVideoPlayer'
import { ConfirmDialog } from './ConfirmDialog'
import { getAuthorLink } from '@/lib/author-link'
import { getSourceTone } from '@/lib/content-presentation'
import { buildVideoFeed, detectDisplayMediaType, isStableDisplayMediaUrl, pickPrimaryDisplayMedia, toAbsoluteMediaUrl, type VideoFeedItem } from '@/lib/media-display'
import type { ApiResponse, ContentListItem } from '@/types'
import { formatAppDate } from '@/lib/date-format'

interface MobileContentCardProps {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  createdAt: Date | string
  analyzedBy?: string | null
  mediaUrls?: string[]
  onDelete?: (id: string) => void
  onPlayVideo?: (mediaUrl: string) => void
  isVideoLoading?: boolean
  detailPath: string
}

export function MobileContentCard({
  id,
  source,
  url,
  title,
  summary,
  createdAt,
  analyzedBy,
  mediaUrls,
  onDelete,
  onPlayVideo,
  isVideoLoading = false,
  detailPath
}: MobileContentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 统一媒体策略：
  // - source == 'X' 才显示媒体预览
  // - 优先使用已回填的 mediaUrls[0]（twimg/pbs 直链）；否则回退到原文 url（仅当其本身就是 x.com/twitter.com）
  const isX = source === 'X'

  const mediaUrl = useMemo(() => {
    if (!isX) return null

    const firstStableFromMediaUrls = pickPrimaryDisplayMedia(mediaUrls)

    if (firstStableFromMediaUrls) {
      return firstStableFromMediaUrls
    }

    // Fallback: only allow tweet page URLs (x.com/twitter.com) so preview-media can extract and persist.
    try {
      const u = new URL(url)
      const host = u.hostname.toLowerCase()
      if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) {
        return url
      }
    } catch {
      // ignore
    }

    return null
  }, [isX, mediaUrls, url])

  const hasMedia = Boolean(mediaUrl)
  const isVideoPreview = Boolean(mediaUrl && isStableDisplayMediaUrl(mediaUrl) && detectDisplayMediaType(mediaUrl) === 'video')
  const author = getAuthorLink(source, analyzedBy)

  return (
    <article className="surface-card vercel-card flex h-full flex-col space-y-4 rounded-2xl p-4">
      <div className="flex items-center">
        <span className={`badge ${getSourceTone(source)}`}>
          {source}
        </span>
      </div>

      {/* 视频直接播放；图片进入详情。 */}
      {hasMedia && mediaUrl && (isVideoPreview && onPlayVideo ? (
        <button
          type="button"
          onClick={() => onPlayVideo(mediaUrl)}
          className="group relative block h-48 w-full overflow-hidden rounded-xl bg-surface-raised text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span className="sr-only">播放视频：{title || '无标题'}</span>
          <MediaThumbnail
            url={mediaUrl}
            className="h-full w-full"
            persist={{ kind: detailPath.startsWith('/adult-content/') ? 'adultContent' : 'content', id }}
          />
          <span className="absolute left-1/2 top-1/2 z-10 inline-flex min-h-14 min-w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur transition-colors group-hover:bg-black/75" aria-hidden="true">
            {isVideoLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="ml-0.5 h-6 w-6" fill="currentColor" />}
          </span>
        </button>
      ) : (
        <Link
          href={detailPath}
          prefetch={false}
          className="relative block h-48 w-full overflow-hidden rounded-xl bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <MediaThumbnail
            url={mediaUrl}
            className="h-full w-full"
            persist={{ kind: detailPath.startsWith('/adult-content/') ? 'adultContent' : 'content', id }}
          />
          <span className="absolute bottom-3 left-3 z-10 inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-950 shadow-sm backdrop-blur-sm">
            查看详情
          </span>
        </Link>
      ))}

      {/* 标题 */}
      <div className="space-y-1">
        <Link
          href={detailPath}
          prefetch={false}
          className="flex min-h-11 items-center rounded-md text-base font-semibold leading-6 text-content hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span className="line-clamp-2">{title || '无标题'}</span>
        </Link>
      </div>

      {/* 已保存正文；summary 是兼容旧表结构的字段名。 */}
      <div>
        <p className={`text-sm leading-6 text-muted ${isExpanded ? '' : 'line-clamp-2'}`}>
          {summary}
        </p>
        {summary.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-h-11 min-w-11 rounded-md px-2 text-sm font-medium text-brand hover:text-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-expanded={isExpanded}
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        )}
      </div>

      {/* 元信息 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-subtle">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatAppDate(createdAt)}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {id.slice(0, 8)}
        </span>
        {author && (
          <a
            href={author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-1 rounded-md transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <User className="w-3 h-3" />
            {author.label}
          </a>
        )}
        {!author && analyzedBy && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {analyzedBy}
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="mt-auto flex items-center gap-2 border-t border-default pt-3">
        <Link
          href={detailPath}
          prefetch={false}
          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-surface-raised px-3 text-sm font-medium text-content transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Eye className="w-3 h-3" />
          查看
        </Link>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-surface-raised px-3 text-sm font-medium text-content transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ExternalLink className="w-3 h-3" />
          原文
        </a>

        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  )
}

interface MobileContentListProps {
  contents: ContentListItem[]
  onDelete?: (id: string) => void
  detailPathPrefix: string
}

export function MobileContentList({
  contents,
  onDelete,
  detailPathPrefix
}: MobileContentListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null)
  const [fullVideoFeed, setFullVideoFeed] = useState<VideoFeedItem[] | null>(null)
  const [openingVideoKey, setOpeningVideoKey] = useState<string | null>(null)
  const videoFeedRequestRef = useRef<Promise<VideoFeedItem[]> | null>(null)
  const loadedVideoFeed = useMemo(() => buildVideoFeed(contents), [contents])
  const videoFeed = fullVideoFeed ?? loadedVideoFeed
  const videoEndpoint = detailPathPrefix === '/adult-content' ? '/api/adult-content/videos' : '/api/content/videos'

  const loadFullVideoFeed = useCallback((): Promise<VideoFeedItem[]> => {
    if (fullVideoFeed) return Promise.resolve(fullVideoFeed)
    if (videoFeedRequestRef.current) return videoFeedRequestRef.current

    const request = fetch(videoEndpoint, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as ApiResponse<VideoFeedItem[]>
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error?.message || '视频目录加载失败')
        }
        setFullVideoFeed(result.data)
        return result.data
      })
      .finally(() => { videoFeedRequestRef.current = null })

    videoFeedRequestRef.current = request
    return request
  }, [fullVideoFeed, videoEndpoint])

  useEffect(() => {
    void loadFullVideoFeed().catch(() => {
      // Keep the already loaded page playable; clicking a preview retries the directory request.
    })
  }, [loadFullVideoFeed])

  const openVideo = useCallback(async (contentId: string, mediaUrl: string) => {
    const absolute = toAbsoluteMediaUrl(mediaUrl)
    const pendingKey = `${contentId}:${absolute}`
    setOpeningVideoKey(pendingKey)

    let feed = videoFeed
    try {
      feed = await loadFullVideoFeed()
    } catch {
      // A directory failure must not prevent playback of the already loaded page.
    }

    const index = feed.findIndex((item) => item.id === contentId && item.mediaUrl === absolute)
    if (index >= 0) setActiveVideoIndex(index)
    setOpeningVideoKey(null)
  }, [loadFullVideoFeed, videoFeed])

  const isGrid = true

  return (
    <>
      <div className={isGrid ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
        {contents.map((content) => (
          <MobileContentCard
            key={content.id}
            {...content}
            onDelete={onDelete ? () => setConfirmDelete(content.id) : undefined}
            onPlayVideo={(mediaUrl) => { void openVideo(content.id, mediaUrl) }}
            isVideoLoading={openingVideoKey?.startsWith(`${content.id}:`) ?? false}
            detailPath={`${detailPathPrefix}/${content.id}`}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="确认删除"
        message="确定要删除这条内容吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
        onConfirm={() => {
          if (confirmDelete) {
            onDelete?.(confirmDelete)
            setConfirmDelete(null)
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      {activeVideoIndex !== null && (
        <ShortVideoPlayer
          items={videoFeed}
          initialIndex={activeVideoIndex}
          onClose={() => setActiveVideoIndex(null)}
        />
      )}
    </>
  )
}
