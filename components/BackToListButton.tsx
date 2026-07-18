'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from '@/components/Icon'
import { useEffect, useState } from 'react'

interface BackToListButtonProps {
  fallbackHref: string
  label?: string
}

export default function BackToListButton({ fallbackHref, label = '返回列表' }: BackToListButtonProps) {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    // 检查是否有历史记录可以返回
    setCanGoBack(window.history.length > 1)
  }, [])

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    router.back()
  }

  // 如果有历史记录，使用 button + router.back()
  // 否则使用 Link 组件
  if (canGoBack) {
    return (
      <button
        onClick={handleBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <ArrowLeft className="w-4 h-4" />
        {label}
      </button>
    )
  }

  return (
    <Link
      href={fallbackHref}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  )
}
