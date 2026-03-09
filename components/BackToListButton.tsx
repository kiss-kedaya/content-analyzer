'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from '@/components/Icon'

interface BackToListButtonProps {
  fallbackHref: string
  label?: string
}

export default function BackToListButton({ fallbackHref, label = '返回列表' }: BackToListButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
