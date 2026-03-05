'use client'

import { useEffect, useRef } from 'react'
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
}

const ITEMS_PER_PAGE = 20

export default function ContentList({
  techContents: initialTechContents,
  adultContents: initialAdultContents,
  initialTab,
  initialOrderBy
}: ContentListProps) {
  const { state, actions } = useContentListState(
    initialTechContents,
    initialAdultContents,
    initialTab,
    initialOrderBy
  )
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 删除处理函数
  const handleDeleteTech = (id: string) => {
    actions.deleteTechContent(id)
  }

  const handleDeleteAdult = (id: string) => {
    actions.deleteAdultContent(id)
  }
  
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
  
  // 切换排序时重置数据
  useEffect(() => {
    // 重置为初始数据
    actions.setTechContents(initialTechContents)
    actions.setAdultContents(initialAdultContents)
    actions.resetPagination()
  }, [state.orderBy, initialTechContents, initialAdultContents])

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
