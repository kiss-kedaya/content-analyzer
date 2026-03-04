import { getAdultContentById } from '@/lib/adult-api'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, FileText, Clock, User, Hash, Calendar } from '@/components/Icon'
import FavoriteButton from '@/components/FavoriteButton'

export default async function AdultContentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const content = await getAdultContentById(id)
  
  if (!content) {
    notFound()
  }

  const getSourceBadge = (source: string) => {
    const badges: Record<string, string> = {
      twitter: 'bg-blue-50 text-blue-700 border-blue-200',
      xiaohongshu: 'bg-pink-50 text-pink-700 border-pink-200',
      linuxdo: 'bg-green-50 text-green-700 border-green-200'
    }
    return badges[source] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* 返回按钮 */}
      <Link
        href="/?tab=adult"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回列表
      </Link>

      {/* 内容卡片 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-gray-50 px-4 md:px-8 py-4 md:py-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3 md:mb-4">
                {content.title && (
                  <h1 className="flex-1 text-2xl md:text-3xl font-bold text-black">
                    {content.title}
                  </h1>
                )}
                <FavoriteButton
                  id={content.id}
                  initialFavorited={content.favorited}
                  type="adult-content"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSourceBadge(content.source)}`}>
                  {content.source}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {new Date(content.analyzedAt).toLocaleString('zh-CN')}
                </span>
                {content.analyzedBy && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3 md:w-4 md:h-4" />
                    {content.analyzedBy}
                  </span>
                )}
              </div>
            </div>
            <div className="text-center bg-white border border-gray-200 rounded-lg p-4 md:p-6 min-w-[100px] md:min-w-[120px]">
              <div className={`text-3xl md:text-5xl font-bold ${getScoreColor(content.score)}`}>
                {content.score.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-2">评分 / 10</div>
            </div>
          </div>
        </div>

        {/* 摘要 */}
        <div className="px-4 md:px-8 py-4 md:py-6 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <FileText className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
            <h2 className="text-sm md:text-base font-semibold text-gray-900">内容摘要</h2>
          </div>
          <p className="text-sm md:text-base text-gray-700 leading-relaxed">
            {content.summary}
          </p>
        </div>

        {/* 完整内容 */}
        <div className="px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <FileText className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
            <h2 className="text-sm md:text-base font-semibold text-gray-900">完整内容</h2>
          </div>
          <div className="prose prose-sm max-w-none text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content.content}
          </div>
        </div>

        {/* 原文链接 */}
        <div className="px-4 md:px-8 py-4 md:py-6 bg-gray-50 border-t border-gray-200">
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors vercel-button"
          >
            <ExternalLink className="w-4 h-4" />
            查看原文
          </a>
        </div>
      </div>

      {/* 元数据 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-8">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Hash className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
          <h2 className="text-lg md:text-xl font-semibold text-black">元数据</h2>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-1">
            <dt className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
              <Hash className="w-3 h-3 md:w-4 md:h-4" />
              内容 ID
            </dt>
            <dd className="font-mono text-xs md:text-sm text-gray-900 break-all">{content.id}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              来源
            </dt>
            <dd className="text-xs md:text-sm text-gray-900">{content.source}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              创建时间
            </dt>
            <dd className="text-xs md:text-sm text-gray-900">
              {new Date(content.createdAt).toLocaleString('zh-CN')}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              更新时间
            </dt>
            <dd className="text-xs md:text-sm text-gray-900">
              {new Date(content.updatedAt).toLocaleString('zh-CN')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
