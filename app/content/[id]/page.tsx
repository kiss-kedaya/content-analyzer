import { getContentById } from '@/lib/api'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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
      twitter: 'bg-blue-100 text-blue-800',
      xiaohongshu: 'bg-red-100 text-red-800',
      linuxdo: 'bg-green-100 text-green-800'
    }
    return badges[source] || 'bg-gray-100 text-gray-800'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
      >
        ← 返回列表
      </Link>

      {/* 内容卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* 头部 */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {content.title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {content.title}
                </h1>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceBadge(content.source)}`}>
                  {content.source}
                </span>
                <span>
                  分析时间：{new Date(content.analyzedAt).toLocaleString('zh-CN')}
                </span>
                {content.analyzedBy && (
                  <span>
                    分析者：{content.analyzedBy}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(content.score)}`}>
                {content.score.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">评分 / 10</div>
            </div>
          </div>
        </div>

        {/* 摘要 */}
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">📝 内容摘要</h2>
          <p className="text-gray-800 leading-relaxed">
            {content.summary}
          </p>
        </div>

        {/* 完整内容 */}
        <div className="px-6 py-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📄 完整内容</h2>
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
            {content.content}
          </div>
        </div>

        {/* 原文链接 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
          >
            🔗 查看原文 →
          </a>
        </div>
      </div>

      {/* 元数据 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 元数据</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-600">内容 ID</dt>
            <dd className="font-mono text-gray-900 mt-1">{content.id}</dd>
          </div>
          <div>
            <dt className="text-gray-600">来源</dt>
            <dd className="text-gray-900 mt-1">{content.source}</dd>
          </div>
          <div>
            <dt className="text-gray-600">创建时间</dt>
            <dd className="text-gray-900 mt-1">
              {new Date(content.createdAt).toLocaleString('zh-CN')}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600">更新时间</dt>
            <dd className="text-gray-900 mt-1">
              {new Date(content.updatedAt).toLocaleString('zh-CN')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
