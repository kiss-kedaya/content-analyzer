'use client'

import { useState, useRef, useEffect } from 'react'
import { Heart, Loader2 } from '@/components/Icon'

interface FavoriteButtonProps {
  id: string
  initialFavorited: boolean
  type: 'content' | 'adult-content'
}

export default function FavoriteButton({ id, initialFavorited, type }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  const toggleFavorite = async () => {
    // 防止重复点击
    if (loading) return
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    setLoading(true)
    
    try {
      const method = favorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/${type}/${id}/favorite`, {
        method,
        signal: abortControllerRef.current.signal
      })
      
      if (response.ok && isMountedRef.current) {
        setFavorited(!favorited)
      } else if (isMountedRef.current) {
        setError('操作失败，请重试')
        setTimeout(() => {
          if (isMountedRef.current) setError(null)
        }, 3000)
      }
    } catch (error) {
      // 忽略取消的请求
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Favorite error:', error)
      if (isMountedRef.current) {
        setError('操作失败，请重试')
        setTimeout(() => {
          if (isMountedRef.current) setError(null)
        }, 3000)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
      abortControllerRef.current = null
    }
  }
  
  return (
    <div className="relative inline-block">
      <button
        onClick={toggleFavorite}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors touch-manipulation ${
          favorited
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
        ) : (
          <Heart className={`w-3 h-3 md:w-4 md:h-4 ${favorited ? 'fill-current' : ''}`} />
        )}
        {favorited ? '已收藏' : '收藏'}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}
