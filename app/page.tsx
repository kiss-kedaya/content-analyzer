import ContentList from '@/components/ContentList'
import { getContentsPage, getStats } from '@/lib/api'
import { getAdultContentStats, getAdultContentsPage } from '@/lib/adult-api'
import Link from 'next/link'
import { getShanghaiDayRange } from '@/lib/date'

export const revalidate = 60

type HomeSearchParams = {
  tab?: string
  date?: string
  q?: string
}

export default async function Home({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const params = await searchParams
  const tab = params.tab === 'adult' ? 'adult' : 'tech'
  const date = (() => {
    if (!params.date) return undefined
    try {
      getShanghaiDayRange(params.date)
      return params.date
    } catch {
      return undefined
    }
  })()
  const q = params.q?.trim().slice(0, 100) || undefined
  const pageSize = 12
  const options = { orderBy: 'createdAt', page: 1, pageSize, date, q }

  const [pageResult, rawStats] = await Promise.all([
    tab === 'tech' ? getContentsPage(options) : getAdultContentsPage(options),
    tab === 'tech' ? getStats({ date, q }) : getAdultContentStats({ date, q }),
  ])

  return (
    <div className="space-y-7 md:space-y-9">
      <section className="space-y-2 py-1 md:py-2">
        <h1 className="text-2xl font-semibold tracking-tight text-content md:text-3xl">内容收藏</h1>
        <p className="text-sm leading-6 text-muted">按时间查看已保存的内容。</p>
      </section>

      <ContentList
        initialContents={pageResult.items}
        initialTab={tab}
        initialDate={date}
        initialQuery={q}
        initialTotal={pageResult.total}
        initialHasMore={pageResult.hasMore}
        initialStats={rawStats}
      />

      <section className="surface-card rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-content">接口</p>
            <p className="mt-1 text-sm leading-6 text-muted">技术内容和成人内容使用独立接口写入。</p>
          </div>
          <Link href="/api-docs" prefetch={false} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">查看 API 文档</Link>
        </div>
      </section>
    </div>
  )
}
