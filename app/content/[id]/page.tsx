import { getContentById } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileText, Clock, User, Hash, Calendar, Sparkles } from 'lucide-react'

export default async function ContentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const content = await getContentById(id)
  
  if (!content) {
    notFound()
  }

  const getSourceBadge = (source: string) => {
    const badges: Record<string, string> = {
      twitter: 'bg-gradient-to-r from-sky-400 to-blue-500',
      xiaohongshu: 'bg-gradient-to-r from-pink-400 to-rose-500',
      linuxdo: 'bg-gradient-to-r from-green-400 to-emerald-500'
    }
    return badges[source] || 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-600'
    if (score >= 6) return 'from-blue-500 to-cyan-600'
    if (score >= 4) return 'from-yellow-500 to-orange-600'
    return 'from-red-500 to-pink-600'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md text-gray-700 font-medium rounded-xl hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200/50"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </Link>

      {/* 内容卡片 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover-lift">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-200/50">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {content.title && (
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {content.title}
                </h1>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${getSourceBadge(content.source)} text-white shadow-sm`}>
                  {content.source}
                </span>
                <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4" />
                  {new Date(content.analyzedAt).toLocaleString('zh-CN')}
                </span>
                {content.analyzedBy && (
                  <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-lg">
                    <User className="w-4 h-4" />
                    {content.analyzedBy}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg min-w-[120px]">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className={`w-6 h-6 bg-gradient-to-r ${getScoreColor(content.score)} bg-clip-text text-transparent`} />
                <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreColor(content.score)} bg-clip-text text-transparent`}>
                  {content.score.toFixed(1)}
                </div>
              </div>
              <div className="text-xs text-gray-500 font-medium">评分 / 10</div>
            </div>
          </div>
        </div>

        {/* 摘要 */}
        <div className="px-8 py-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-200/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">内容摘要</h2>
          </div>
          <p className="text-gray-800 leading-relaxed text-base">
            {content.summary}
          </p>
        </div>

        {/* 完整内容 */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-500 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">完整内容</h2>
          </div>
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
            {content.content}
          </div>
        </div>

        {/* 原文链接 */}
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200/50">
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <ExternalLink className="w-4 h-4" />
            查看原文
          </a>
        </div>
      </div>

      {/* 元数据 */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 hover-lift">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">元数据</h2>
        </div>
        <dl className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
            <dt className="text-sm text-gray-600 flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4" />
              内容 ID
            </dt>
            <dd className="font-mono text-sm text-gray-900 font-semibold break-all">{content.id}</dd>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <dt className="text-sm text-gray-600 flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              来源
            </dt>
            <dd className="text-sm text-gray-900 font-semibold">{content.source}</dd>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <dt className="text-sm text-gray-600 flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              创建时间
            </dt>
            <dd className="text-sm text-gray-900 font-semibold">
              {new Date(content.createdAt).toLocaleString('zh-CN')}
            </dd>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
            <dt className="text-sm text-gray-600 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              更新时间
            </dt>
            <dd className="text-sm text-gray-900 font-semibold">
              {new Date(content.updatedAt).toLocaleString('zh-CN')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
