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
        className="inline-flex min-h-11 w-32 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
        <div className="absolute top-full left-0 z-10 mt-1 whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
