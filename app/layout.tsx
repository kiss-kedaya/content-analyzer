import type { Metadata } from 'next'
import './globals.css'

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
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              📊 内容分析系统
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              OpenClaw Agent 驱动的内容分析和管理系统
            </p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
            <p>Powered by Next.js + Vercel + Neon + OpenClaw</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
