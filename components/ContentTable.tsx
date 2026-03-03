'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
  analyzedBy?: string | null
}

interface ContentTableProps {
  contents: Content[]
  onDelete?: (id: string) => void
}

export default function ContentTable({ contents, onDelete }: ContentTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const getSourceBadge = (source: string) => {
    const badges: Record<string, string> = {
      twitter: 'bg-blue-100 text-blue-800',
      xiaohongshu: 'bg-red-100 text-red-800',
      linuxdo: 'bg-green-100 text-green-800'
    }
    return badges[source] || 'bg-gray-100 text-gray-800'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 font-bold'
    if (score >= 6) return 'text-blue-600 font-semibold'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条内容吗？')) return
    
    setDeleting(id)
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onDelete?.(id)
        // 刷新页面
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
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
              分析者
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {contents.map((content) => (
            <tr key={content.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceBadge(content.source)}`}>
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
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline block"
                  >
                    查看原文 →
                  </a>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {content.summary}
                </p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-lg ${getScoreColor(content.score)}`}>
                  {content.score.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500 ml-1">/ 10</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {content.analyzedBy || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <Link
                  href={`/content/${content.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  详情
                </Link>
                <button
                  onClick={() => handleDelete(content.id)}
                  disabled={deleting === content.id}
                  className="text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                >
                  {deleting === content.id ? '删除中...' : '删除'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {contents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">暂无内容</p>
          <p className="text-sm mt-2">使用 API 上传内容后即可查看</p>
        </div>
      )}
    </div>
  )
}
