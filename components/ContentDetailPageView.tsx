import type { ReactNode } from 'react'
import { ExternalLink, FileText, Clock, User, Hash, Calendar } from '@/components/Icon'
import BackToListButton from '@/components/BackToListButton'
import CopyMarkdownButton from '@/components/CopyMarkdownButton'
import SourceContentViewer from '@/components/SourceContentViewer'
import DetailMediaGallery from '@/components/DetailMediaGallery'
import { getAuthorLink } from '@/lib/author-link'
import { getSourceTone } from '@/lib/content-presentation'
import { formatAppDateTime } from '@/lib/date-format'

type DetailContent = {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  analyzedBy?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  mediaUrls?: string[]
}

interface ContentDetailPageViewProps {
  content: DetailContent
  kind: 'content' | 'adultContent'
  fallbackHref: string
  favoriteSlot?: ReactNode
}

export default function ContentDetailPageView({
  content,
  kind,
  fallbackHref,
  favoriteSlot,
}: ContentDetailPageViewProps) {
  const author = getAuthorLink(content.source, content.analyzedBy)

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <BackToListButton fallbackHref={fallbackHref} />

      <article className="surface-card overflow-hidden rounded-2xl">
        <div className="bg-surface-subtle border-b border-default px-4 py-6 md:px-10 md:py-8">
          <div>
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3 md:mb-4">
                <h1 className="flex-1 text-2xl font-bold leading-tight text-content md:text-4xl">
                  {content.title || '无标题'}
                </h1>
                {favoriteSlot}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted md:gap-3 md:text-sm">
                <span className={`badge ${getSourceTone(content.source)}`}>
                  {content.source}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {formatAppDateTime(content.createdAt)}
                </span>
                {author ? (
                  <a
                    href={author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-content transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
          </div>
        </div>

        <div className="border-b border-default px-4 py-6 md:px-10 md:py-8">
          <div className="space-y-6 md:space-y-8">
            <DetailMediaGallery
              kind={kind}
              id={content.id}
              source={content.source}
              url={content.url}
              mediaUrls={content.mediaUrls || []}
            />

            <section className="space-y-3 rounded-xl border border-default bg-surface-subtle p-5 md:p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" />
                <h2 className="text-sm font-semibold text-content md:text-base">已保存内容</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted md:text-base">
                {content.summary}
              </p>
            </section>

            <section className="space-y-3">
              <SourceContentViewer url={content.url} />
            </section>
          </div>
        </div>

        <div className="border-t border-default bg-surface-subtle px-4 py-4 md:px-8 md:py-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 w-32 items-center justify-center gap-2 rounded-lg border border-default bg-surface px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <ExternalLink className="w-4 h-4" />
                打开链接
              </a>
              <CopyMarkdownButton url={content.url} />
            </div>
          </div>
        </div>
      </article>

      <section className="surface-card rounded-2xl p-4 md:p-8">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Hash className="h-4 w-4 text-muted md:h-5 md:w-5" />
          <h2 className="text-lg font-semibold text-content md:text-xl">元数据</h2>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-xs text-subtle md:text-sm">
              <Hash className="w-3 h-3 md:w-4 md:h-4" />
              内容 ID
            </dt>
            <dd className="break-all font-mono text-xs text-content md:text-sm">{content.id}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-xs text-subtle md:text-sm">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              来源
            </dt>
            <dd className="text-xs text-content md:text-sm">{content.source}</dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-xs text-subtle md:text-sm">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              创建时间
            </dt>
            <dd className="text-xs text-content md:text-sm">
              {formatAppDateTime(content.createdAt)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="flex items-center gap-2 text-xs text-subtle md:text-sm">
              <Clock className="w-3 h-3 md:w-4 md:h-4" />
              更新时间
            </dt>
            <dd className="text-xs text-content md:text-sm">
              {formatAppDateTime(content.updatedAt)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
