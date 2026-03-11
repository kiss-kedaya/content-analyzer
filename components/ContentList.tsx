'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MobileContentList } from './MobileContentList'
import { PullToRefresh } from './PullToRefresh'
import { SearchBar } from './SearchBar'
import TabSelector from './TabSelector'
import SortSelector from './SortSelector'
import DatePicker from './DatePicker'
import { Loader2 } from './Icon'
import { useContentListState } from '@/hooks/useContentListState'
import { useToastContext } from './ClientLayout'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
  analyzedBy?: string | null
  favorited: boolean
}

interface AdultContent extends Content {
  mediaUrls: string[]
}

interface ContentListProps {
  techContents: Content[]
  adultContents: AdultContent[]
  initialTab: string
  initialOrderBy: string
  initialPage: number
  initialDate?: string | null
}

const DEFAULT_PAGE_SIZE = 20
const DATE_PAGE_SIZE = 10

export default function ContentList({
  techContents: initialTechContents,
  adultContents: initialAdultContents,
  initialTab,
  initialOrderBy,
  initialPage,
  initialDate
}: ContentListProps) {
  const { state, actions } = useContentListState(
    initialTechContents,
    initialAdultContents,
    initialTab,
    initialOrderBy,
    initialPage
  )
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [dateFilter, setDateFilter] = useState<string | null>(initialDate ?? null)
  const [searchQuery, setSearchQuery] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const toast = useToastContext()

  const handleDeleteTech = async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('Delete failed:', data)
        toast.error(data.error || '删除失败，请重试')
        return
      }

      actions.deleteTechContent(id)
      toast.success('删除成功')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleDeleteAdult = async (id: string) => {
    try {
      const response = await fetch(`/api/adult-content/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('Delete failed:', data)
        toast.error(data.error || '删除失败，请重试')
        return
      }

      actions.deleteAdultContent(id)
      toast.success('删除成功')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleRefresh = async () => {
    try {
      const isTech = state.activeTab === 'tech'
      const pageSize = dateFilter ? DATE_PAGE_SIZE : DEFAULT_PAGE_SIZE
      const endpoint = dateFilter
        ? (isTech ? '/api/agent/content/by-date' : '/api/agent/adult-content/by-date')
        : (isTech ? '/api/content/paginated' : '/api/adult-content/paginated')

      const url = dateFilter
        ? `${endpoint}?date=${dateFilter}&page=1&pageSize=${pageSize}&orderBy=${state.orderBy}`
        : `${endpoint}?page=1&pageSize=${pageSize}&orderBy=${state.orderBy}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('刷新失败')
      }

      const data = await response.json()
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || '刷新失败')
      }

      if (isTech) {
        actions.setTechContents(data.data)
        actions.setTechPage(1)
        actions.setTechHasMore(data.pagination?.hasMore ?? false)
      } else {
        actions.setAdultContents(data.data)
        actions.setAdultPage(1)
        actions.setAdultHasMore(data.pagination?.hasMore ?? false)
      }

      toast.success('刷新成功')
    } catch (error) {
      toast.error('刷新失败，请重试')
      throw error
    }
  }

  // 搜索过滤逻辑
  const filteredTechContents = useMemo(() => {
    if (!searchQuery.trim()) return state.techContents

    const query = searchQuery.toLowerCase()
    return state.techContents.filter(content => {
      const title = (content.title || '').toLowerCase()
      const summary = content.summary.toLowerCase()
      const source = content.source.toLowerCase()
      
      return title.includes(query) || summary.includes(query) || source.includes(query)
    })
  }, [state.techContents, searchQuery])

  const filteredAdultContents = useMemo(() => {
    if (!searchQuery.trim()) return state.adultContents

    const query = searchQuery.toLowerCase()
    return state.adultContents.filter(content => {
      const title = (content.title || '').toLowerCase()
      const summary = content.summary.toLowerCase()
      const source = content.source.toLowerCase()
      
      return title.includes(query) || summary.includes(query) || source.includes(query)
    })
  }, [state.adultContents, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  useEffect(() => {
    const raw = sessionStorage.getItem('content-list-state')
    if (!raw) return

    try {
      const saved = JSON.parse(raw)
      if (saved?.scrollY && Date.now() - (saved.timestamp || 0) < 30 * 60 * 1000) {
        setTimeout(() => {
          window.scrollTo({ top: Number(saved.scrollY), behavior: 'auto' })
        }, 50)
      }
    } catch {
      // ignore parse error
    }
  }, [])

  useEffect(() => {
    const onBeforeUnload = () => {
      sessionStorage.setItem('content-list-state', JSON.stringify({
        scrollY: window.scrollY,
        activeTab: state.activeTab,
        orderBy: state.orderBy,
        techPage: state.techPage,
        adultPage: state.adultPage,
        timestamp: Date.now()
      }))
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      onBeforeUnload()
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [state.activeTab, state.orderBy, state.techPage, state.adultPage])

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    const unchanged =
      params.get('tab') === state.activeTab &&
      params.get('orderBy') === state.orderBy &&
      (params.get('date') || '') === (dateFilter || '')

    if (unchanged) {
      return
    }

    params.set('tab', state.activeTab)
    params.set('orderBy', state.orderBy)
    if (dateFilter) {
      params.set('date', dateFilter)
    } else {
      params.delete('date')
    }
    params.delete('page')

    const next = `${pathname}?${params.toString()}`
    router.replace(next, { scroll: false })
  }, [state.activeTab, state.orderBy, dateFilter, pathname, router, searchParams])

  const loadMore = useCallback(async () => {
    if (state.loading) return

    actions.setLoading(true)
    setLoadError(null)

    try {
      const isTech = state.activeTab === 'tech'
      const currentPage = isTech ? state.techPage : state.adultPage
      
      // Ensure currentPage is a valid number
      if (!Number.isFinite(currentPage) || currentPage < 1) {
        console.error('Invalid page number:', currentPage)
        actions.setLoading(false)
        return
      }
      
      const nextPage = currentPage + 1
      const pageSize = dateFilter ? DATE_PAGE_SIZE : DEFAULT_PAGE_SIZE
      const endpoint = dateFilter
        ? (isTech ? '/api/agent/content/by-date' : '/api/agent/adult-content/by-date')
        : (isTech ? '/api/content/paginated' : '/api/adult-content/paginated')

      const url = dateFilter
        ? `${endpoint}?date=${dateFilter}&page=${nextPage}&pageSize=${pageSize}&orderBy=${state.orderBy}`
        : `${endpoint}?page=${nextPage}&pageSize=${pageSize}&orderBy=${state.orderBy}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch more contents')
      }

      const data = await response.json()

      if (data.success && data.data) {
        if (isTech) {
          actions.appendTechContents(data.data)
          actions.setTechPage(nextPage)
          actions.setTechHasMore(data.pagination?.hasMore ?? false)
        } else {
          actions.appendAdultContents(data.data)
          actions.setAdultPage(nextPage)
          actions.setAdultHasMore(data.pagination?.hasMore ?? false)
        }
      } else {
        throw new Error(data.error?.message || 'Failed to fetch more contents')
      }
    } catch (error) {
      console.error('Failed to load more:', error)
      setLoadError(error instanceof Error ? error.message : '加载失败，请重试')
    } finally {
      actions.setLoading(false)
    }
  }, [state.loading, state.activeTab, state.techPage, state.adultPage, dateFilter, state.orderBy, actions])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const hasMore = state.activeTab === 'tech' ? state.techHasMore : state.adultHasMore
          if (hasMore && !state.loading) {
            loadMore()
          }
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [state.activeTab, state.techHasMore, state.adultHasMore, state.loading, loadMore])

  useEffect(() => {
    const fetchSortedData = async () => {
      actions.setLoading(true)

      try {
        const isTech = state.activeTab === 'tech'
        const pageSize = dateFilter ? DATE_PAGE_SIZE : DEFAULT_PAGE_SIZE
        const endpoint = dateFilter
          ? (isTech ? '/api/agent/content/by-date' : '/api/agent/adult-content/by-date')
          : (isTech ? '/api/content/paginated' : '/api/adult-content/paginated')

        const url = dateFilter
          ? `${endpoint}?date=${dateFilter}&page=1&pageSize=${pageSize}&orderBy=${state.orderBy}`
          : `${endpoint}?page=1&pageSize=${pageSize}&orderBy=${state.orderBy}`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch sorted data')
        }

        const data = await response.json()
        if (!data.success || !data.data) {
          throw new Error(data.error?.message || 'Failed to fetch sorted data')
        }

        if (isTech) {
          actions.setTechContents(data.data)
          actions.setTechPage(1)
          actions.setTechHasMore(data.pagination?.hasMore ?? false)
        } else {
          actions.setAdultContents(data.data)
          actions.setAdultPage(1)
          actions.setAdultHasMore(data.pagination?.hasMore ?? false)
        }
      } catch (error) {
        console.error('Failed to fetch sorted data:', error)
      } finally {
        actions.setLoading(false)
      }
    }

    if (state.orderBy !== initialOrderBy || dateFilter !== (initialDate ?? null)) {
      fetchSortedData()
    }
  }, [state.orderBy, state.activeTab, dateFilter, initialDate, initialOrderBy])

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4">
          {/* 标题和控制栏 */}
          <div className="flex flex-col gap-4">
            {/* 第一行：标题和 Tab */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <h2 className="text-xl md:text-2xl font-semibold text-black">内容列表</h2>
              <TabSelector 
                currentTab={state.activeTab} 
                onTabChange={actions.setTab}
              />
            </div>

            {/* 第二行：筛选（桌面端同一行：日期 + 排序 + 搜索；移动端：日期+排序同行，搜索单独一行） */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-3 md:flex-none">
                <DatePicker
                  value={dateFilter}
                  onChange={(next) => {
                    setDateFilter(next)
                    actions.resetPagination()
                  }}
                />
                <SortSelector 
                  value={state.orderBy} 
                  currentTab={state.activeTab}
                  onSortChange={actions.setOrderBy}
                />
              </div>

              <SearchBar
                onSearch={handleSearch}
                placeholder="搜索标题、摘要或来源..."
                className="w-full md:w-96 md:ml-auto"
              />
            </div>
          </div>

          {/* 搜索结果提示 */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                找到 {state.activeTab === 'tech' ? filteredTechContents.length : filteredAdultContents.length} 条结果
              </span>
              {(state.activeTab === 'tech' ? filteredTechContents.length : filteredAdultContents.length) === 0 && (
                <span className="text-gray-400">- 尝试其他关键词</span>
              )}
            </div>
          )}
        </div>

        {/* 全端统一：卡片列表 */}
        <>
          <div className={state.activeTab === 'tech' ? 'block' : 'hidden'}>
            <MobileContentList
              contents={filteredTechContents}
              onDelete={handleDeleteTech}
              detailPathPrefix="/content"
            />
          </div>

          <div className={state.activeTab === 'adult' ? 'block' : 'hidden'}>
            <MobileContentList
              contents={filteredAdultContents}
              onDelete={handleDeleteAdult}
              detailPathPrefix="/adult-content"
            />
          </div>
        </>

        <div ref={loadMoreRef} className="py-8">
          {state.loading && (
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          )}
          {loadError && (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="text-center text-red-600 text-sm">{loadError}</div>
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
              >
                重试
              </button>
            </div>
          )}
          {!state.loading && !loadError && ((state.activeTab === 'tech' && !state.techHasMore) || (state.activeTab === 'adult' && !state.adultHasMore)) && (
            <div className="text-center text-gray-400 text-sm">
              已加载全部内容
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  )
}
