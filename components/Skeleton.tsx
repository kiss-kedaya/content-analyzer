'use client'

import { Image as ImageIcon } from '@/components/Icon'

export function SkeletonImage({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-surface-raised motion-safe:animate-pulse ${className}`} role="status" aria-label="正在加载图片">
      <ImageIcon className="h-10 w-10 text-subtle" aria-hidden="true" />
    </div>
  )
}
