'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, Trash2, Loader2, Sparkles } from '@/components/Icon'

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
    const badges: Record<string, { bg: string; text: string; gradient: string }> = {
      twitter: { 
        bg: 'bg-gradient-to-r from-sky-400 to-blue-500', 
        text: 'text-white',
        gradient: 'from-sky-400 to-blue-500'
      },
      xiaohongshu: { 
        bg: 'bg-gradient-to-r from-pink-400 to-rose-500', 
        text: 'text-white',
        gradient: 'from-pink-400 to-rose-500'
      },
      linuxdo: { 
        bg: 'bg-gradient-to-r from-green-400 to-emerald-500', 
        text: 'text-white',
        gradient: 'from-green-400 to-emerald-500'
      }
    }
    return badges[source] || { 
      bg: 'bg-gradient-to-r from-gray-400 to-gray-500', 
      text: 'text-white',
      gradient: 'from-gray-400 to-gray-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-600'
    if (score >= 6) return 'from-blue-500 to-cyan-600'
    if (score >= 4) return 'from-yellow-500 to-orange-600'
    return 'from-red-500 to-pink-600'
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
    <div className="overflow-x-auto rounded-xl">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              来源
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              标题/链接
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              内容摘要
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              评分
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              分析者
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contents.map((content) => {
            const badge = getSourceBadge(content.source)
            return (
              <tr 
                key={content.id} 
                className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300"
              >
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${badge.bg} ${badge.text} shadow-sm`}>
                    {content.source}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-2">
                    {content.title && (
                      <div className="text-sm font-semibold text-gray-900">
                        {content.title}
                      </div>
                    )}
                    <a
                      href={content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      查看原文
                    </a>
                  </div>
                </td>
                <td className="px-6 py-5 max-w-md">
                  <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                    {content.summary}
                  </p>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 bg-gradient-to-r ${getScoreColor(content.score)} bg-clip-text text-transparent`} />
                    <span className={`text-xl font-bold bg-gradient-to-r ${getScoreColor(content.score)} bg-clip-text text-transparent`}>
                      {content.score.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-400">/ 10</span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                  {content.analyzedBy || '-'}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm space-x-3">
                  <Link
                    href={`/content/${content.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Eye className="w-4 h-4" />
                    详情
                  </Link>
                  <button
                    onClick={() => handleDelete(content.id)}
                    disabled={deleting === content.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            )
          })}
        </tbody>
      </table>
      
      {contents.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-600 mb-2">暂无内容</p>
          <p className="text-sm text-gray-500">使用 API 上传内容后即可查看</p>
        </div>
      )}
    </div>
  )
}

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
