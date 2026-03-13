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

  const onCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:text-black hover:border-gray-300 transition-colors ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? copiedLabel : label}
    </button>
  )
}
