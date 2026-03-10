'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Clock, Heart } from '@/components/Icon'
import FavoriteButton from './FavoriteButton'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
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

  const getSourceBadge = (source: string) => {
    const badges: Record<string, string> = {
      twitter: 'bg-blue-50 text-blue-700 border-blue-200',
      x: 'bg-blue-50 text-blue-700 border-blue-200',
      xiaohongshu: 'bg-pink-50 text-pink-700 border-pink-200',
      linuxdo: 'bg-green-50 text-green-700 border-green-200'
    }
    return badges[source.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTypeBadge = (type: 'tech' | 'adult') => {
    return type === 'tech'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-pink-50 text-pink-700 border-pink-200'
  }

  if (contents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-500">暂无收藏</p>
        <p className="text-sm text-gray-400 mt-2">点击内容的收藏按钮即可添加到收藏夹</p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
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
          className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:border-gray-300 transition-all"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* 左侧：内容信息 */}
            <div className="flex-1 space-y-3">
              {/* 标签 */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getTypeBadge(content.type)}`}>
                  {content.type === 'tech' ? '技术内容' : '成人内容'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSourceBadge(content.source)}`}>
                  {content.source}
                </span>
              </div>

              {/* 标题 */}
              {content.title && (
                <h3 className="text-lg md:text-xl font-semibold text-black">
                  {content.title}
                </h3>
              )}

              {/* 摘要 */}
              <p className="text-sm md:text-base text-gray-600 line-clamp-2">
                {content.summary}
              </p>

              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
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
                  className="inline-flex items-center gap-1 hover:text-black transition-colors"
                >
                  <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                  查看原文
                </a>
              </div>
            </div>

            {/* 右侧：评分和操作 */}
            <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-4">
              {/* 评分 */}
              <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 min-w-[80px]">
                <div className={`text-2xl md:text-3xl font-bold ${getScoreColor(content.score)}`}>
                  {content.score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500 mt-1">/ 10</div>
              </div>

              {/* 操作按钮 */}
              <div className="flex md:flex-col gap-2">
                <FavoriteButton
                  id={content.id}
                  initialFavorited={content.favorited}
                  type={content.type === 'tech' ? 'content' : 'adult-content'}
                />
                <Link
                  href={content.type === 'tech' ? `/content/${content.id}` : `/adult-content/${content.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
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
