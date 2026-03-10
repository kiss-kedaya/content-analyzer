'use client'

import { useState } from 'react'
import { Copy, Check } from '@/components/Icon'

type Props = {
  url: string
  label?: string
}

export default function CopyMarkdownButton({ url, label = '复制原文' }: Props) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCopy = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/source?url=${encodeURIComponent(url)}`)
      if (!res.ok) {
        throw new Error('Failed to fetch source')
      }

      const data = await res.json()
      if (!data.success || !data.data?.text) {
        throw new Error(data.error?.message || '原文内容为空')
      }

      await navigator.clipboard.writeText(data.data.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('复制失败')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-60"
        disabled={loading}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            已复制
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            {loading ? '复制中...' : label}
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}
