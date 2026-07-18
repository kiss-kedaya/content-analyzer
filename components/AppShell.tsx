'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BarChart3, Menu, X } from '@/components/Icon'
import LogoutButton from './LogoutButton'
import ThemeToggle from './ThemeToggle'

const navigation = [
  { href: '/', label: '首页', exact: true },
  { href: '/favorites', label: '收藏夹' },
  { href: '/api-docs', label: 'API 文档' },
  { href: '/agent-skills', label: 'Agent Skills' },
]

function isCurrentPath(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)

  const isAuthPage = pathname === '/login'

  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return

    const previousOverflow = document.body.style.overflow
    const menuButton = menuButtonRef.current
    document.body.style.overflow = 'hidden'
    drawerRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        return
      }

      if (event.key !== 'Tab') return
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      menuButton?.focus()
    }
  }, [isMenuOpen])

  if (isAuthPage) {
    return <div className="auth-page-shell">{children}</div>
  }

  return (
    <div className="min-h-dvh bg-app text-content">
      <a href="#main-content" className="skip-link">跳到主要内容</a>
      <header className="sticky top-0 z-40 border-b border-default bg-app/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 font-semibold tracking-tight text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <BarChart3 className="h-5 w-5 text-content" aria-hidden="true" />
            <span>Content Analyzer</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <nav aria-label="主导航" className="flex items-center gap-1">
              {navigation.map((item) => {
                const current = isCurrentPath(pathname, item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${current ? 'bg-surface-raised text-content' : 'text-muted hover:bg-surface-raised hover:text-content'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <ThemeToggle />
            <LogoutButton className="ml-1" />
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="打开导航菜单"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="关闭导航菜单"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="主导航"
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-dvh w-[min(20rem,88vw)] flex-col border-l border-default bg-surface p-5 shadow-2xl focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-content">导航</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="关闭导航菜单"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-6 grid gap-1" aria-label="移动端主导航">
              {navigation.map((item) => {
                const current = isCurrentPath(pathname, item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={`flex min-h-12 items-center rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${current ? 'bg-surface-raised text-content' : 'text-muted hover:bg-surface-raised hover:text-content'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-auto border-t border-default pt-4">
              <ThemeToggle showLabel className="w-full justify-start" />
              <LogoutButton className="mt-2 w-full justify-start px-3" />
            </div>
          </aside>
        </div>
      )}

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
        {children}
      </main>
      <footer className="border-t border-default">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Content Analyzer</p>
          <p>© 2026</p>
        </div>
      </footer>
    </div>
  )
}
