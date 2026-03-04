'use client'

import { useState } from 'react'
import { Heart, Loader2 } from '@/components/Icon'

interface FavoriteButtonProps {
  id: string
  initialFavorited: boolean
  type: 'content' | 'adult-content'
}

export default function FavoriteButton({ id, initialFavorited, type }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  
  const toggleFavorite = async () => {
    setLoading(true)
    
    try {
      const method = favorited ? 'DELETE' : 'POST'
      const response = await fetch(`/api/${type}/${id}/favorite`, {
        method
      })
      
      if (response.ok) {
        setFavorited(!favorited)
      } else {
        alert('操作失败')
      }
    } catch (error) {
      console.error('Favorite error:', error)
      alert('操作失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors touch-manipulation ${
        favorited
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
      ) : (
        <Heart className={`w-3 h-3 md:w-4 md:h-4 ${favorited ? 'fill-current' : ''}`} />
      )}
      {favorited ? '已收藏' : '收藏'}
    </button>
  )
}
