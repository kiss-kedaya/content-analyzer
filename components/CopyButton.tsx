'use client'

import { useState } from 'react'
import { Copy, Check } from '@/components/Icon'

type Props = {
  text: string
  label?: string
  copiedLabel?: string
  className?: string
}

export default function CopyButton({
  text,
  label = '复制',
  copiedLabel = '已复制',
  className = '',
}: Props) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(true)
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-default bg-surface px-3 text-sm font-medium text-content transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {error ? '复制失败' : copied ? copiedLabel : label}
    </button>
  )
}
