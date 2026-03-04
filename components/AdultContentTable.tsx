'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Trash2, Loader2, Play } from '@/components/Icon'
import VideoPreview from './VideoPreview'
import FavoriteButton from './FavoriteButton'

interface AdultContent {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
  analyzedBy?: string | null
  favorited: boolean
}

interface AdultContentTableProps {
  contents: AdultContent[]
  onDelete?: (id: string) => void
}

export default function AdultContentTable({ contents, onDelete }: AdultContentTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getSourceBadge = (source: string) => {
    const badges: Record<string, string> = {
      twitter: 'bg-blue-50 text-blue-700 border-blue-200',
      xiaohongshu: 'bg-pink-50 text-pink-700 border-pink-200',
      linuxdo: 'bg-green-50 text-green-700 border-green-200'
    }
    return badges[source] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条内容吗？')) return
    
    // 防止重复点击
    if (deleting) return
    
    setDeleting(id)
    try {
      const response = await fetch(`/api/adult-content/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // 调用父组件的删除回调，更新状态
        onDelete?.(id)
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('删除失败')
    } finally {
      setDeleting(null)
    }
  }

  const downloadMedia = (url: string) => {
    window.open(url, '_blank')
  }

  if (contents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">暂无内容</p>
          <p className="text-sm mt-2">使用 API 上传内容后即可查看</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 桌面端：表格布局 */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                来源
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                标题/链接
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                内容摘要
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                评分
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                收藏
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contents.map((content) => (
              <tr key={content.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSourceBadge(content.source)}`}>
                    {content.source}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {content.title && (
                      <div className="text-sm font-medium text-gray-900">
                        {content.title}
                      </div>
                    )}
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      查看原文
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-md">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {content.summary}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-lg font-semibold ${getScoreColor(content.score)}`}>
                    {content.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">/ 10</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <FavoriteButton
                    id={content.id}
                    initialFavorited={content.favorited}
                    type="adult-content"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                  <button
                    onClick={() => setPreviewUrl(content.url)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    预览
                  </button>
                  <Link
                    href={`/adult-content/${content.id}`}
                    className="inline-flex items-center gap-1 text-gray-600 hover:text-black transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    详情
                  </Link>
                  <button
                    onClick={() => handleDelete(content.id)}
                    disabled={deleting === content.id}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting === content.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        删除中...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        删除
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端：卡片布局 */}
      <div className="md:hidden space-y-4">
        {contents.map((content) => (
          <div
            key={content.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            {/* 评分和收藏 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(content.score)}`}>
                  {content.score.toFixed(1)}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSourceBadge(content.source)}`}>
                  {content.source}
                </span>
              </div>
              <FavoriteButton
                id={content.id}
                initialFavorited={content.favorited}
                type="adult-content"
              />
            </div>

            {/* 标题 */}
            {content.title && (
              <h3 className="font-medium text-base text-gray-900 mb-2">
                {content.title}
              </h3>
            )}

            {/* 摘要 */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-4">
              {content.summary}
            </p>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPreviewUrl(content.url)}
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                预览
              </button>
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-black text-white rounded-md hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                原文
              </a>
              <Link
                href={`/adult-content/${content.id}`}
                className="flex items-center justify-center gap-1 px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                详情
              </Link>
              <button
                onClick={() => handleDelete(content.id)}
                disabled={deleting === content.id}
                className="flex items-center justify-center gap-1 px-4 py-2.5 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting === content.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    删除
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    
      {/* 视频预览模态框 */}
      {previewUrl && (
        <VideoPreview
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </>
  )
}
