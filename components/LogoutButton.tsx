'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from '@/components/Icon'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
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
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>登出</span>
    </button>
  )
}
