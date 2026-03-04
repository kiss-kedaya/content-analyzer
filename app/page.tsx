import ContentList from '@/components/ContentList'
import { getAllContents } from '@/lib/api'
import { getAllAdultContents } from '@/lib/adult-api'
import Link from 'next/link'
import { FileText, Twitter, BookOpen, Terminal } from '@/components/Icon'

export const revalidate = 0 // 禁用缓存，实时更新

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ orderBy?: string; tab?: string }>
}) {
  const params = await searchParams
  const orderBy = (params.orderBy as 'score' | 'createdAt' | 'analyzedAt') || 'score'
  const tab = params.tab || 'tech'  // 'tech' or 'adult'
  
  // 一次性获取所有数据
  const [techContents, adultContents] = await Promise.all([
    getAllContents(orderBy),
    getAllAdultContents(orderBy)
  ])

  const allContents = tab === 'tech' ? techContents : adultContents
  
  const stats = {
    total: allContents.length,
    twitter: allContents.filter(c => c.source === 'twitter').length,
    xiaohongshu: allContents.filter(c => c.source === 'xiaohongshu').length,
    linuxdo: allContents.filter(c => c.source === 'linuxdo').length
  }

  return (
    <div className="space-y-8 md:space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-3 md:space-y-4 py-6 md:py-12">
        <h1 className="text-3xl md:text-5xl font-bold text-black tracking-tight px-4">
          内容分析系统
        </h1>
        <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          OpenClaw Agent 驱动的智能内容分析和管理平台
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="总内容数" 
          value={stats.total} 
          icon={<FileText className="w-5 h-5 text-gray-400" />}
        />
        <StatCard 
          title="Twitter" 
          value={stats.twitter} 
          icon={<Twitter className="w-5 h-5 text-gray-400" />}
        />
        <StatCard 
          title="小红书" 
          value={stats.xiaohongshu} 
          icon={<BookOpen className="w-5 h-5 text-gray-400" />}
        />
        <StatCard 
          title="LinuxDo" 
          value={stats.linuxdo} 
          icon={<Terminal className="w-5 h-5 text-gray-400" />}
        />
      </div>

      {/* 内容列表（客户端切换，无刷新） */}
      <ContentList
        techContents={techContents}
        adultContents={adultContents as any}
        initialTab={tab}
        initialOrderBy={orderBy}
      />

      {/* API 使用说明 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-8">
        <h3 className="text-lg md:text-xl font-semibold text-black mb-3 md:mb-4">
          API 使用说明
        </h3>
        <div className="space-y-3 md:space-y-4 text-sm text-gray-600">
          <p>
            <strong className="text-black">技术内容：</strong> POST /api/content
          </p>
          <p>
            <strong className="text-black">成人内容：</strong> POST /api/adult-content
          </p>
          <pre className="bg-white border border-gray-200 p-3 md:p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`{
  "source": "twitter",
  "url": "https://...",
  "title": "标题（可选）",
  "summary": "摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent"
}`}
          </pre>
          <div className="pt-2">
            <Link 
              href="/api-docs" 
              className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors vercel-button"
            >
              查看完整 API 文档
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon
}: { 
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 vercel-card">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <span className="text-xs md:text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="text-2xl md:text-4xl font-bold text-black">
        {value}
      </div>
    </div>
  )
}
