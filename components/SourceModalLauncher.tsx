'use client'

import { useState } from 'react'
import { ExternalLink } from '@/components/Icon'
import SourceModal from '@/components/SourceModal'

type Props = {
  url: string
  label?: string
}

export default function SourceModalLauncher({ url, label = '查看原文' }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black hover:bg-gray-50 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        {label}
      </button>
      <SourceModal url={url} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
