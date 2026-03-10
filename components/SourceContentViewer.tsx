'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
          <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 prose-img:rounded-lg prose-img:shadow-md">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => {
                  // 过滤掉 emoji 图片（通常 alt 是单个 emoji 字符）
                  const isEmoji = props.alt && props.alt.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(props.alt)
                  if (isEmoji) {
                    return <span>{props.alt}</span>
                  }
                  
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      {...props}
                      alt={props.alt || ''}
                      className="max-w-full h-auto rounded-lg shadow-md my-4"
                      loading="lazy"
                    />
                  )
                },
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  />
                ),
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className?.includes('language-')
                  if (isInline) {
                    return (
                      <code
                        {...props}
                        className="text-pink-600 bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono"
                      >
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code
                      {...props}
                      className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono"
                    >
                      {children}
                    </code>
                  )
                },
                h1: ({ node, ...props }) => (
                  <h1 {...props} className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-gray-200" />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} className="text-2xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200" />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} className="text-xl font-bold text-gray-900 mt-5 mb-2" />
                ),
                h4: ({ node, ...props }) => (
                  <h4 {...props} className="text-lg font-semibold text-gray-900 mt-4 mb-2" />
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="text-gray-700 leading-relaxed my-4" />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} className="border-l-4 border-blue-500 bg-blue-50 py-2 px-4 my-4 italic text-gray-700" />
                ),
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc list-inside my-4 space-y-2 text-gray-700" />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal list-inside my-4 space-y-2 text-gray-700" />
                ),
                li: ({ node, ...props }) => (
                  <li {...props} className="text-gray-700 leading-relaxed" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
