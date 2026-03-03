import ContentTable from '@/components/ContentTable'
import SortSelector from '@/components/SortSelector'
import { getAllContents } from '@/lib/api'
import Link from 'next/link'
import { FileText, Twitter, BookOpen, Terminal, Radio } from 'lucide-react'

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
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="总内容数" value={stats.total} icon={<FileText className="w-8 h-8 text-gray-400" />} />
        <StatCard title="Twitter" value={stats.twitter} icon={<Twitter className="w-8 h-8 text-blue-400" />} />
        <StatCard title="小红书" value={stats.xiaohongshu} icon={<BookOpen className="w-8 h-8 text-red-400" />} />
        <StatCard title="LinuxDo" value={stats.linuxdo} icon={<Terminal className="w-8 h-8 text-green-400" />} />
      </div>

      {/* 内容表格 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">内容列表</h2>
          
          {/* 排序选择 */}
          <SortSelector value={orderBy} />
        </div>
        
        <ContentTable contents={contents} />
      </div>

      {/* API 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-5 h-5 text-blue-700" />
          <h3 className="text-lg font-semibold text-blue-900">
            API 使用说明
          </h3>
        </div>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>创建内容：</strong> POST /api/content
          </p>
          <pre className="bg-white p-3 rounded border border-blue-200 overflow-x-auto text-xs">
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
          <p className="mt-3">
            <Link href="/api-docs" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              查看完整 API 文档
              <span>→</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  )
}
