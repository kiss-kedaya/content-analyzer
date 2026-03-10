'use client'

import { Trash2, Heart, X, Check } from './Icon'

interface BatchActionsBarProps {
  selectedCount: number
  onDelete: () => void
  onFavorite?: () => void
  onClear: () => void
}

export function BatchActionsBar({
  selectedCount,
  onDelete,
  onFavorite,
  onClear
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
      <div className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-full shadow-2xl">
        {/* 选中数量 */}
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">
            已选择 {selectedCount} 项
          </span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-white/20" />

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {onFavorite && (
            <button
              onClick={onFavorite}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="批量收藏"
            >
              <Heart className="w-4 h-4" />
              <span>收藏</span>
            </button>
          )}

          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            aria-label="批量删除"
          >
            <Trash2 className="w-4 h-4" />
            <span>删除</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded-full transition-colors"
            aria-label="取消选择"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
