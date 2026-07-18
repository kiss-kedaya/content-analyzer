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
    default: '内容收藏 - Content Analyzer',
    template: '%s | Content Analyzer',
  },
  description: '个人内容收藏与媒体归档工具',
  keywords: ['内容收藏', '内容管理', 'X 书签', '媒体归档'],
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
    title: '内容收藏 - Content Analyzer',
    description: '个人内容收藏与媒体归档工具',
    siteName: 'Content Analyzer',
  },
  twitter: {
    card: 'summary_large_image',
    title: '内容收藏 - Content Analyzer',
    description: '个人内容收藏与媒体归档工具',
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
