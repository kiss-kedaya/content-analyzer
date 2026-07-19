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
        className="inline-flex items-center gap-2 rounded-lg border border-default px-4 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-raised"
      >
        <ExternalLink className="w-4 h-4" />
        {label}
      </button>
      <SourceModal url={url} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
