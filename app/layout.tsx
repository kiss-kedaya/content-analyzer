import type { Metadata } from 'next'
import './globals.css'
import { BarChart3 } from 'lucide-react'

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
      <body className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  内容分析系统
                </h1>
                <p className="text-sm text-gray-600">
                  OpenClaw Agent 驱动的内容分析和管理系统
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white/60 backdrop-blur-md border-t border-gray-200/50 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
            <p>Powered by Next.js + Vercel + Neon + OpenClaw</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
