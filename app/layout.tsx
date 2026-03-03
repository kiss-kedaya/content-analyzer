import type { Metadata } from 'next'
import './globals.css'
import { BarChart3 } from '@/components/Icon'
import Link from 'next/link'

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
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <BarChart3 className="w-5 h-5 text-black" />
                <span className="text-lg font-semibold text-black">Content Analyzer</span>
              </Link>
              <nav className="flex items-center gap-6">
                <Link href="/" className="text-sm text-gray-600 hover:text-black transition-colors">
                  首页
                </Link>
                <Link href="/api-docs" className="text-sm text-gray-600 hover:text-black transition-colors">
                  API 文档
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Powered by Next.js + Vercel + Neon + OpenClaw</p>
              <p>© 2026 Content Analyzer</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
