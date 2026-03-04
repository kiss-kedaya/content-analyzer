'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from '@/components/Icon'

export default function LogoutButton() {
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 text-xs md:text-sm text-gray-600 hover:text-black transition-colors"
    >
      <LogOut className="w-3 h-3 md:w-4 md:h-4" />
      <span className="hidden md:inline">登出</span>
    </button>
  )
}
