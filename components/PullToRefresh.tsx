'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from './Icon'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle')
  
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const PULL_THRESHOLD = 80 // 触发刷新的距离
  const MAX_PULL = 120 // 最大下拉距离

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    const handleTouchStart = (e: TouchEvent) => {
      // 只在页面顶部时启用下拉刷新
      if (window.scrollY === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === 0 || isRefreshing) return

      const touchY = e.touches[0].clientY
      const distance = touchY - touchStartY.current

      // 只处理向下拉
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault()
        
        // 应用阻尼效果
        const dampedDistance = Math.min(distance * 0.5, MAX_PULL)
        setPullDistance(dampedDistance)

        if (dampedDistance >= PULL_THRESHOLD) {
          setStatus('ready')
        } else {
          setStatus('pulling')
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setStatus('refreshing')
        setIsRefreshing(true)
        
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setStatus('idle')
          setPullDistance(0)
          touchStartY.current = 0
        }
      } else {
        setStatus('idle')
        setPullDistance(0)
        touchStartY.current = 0
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing, onRefresh, disabled])

  const getStatusText = () => {
    switch (status) {
      case 'pulling':
        return '下拉刷新'
      case 'ready':
        return '松开刷新'
      case 'refreshing':
        return '刷新中...'
      default:
        return ''
    }
  }

  const rotation = status === 'ready' ? 180 : 0
  const opacity = pullDistance > 0 ? Math.min(pullDistance / PULL_THRESHOLD, 1) : 0

  return (
    <div ref={containerRef} className="relative">
      {/* 下拉指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center transition-opacity"
        style={{
          height: pullDistance,
          opacity,
          pointerEvents: 'none'
        }}
      >
        <div className="flex flex-col items-center gap-2">
          {status === 'refreshing' ? (
            <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
          ) : (
            <svg
              className="w-6 h-6 text-gray-600 transition-transform duration-200"
              style={{ transform: `rotate(${rotation}deg)` }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
          <span className="text-xs text-gray-600 font-medium">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* 内容 */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  )
}
