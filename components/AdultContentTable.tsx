'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Trash2, Loader2, Download, Image as ImageIcon } from '@/components/Icon'

interface AdultContent {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  mediaUrls: string[]
  analyzedAt: Date
  analyzedBy?: string | null
}

interface AdultContentTableProps {
  contents: AdultContent[]
  onDelete?: (id: string) => void
}

export default function AdultContentTable({ contents, onDelete }: AdultContentTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

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
    
    setDeleting(id)
    try {
      const response = await fetch(`/api/adult-content/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onDelete?.(id)
        window.location.reload()
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
              媒体
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              内容摘要
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              评分
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
              <td className="px-6 py-4">
                {content.mediaUrls && content.mediaUrls.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {content.mediaUrls.length} 个媒体
                    </span>
                    <button
                      onClick={() => content.mediaUrls.forEach(url => downloadMedia(url))}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">无媒体</span>
                )}
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
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
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
      
      {contents.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">暂无内容</p>
          <p className="text-sm mt-2">使用 API 上传内容后即可查看</p>
        </div>
      )}
    </div>
  )
}
