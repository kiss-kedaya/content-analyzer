'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Trash2, Calendar, Hash, User } from '@/components/Icon'
import MediaThumbnail from './MediaThumbnail'
import { ConfirmDialog } from './ConfirmDialog'
import { getAuthorLink } from '@/lib/author-link'
import { getSourceTone } from '@/lib/content-presentation'

interface MobileContentCardProps {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  analyzedAt: Date
  analyzedBy?: string | null
  mediaUrls?: string[]
  onDelete?: (id: string) => void
  detailPath: string
}

export function MobileContentCard({
  id,
  source,
  url,
  title,
  summary,
  analyzedAt,
  analyzedBy,
  mediaUrls,
  onDelete,
  detailPath
}: MobileContentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 统一媒体策略：
  // - source == 'X' 才显示媒体预览
  // - 优先使用已回填的 mediaUrls[0]（twimg/pbs 直链）；否则回退到原文 url（仅当其本身就是 x.com/twitter.com）
  const isX = source === 'X'

  const mediaUrl = useMemo(() => {
    if (!isX) return null

    const firstStableFromMediaUrls = (() => {
      if (!mediaUrls || mediaUrls.length === 0) return null

      for (const candidate of mediaUrls) {
        if (!candidate || typeof candidate !== 'string') continue

        const abs = candidate.startsWith('//') ? `https:${candidate}` : candidate
        try {
          const u = new URL(abs)
          const host = u.hostname.toLowerCase()

          // Skip snapcdn token URLs (they expire and may 401).
          if (host === 'dl.snapcdn.app') continue

          // Prefer our proxy or direct twimg.
          if (host === 'media.kedaya.xyz' || host === 'video.twimg.com' || host === 'pbs.twimg.com' || host.endsWith('.twimg.com')) {
            return candidate
          }
        } catch {
          // ignore
        }
      }

      return null
    })()

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
  const author = getAuthorLink(source, analyzedBy)

  return (
    <article className="surface-card vercel-card flex h-full flex-col space-y-4 rounded-2xl p-4">
      <div className="flex items-center">
        <span className={`badge ${getSourceTone(source)}`}>
          {source}
        </span>
      </div>

      {/* 媒体预览（仅 X，列表不做弹窗预览，点击进入详情页） */}
      {hasMedia && mediaUrl && (
        <Link
          href={detailPath}
          className="relative block h-48 w-full overflow-hidden rounded-xl bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="查看详情"
        >
          <MediaThumbnail
            url={mediaUrl}
            className="w-full h-full"
            persist={{ kind: detailPath.startsWith('/adult-content/') ? 'adultContent' : 'content', id }}
          />

          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-black shadow-sm backdrop-blur-sm">
            查看详情
          </span>
        </Link>
      )}

      {/* 标题 */}
      <div className="space-y-1">
        <Link
          href={detailPath}
          className="line-clamp-2 text-base font-semibold leading-6 text-content hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {title || '无标题'}
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
            className="min-h-9 text-sm font-medium text-brand hover:text-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
          {new Date(analyzedAt).toLocaleDateString('zh-CN')}
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
            className="flex items-center gap-1 hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
  contents: any[]
  onDelete?: (id: string) => void
  detailPathPrefix: string
}

export function MobileContentList({
  contents,
  onDelete,
  detailPathPrefix
}: MobileContentListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const isGrid = true

  return (
    <>
      <div className={isGrid ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
        {contents.map((content) => (
          <MobileContentCard
            key={content.id}
            {...content}
            onDelete={onDelete ? () => setConfirmDelete(content.id) : undefined}
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
    </>
  )
}
