'use client'

import { useState } from 'react'
import { Copy, Check } from '@/components/Icon'

type Props = {
  mdUrl: string
  label?: string
}

export default function CopyMarkdownButton({ mdUrl, label = '复制 Markdown' }: Props) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const onCopy = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(mdUrl)
      if (!res.ok) {
        throw new Error('Failed to fetch markdown')
      }

      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
