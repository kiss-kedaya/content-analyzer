import { getContentById } from '@/lib/api'
import { notFound } from 'next/navigation'
import { ExternalLink, FileText, Clock, User, Hash, Calendar, Image as ImageIcon } from '@/components/Icon'
import BackToListButton from '@/components/BackToListButton'
import CopyMarkdownButton from '@/components/CopyMarkdownButton'
import SourceContentViewer from '@/components/SourceContentViewer'
import DetailMediaGallery from '@/components/DetailMediaGallery'
import { getAuthorLink } from '@/lib/author-link'

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
      twitter: 'bg-blue-50 text-blue-700 border-blue-200',
      x: 'bg-blue-50 text-blue-700 border-blue-200',
      xiaohongshu: 'bg-pink-50 text-pink-700 border-pink-200',
      linuxdo: 'bg-green-50 text-green-700 border-green-200'
    }
    return badges[source.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-blue-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const author = getAuthorLink(content.source, content.analyzedBy)

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
      {/* 返回按钮 */}
      <BackToListButton fallbackHref="/" />

      {/* 内容卡片 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-gray-50 px-4 md:px-10 py-5 md:py-8 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-8">
            <div className="flex-1">
              {content.title && (
                <h1 className="text-2xl md:text-4xl font-bold text-black mb-3 md:mb-4 leading-tight">
                  {content.title}
                </h1>
              )}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSourceBadge(content.source)}`}>
                  {content.source}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {new Date(content.analyzedAt).toLocaleString('zh-CN')}
                </span>
                {author ? (
                  <a
                    href={author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-black transition-colors"
                  >
                    <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {author.label}
                  </a>
                ) : (
                  content.analyzedBy && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      {content.analyzedBy}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="text-center bg-white border border-gray-200 rounded-lg p-4 md:p-6 min-w-[110px] md:min-w-[140px] self-start">
              <div className={`text-4xl md:text-6xl font-bold ${getScoreColor(content.score)}`}>
                {content.score.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-2">评分 / 10</div>
            </div>
          </div>
        </div>

        {/* 内容区域 - 单栏布局 */}
        <div className="px-4 md:px-10 py-6 md:py-8 border-b border-gray-200">
          <div className="space-y-6 md:space-y-8">
            <DetailMediaGallery
              kind="content"
              id={content.id}
              source={content.source}
              url={content.url}
              mediaUrls={(content as any).mediaUrls || []}
            />

            {/* 摘要 */}
            <section className="space-y-3 bg-blue-50 p-5 md:p-6 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <h2 className="text-sm md:text-base font-semibold text-gray-900">内容摘要</h2>
              </div>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                {content.summary}
              </p>
            </section>

            {/* 原文内容查看器 */}
            <section className="space-y-3">
              <SourceContentViewer url={content.url} />
            </section>
          </div>
        </div>

        {/* 原文与 Markdown */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            {/* 按钮组 - 居中显示，大小一致 */}
            <div className="flex flex-row items-center justify-center gap-3">
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black hover:bg-white transition-colors w-32"
              >
                <ExternalLink className="w-4 h-4" />
                打开链接
              </a>
              <CopyMarkdownButton url={content.url} />
            </div>
          </div>
        </div>
      </div>

      {/* 元数据 */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center gap-2 mb-6">
          <Hash className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-black">元数据</h2>
        </div>
        <dl className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              内容 ID
            </dt>
            <dd className="font-mono text-sm text-gray-900 break-all">{content.id}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              来源
            </dt>
            <dd className="text-sm text-gray-900">{content.source}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              创建时间
            </dt>
            <dd className="text-sm text-gray-900">
              {new Date(content.createdAt).toLocaleString('zh-CN')}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              更新时间
            </dt>
            <dd className="text-sm text-gray-900">
              {new Date(content.updatedAt).toLocaleString('zh-CN')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
