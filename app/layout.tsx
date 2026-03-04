import type { Metadata } from 'next'
import './globals.css'
import { BarChart3 } from '@/components/Icon'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export const metadata: Metadata = {
  title: '内容分析系统 - Content Analyzer',
  description: 'OpenClaw Agent 驱动的内容分析和管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white min-h-screen">
        <header className="border-b border-gray-200 sticky top-0 z-50 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 md:h-16">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-black" />
                <span className="text-base md:text-lg font-semibold text-black">Content Analyzer</span>
              </Link>
              <nav className="flex items-center gap-4 md:gap-6">
                <Link href="/" className="text-xs md:text-sm text-gray-600 hover:text-black transition-colors">
                  首页
                </Link>
                <Link href="/favorites" className="text-xs md:text-sm text-gray-600 hover:text-black transition-colors">
                  收藏夹
                </Link>
                <Link href="/api-docs" className="text-xs md:text-sm text-gray-600 hover:text-black transition-colors">
                  API 文档
                </Link>
                <LogoutButton />
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-12 md:mt-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm text-gray-500">
              <p>Powered by Next.js + Vercel + Neon + OpenClaw</p>
              <p>© 2026 Content Analyzer</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
