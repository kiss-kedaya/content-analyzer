import ContentList from '@/components/ContentList'
import { getContentsPage } from '@/lib/api'
import { getAdultContentsPage } from '@/lib/adult-api'
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

  const pageResult = tab === 'tech' ? await getContentsPage(options) : await getAdultContentsPage(options)

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
      />
    </div>
  )
}
