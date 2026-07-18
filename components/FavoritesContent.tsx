'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Clock, Heart } from '@/components/Icon'
import FavoriteButton from './FavoriteButton'
import { getSourceTone } from '@/lib/content-presentation'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  favorited: boolean
  favoritedAt?: Date | null
  createdAt: Date
}

interface FavoritesContentProps {
  techContents: Content[]
  adultContents: Content[]
  currentTab: string
}

export default function FavoritesContent({
  techContents,
  adultContents,
  currentTab
}: FavoritesContentProps) {
  const getDisplayContents = () => {
    if (currentTab === 'tech') return techContents.map(c => ({ ...c, type: 'tech' as const }))
    if (currentTab === 'adult') return adultContents.map(c => ({ ...c, type: 'adult' as const }))
    return [
      ...techContents.map(c => ({ ...c, type: 'tech' as const })),
      ...adultContents.map(c => ({ ...c, type: 'adult' as const }))
    ].sort((a, b) => {
      const aTime = a.favoritedAt ? new Date(a.favoritedAt).getTime() : 0
      const bTime = b.favoritedAt ? new Date(b.favoritedAt).getTime() : 0
      return bTime - aTime
    })
  }

  const contents = getDisplayContents()

  if (contents.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-12 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-500">暂无收藏</p>
        <p className="text-sm text-gray-400 mt-2">点击内容的收藏按钮即可添加到收藏夹</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          浏览内容
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {contents.map((content) => (
        <div
          key={content.id}
          className="surface-card vercel-card rounded-2xl p-4 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* 左侧：内容信息 */}
            <div className="flex-1 space-y-3">
              {/* 标签 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${content.type === 'tech' ? 'source-linuxdo' : 'source-xiaohongshu'}`}>
                  {content.type === 'tech' ? '技术内容' : '成人内容'}
                </span>
                <span className={`badge ${getSourceTone(content.source)}`}>
                  {content.source}
                </span>
              </div>

              {/* 标题 */}
              {content.title && (
                <h3 className="text-lg font-semibold text-content md:text-xl">
                  {content.title}
                </h3>
              )}

              {/* 已保存内容 */}
              <p className="line-clamp-2 text-sm leading-6 text-muted md:text-base">
                {content.summary}
              </p>

              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-subtle md:gap-4 md:text-sm">
                {content.favoritedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 md:w-4 md:h-4" />
                    收藏于 {new Date(content.favoritedAt).toLocaleDateString('zh-CN')}
                  </span>
                )}
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1 hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                  查看原文
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 md:items-end">
              <div className="flex md:flex-col gap-2">
                <FavoriteButton
                  id={content.id}
                  initialFavorited={content.favorited}
                  type={content.type === 'tech' ? 'content' : 'adult-content'}
                />
                <Link
                  href={content.type === 'tech' ? `/content/${content.id}` : `/adult-content/${content.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-default bg-surface-raised px-3 text-sm font-medium text-content hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Eye className="w-3 h-3 md:w-4 md:h-4" />
                  详情
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
