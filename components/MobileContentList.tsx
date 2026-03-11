'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Trash2, Calendar, Hash } from '@/components/Icon'
import MediaThumbnail from './MediaThumbnail'
import { ConfirmDialog } from './ConfirmDialog'

interface MobileContentCardProps {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
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
  score,
  analyzedAt,
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 6) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (score >= 4) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-red-100 text-red-700 border-red-200'
  }

  const getSourceBadge = (source: string) => {
    const styles: Record<string, string> = {
      'X': 'bg-black text-white',
      'Xiaohongshu': 'bg-red-500 text-white',
      'Linuxdo': 'bg-blue-500 text-white',
      'GitHub': 'bg-gray-800 text-white'
    }
    return styles[source] || 'bg-gray-500 text-white'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* 头部：来源和评分 */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 text-xs font-medium rounded ${getSourceBadge(source)}`}>
          {source}
        </span>
        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>

      {/* 媒体预览（仅 X，列表不做弹窗预览，点击进入详情页） */}
      {hasMedia && mediaUrl && (
        <Link
          href={detailPath}
          className="relative block w-full h-48 rounded-lg overflow-hidden bg-gray-100"
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
      <div>
        <Link
          href={detailPath}
          className="text-sm font-medium text-black hover:text-blue-600 line-clamp-2"
        >
          {title || '无标题'}
        </Link>
      </div>

      {/* 摘要 */}
      <div>
        <p className={`text-xs text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {summary}
        </p>
        {summary.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        )}
      </div>

      {/* 元信息 */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(analyzedAt).toLocaleDateString('zh-CN')}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {id.slice(0, 8)}
        </span>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <Link
          href={detailPath}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Eye className="w-3 h-3" />
          查看
        </Link>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          原文
        </a>

        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            aria-label="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
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
      <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4' : 'space-y-3'}>
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
          if (confirmDelete) onDelete?.(confirmDelete)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
