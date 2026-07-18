'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, RefreshCw, SearchX } from './Icon'
import { MobileContentList } from './MobileContentList'
import { PullToRefresh } from './PullToRefresh'
import { SearchBar } from './SearchBar'
import TabSelector from './TabSelector'
import { useToastContext } from './ClientLayout'

type Tab = 'tech' | 'adult'
type ContentItem = {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  analyzedAt: Date | string
  analyzedBy?: string | null
  favorited: boolean
  mediaUrls?: string[]
}

type Filters = { tab: Tab; date?: string; q?: string }
type RetryRequest = { page: number; append: boolean }

type ListResponse = {
  success: boolean
  data?: ContentItem[]
  error?: { message?: string }
  pagination?: { page: number; total: number; hasMore: boolean }
}

interface ContentListProps {
  initialContents: ContentItem[]
  initialTab: Tab
  initialPage: number
  initialDate?: string
  initialQuery?: string
  initialTotal: number
  initialHasMore: boolean
}

export default function ContentList({
  initialContents,
  initialTab,
  initialPage,
  initialDate,
  initialQuery,
  initialTotal,
  initialHasMore,
}: ContentListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToastContext()
  const requestRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const [filters, setFilters] = useState<Filters>({ tab: initialTab, date: initialDate, q: initialQuery })
  const [items, setItems] = useState<ContentItem[]>(initialContents)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null)

  useEffect(() => () => requestRef.current?.abort(), [])

  const syncUrl = useCallback((next: Filters, nextPage = 1) => {
    const params = new URLSearchParams()
    params.set('tab', next.tab)
    if (next.date) params.set('date', next.date)
    if (next.q) params.set('q', next.q)
    if (nextPage > 1) params.set('page', String(nextPage))
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router])

  const fetchPage = useCallback(async (next: Filters, nextPage: number, append = false): Promise<boolean> => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    const requestId = ++requestIdRef.current

    if (append) setIsLoadingMore(true)
    else setIsLoading(true)
    setLoadError(null)
    setRetryRequest(null)

    const params = new URLSearchParams({ page: String(nextPage), pageSize: '12', orderBy: 'createdAt' })
    if (next.q) params.set('q', next.q)
    if (next.date) params.set('date', next.date)
    const endpoint = next.tab === 'tech' ? '/api/content/paginated' : '/api/adult-content/paginated'

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, { signal: controller.signal })
      const data = await response.json() as ListResponse
      if (!response.ok || !data.success || !data.data || !data.pagination) {
        throw new Error(data.error?.message || '数据加载失败，请重试')
      }
      if (requestId !== requestIdRef.current) return false

      setItems((current) => append ? [...current, ...data.data!] : data.data!)
      setPage(data.pagination.page)
      setTotal(data.pagination.total)
      setHasMore(data.pagination.hasMore)
      setRetryRequest(null)
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false
      if (requestId === requestIdRef.current) {
        setLoadError(error instanceof Error ? error.message : '数据加载失败，请重试')
        setRetryRequest({ page: nextPage, append })
      }
      return false
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  const commitFilters = useCallback((patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    setFilters(next)
    syncUrl(next)
    void fetchPage(next, 1)
  }, [fetchPage, filters, syncUrl])

  const handleDelete = async (id: string) => {
    const endpoint = filters.tab === 'tech' ? `/api/content/${id}` : `/api/adult-content/${id}`
    try {
      const response = await fetch(endpoint, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error?.message || '删除失败，请重试')
      setItems((current) => current.filter((item) => item.id !== id))
      setTotal((current) => Math.max(0, current - 1))
      toast.success('内容已删除')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败，请重试')
    }
  }

  const refresh = async () => {
    if (await fetchPage(filters, 1)) {
      syncUrl(filters)
      toast.success('列表已刷新')
    }
  }

  const filtersApplied = Boolean(filters.date || filters.q)

  return (
    <PullToRefresh onRefresh={refresh} disabled={isLoading || isLoadingMore}>
      <section className="space-y-5" aria-labelledby="content-list-heading">
        <div className="surface-card rounded-2xl p-4 md:p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div>
                  <h2 id="content-list-heading" className="text-xl font-semibold tracking-tight text-content">内容列表</h2>
                </div>
                <TabSelector currentTab={filters.tab} onTabChange={(tab) => commitFilters({ tab: tab as Tab })} />
              </div>
              <SearchBar value={filters.q} onSearch={(q) => commitFilters({ q: q || undefined })} className="w-full lg:max-w-md" />
            </div>

            <div className="flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:items-end">
              <label className="grid gap-1.5 text-sm font-medium text-muted">
                日期
                <input
                  type="date"
                  value={filters.date || ''}
                  onChange={(event) => commitFilters({ date: event.target.value || undefined })}
                  className="min-h-11 rounded-lg border border-default bg-surface px-3 text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
              <div className="flex min-h-11 flex-1 items-center text-sm text-muted sm:justify-end" aria-live="polite">
                {isLoading ? '正在更新结果…' : `共 ${total} 条${filters.q ? '匹配内容' : '内容'}`}
              </div>
              {filtersApplied && (
                <button
                  type="button"
                  onClick={() => commitFilters({ date: undefined, q: undefined })}
                  className="min-h-11 rounded-lg px-3 text-sm font-medium text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  清除筛选
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading && items.length === 0 ? (
          <div className="surface-card flex min-h-64 items-center justify-center rounded-2xl text-muted" role="status">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> 正在加载内容…
          </div>
        ) : items.length > 0 ? (
          <MobileContentList contents={items} onDelete={handleDelete} detailPathPrefix={filters.tab === 'tech' ? '/content' : '/adult-content'} />
        ) : (
          <div className="surface-card flex min-h-64 flex-col items-center justify-center rounded-2xl p-8 text-center">
            <SearchX className="h-10 w-10 text-subtle" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-content">没有找到匹配内容</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">尝试调整搜索词、日期或内容类型，也可以清除筛选后重新浏览。</p>
            {filtersApplied && <button type="button" onClick={() => commitFilters({ date: undefined, q: undefined })} className="mt-5 min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">清除筛选</button>}
          </div>
        )}

        <div className="flex min-h-16 flex-col items-center justify-center gap-3" aria-live="polite">
          {loadError && (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button
                type="button"
                onClick={() => void fetchPage(filters, retryRequest?.page ?? page, retryRequest?.append ?? false)}
                className="min-h-11 rounded-lg border border-default px-4 text-sm font-medium text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                重试
              </button>
            </div>
          )}
          {!loadError && hasMore && (
            <button
              type="button"
              onClick={() => {
                syncUrl(filters, page + 1)
                void fetchPage(filters, page + 1, true)
              }}
              disabled={isLoadingMore || isLoading}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-default bg-surface px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-raised disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              {isLoadingMore ? '正在加载…' : '加载更多'}
            </button>
          )}
          {!loadError && !hasMore && items.length > 0 && <p className="text-sm text-subtle">已显示全部内容</p>}
        </div>
      </section>
    </PullToRefresh>
  )
}
