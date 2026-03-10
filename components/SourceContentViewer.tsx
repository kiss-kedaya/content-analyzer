'use client'

import { useState } from 'react'
import { FileText, Loader2, AlertCircle } from './Icon'

interface SourceContentViewerProps {
  url: string
}

export default function SourceContentViewer({ url }: SourceContentViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = async () => {
    if (content) {
      // Already fetched, just toggle
      setIsOpen(!isOpen)
      return
    }

    setLoading(true)
    setError(null)
    setIsOpen(true)

    try {
      const response = await fetch(`/api/source?url=${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error('获取原文失败')
      }

      const data = await response.json()
      
      if (!data.success || !data.data?.text) {
        throw new Error(data.error?.message || '原文内容为空')
      }

      setContent(data.data.text)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取原文失败')
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setContent(null)
    setError(null)
    fetchContent()
  }

  return (
    <div className="space-y-4">
      {/* 按钮 */}
      <button
        onClick={fetchContent}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            加载中...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            {isOpen ? '收起原文' : '查看原文内容'}
          </>
        )}
      </button>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 内容展示 */}
      {isOpen && content && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">原文内容</h3>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
