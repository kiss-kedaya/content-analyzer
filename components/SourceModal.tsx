'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, Copy } from '@/components/Icon'

type Props = {
  url: string
  open: boolean
  onClose: () => void
}

type SourceData = {
  url: string
  provider: string
  status: string
  title?: string | null
  text: string | null
  errorText: string | null
  wordCount?: number | null
  sha256?: string | null
  lastFetchedAt?: string | null
}

export default function SourceModal({ url, open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SourceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const encoded = useMemo(() => encodeURIComponent(url), [url])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)

    fetch(`/api/source?url=${encoded}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message || 'Failed to fetch source')
        }
        return json.data as SourceData
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, encoded])

  // ESC 键关闭
  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  const copy = async () => {
    if (!data?.text) return
    try {
      await navigator.clipboard.writeText(data.text)
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="原文"
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-black">原文</div>
            <div className="text-xs text-gray-500 truncate">{url}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              disabled={!data?.text}
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-56px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <div className="font-medium">加载失败</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                <span className="mr-3">抓取源: {data.provider}</span>
                {data.lastFetchedAt && <span>抓取时间: {new Date(data.lastFetchedAt).toLocaleString('zh-CN')}</span>}
              </div>

              {data.title && (
                <div className="text-sm font-medium text-black">{data.title}</div>
              )}

              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-4">
{data.text ?? data.errorText ?? ''}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
