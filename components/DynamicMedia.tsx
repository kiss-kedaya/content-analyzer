'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from './Icon'

// 动态导入 VideoPreview，仅在需要时加载
export const VideoPreview = dynamic(() => import('./VideoPreview'), {
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-100">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  ),
  ssr: false // 视频预览不需要 SSR
})

