import ContentTable from '@/components/ContentTable'
import SortSelector from '@/components/SortSelector'
import { getAllContents } from '@/lib/api'
import Link from 'next/link'
import { FileText, Twitter, BookOpen, Terminal, Radio, TrendingUp } from 'lucide-react'

export const revalidate = 0 // 禁用缓存，实时更新

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ orderBy?: string }>
}) {
  const params = await searchParams
  const orderBy = (params.orderBy as 'score' | 'createdAt' | 'analyzedAt') || 'score'
  const contents = await getAllContents(orderBy)

  const stats = {
    total: contents.length,
    twitter: contents.filter(c => c.source === 'twitter').length,
    xiaohongshu: contents.filter(c => c.source === 'xiaohongshu').length,
    linuxdo: contents.filter(c => c.source === 'linuxdo').length
  }

  return (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="总内容数" 
          value={stats.total} 
          icon={<FileText className="w-8 h-8" />}
          gradient="from-blue-500 to-cyan-500"
          iconBg="bg-blue-500/10"
        />
        <StatCard 
          title="Twitter" 
          value={stats.twitter} 
          icon={<Twitter className="w-8 h-8" />}
          gradient="from-sky-500 to-blue-600"
          iconBg="bg-sky-500/10"
        />
        <StatCard 
          title="小红书" 
          value={stats.xiaohongshu} 
          icon={<BookOpen className="w-8 h-8" />}
          gradient="from-pink-500 to-rose-600"
          iconBg="bg-pink-500/10"
        />
        <StatCard 
          title="LinuxDo" 
          value={stats.linuxdo} 
          icon={<Terminal className="w-8 h-8" />}
          gradient="from-green-500 to-emerald-600"
          iconBg="bg-green-500/10"
        />
      </div>

      {/* 内容表格 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">内容列表</h2>
          </div>
          
          {/* 排序选择 */}
          <SortSelector value={orderBy} />
        </div>
        
        <ContentTable contents={contents} />
      </div>

      {/* API 使用说明 */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl shadow-lg p-8 hover-lift">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-blue-900">
            API 使用说明
          </h3>
        </div>
        <div className="space-y-3 text-sm text-blue-800">
          <p className="text-base">
            <strong>创建内容：</strong> POST /api/content
          </p>
          <pre className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/50 overflow-x-auto text-xs shadow-inner">
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
  icon, 
  gradient,
  iconBg
}: { 
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  iconBg: string
}) {
  return (
    <div className="group bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6 hover-lift cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <div className={`${iconBg} p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
          <div className={`bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}
