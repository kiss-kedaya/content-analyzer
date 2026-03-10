'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import ContentTable from './ContentTable'
import AdultContentTable from './AdultContentTable'
import TabSelector from './TabSelector'
import SortSelector from './SortSelector'
import { Loader2 } from './Icon'
import { useContentListState } from '@/hooks/useContentListState'

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
}

const ITEMS_PER_PAGE = 20

export default function ContentList({
  techContents: initialTechContents,
  adultContents: initialAdultContents,
  initialTab,
  initialOrderBy,
  initialPage
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

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 删除处理函数
  const handleDeleteTech = (id: string) => {
    actions.deleteTechContent(id)
  }

  const handleDeleteAdult = (id: string) => {
    actions.deleteAdultContent(id)
  }

  // 页面返回后恢复滚动位置
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

  // 持久化滚动与列表状态
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

  // URL 只同步 tab/orderBy，避免无限滚动时频繁 replace 导致页面抖动
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    const unchanged =
      params.get('tab') === state.activeTab &&
      params.get('orderBy') === state.orderBy

    if (unchanged) {
      return
    }

    params.set('tab', state.activeTab)
    params.set('orderBy', state.orderBy)
    params.delete('page')

    const next = `${pathname}?${params.toString()}`
    router.replace(next, { scroll: false })
  }, [state.activeTab, state.orderBy, pathname, router, searchParams])

  // 加载更多
  const loadMore = async () => {
    if (state.loading) return
    
    actions.setLoading(true)
    
    try {
      const isTech = state.activeTab === 'tech'
      const nextPage = isTech ? state.techPage + 1 : state.adultPage + 1
      const endpoint = isTech ? '/api/content/paginated' : '/api/adult-content/paginated'
      
      const response = await fetch(
        `${endpoint}?page=${nextPage}&pageSize=${ITEMS_PER_PAGE}&orderBy=${state.orderBy}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch more contents')
      }
      
      const data = await response.json()
      
      // 适配新的响应格式
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
    } finally {
      actions.setLoading(false)
    }
  }
  
  // Intersection Observer 监听滚动到底部
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
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [state.activeTab, state.techHasMore, state.adultHasMore, state.loading, state.techPage, state.adultPage, state.orderBy])
  
  // 切换排序时只重新获取当前 tab 数据，避免双请求
  useEffect(() => {
    const fetchSortedData = async () => {
      actions.setLoading(true)

      try {
        const isTech = state.activeTab === 'tech'
        const endpoint = isTech ? '/api/content/paginated' : '/api/adult-content/paginated'
        const response = await fetch(`${endpoint}?page=1&pageSize=${ITEMS_PER_PAGE}&orderBy=${state.orderBy}`)

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

    // 只在排序改变时重新获取（不包括初始加载）
    if (state.orderBy !== initialOrderBy) {
      fetchSortedData()
    }
  }, [state.orderBy, state.activeTab])

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <h2 className="text-xl md:text-2xl font-semibold text-black">内容列表</h2>
          <TabSelector 
            currentTab={state.activeTab} 
            onTabChange={actions.setTab}
          />
        </div>
        <SortSelector 
          value={state.orderBy} 
          currentTab={state.activeTab}
          onSortChange={actions.setOrderBy}
        />
      </div>
      
      {/* 使用 CSS 隐藏/显示，避免重新渲染 */}
      <div className={state.activeTab === 'tech' ? 'block' : 'hidden'}>
        <ContentTable contents={state.techContents} onDelete={handleDeleteTech} />
      </div>
      
      <div className={state.activeTab === 'adult' ? 'block' : 'hidden'}>
        <AdultContentTable contents={state.adultContents} onDelete={handleDeleteAdult} />
      </div>
      
      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="py-8">
        {state.loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        )}
        {!state.loading && ((state.activeTab === 'tech' && !state.techHasMore) || (state.activeTab === 'adult' && !state.adultHasMore)) && (
          <div className="text-center text-gray-400 text-sm">
            已加载全部内容
          </div>
        )}
      </div>
    </div>
  )
}
