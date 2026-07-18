'use client'

import { Moon, Sun } from '@/components/Icon'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? '切换为浅色模式' : '切换为深色模式'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      {showLabel && <span>{isDark ? '浅色模式' : '深色模式'}</span>}
    </button>
  )
}
