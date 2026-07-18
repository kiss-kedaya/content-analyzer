import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ClientLayout } from '@/components/ClientLayout'
import { ThemeProvider } from '@/components/ThemeProvider'
import AppShell from '@/components/AppShell'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export const metadata: Metadata = {
  title: {
    default: '内容分析系统 - Content Analyzer',
    template: '%s | Content Analyzer',
  },
  description: 'OpenClaw Agent 驱动的内容分析和管理系统，支持技术内容和成人内容的智能分析、评分和管理',
  keywords: ['内容分析', 'OpenClaw', 'AI Agent', '内容管理', '智能评分', 'Twitter 分析'],
  authors: [{ name: 'Content Analyzer Team' }],
  creator: 'OpenClaw Agent',
  publisher: 'Content Analyzer',
  robots: {
    index: false, // 不索引（因为是私有系统）
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://ca.kedaya.xyz',
    title: '内容分析系统 - Content Analyzer',
    description: 'OpenClaw Agent 驱动的内容分析和管理系统',
    siteName: 'Content Analyzer',
  },
  twitter: {
    card: 'summary_large_image',
    title: '内容分析系统 - Content Analyzer',
    description: 'OpenClaw Agent 驱动的内容分析和管理系统',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try { const mode = localStorage.getItem('content-analyzer-theme') || 'system'; const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; } catch (_) {}",
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ClientLayout>
            <AppShell>{children}</AppShell>
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
