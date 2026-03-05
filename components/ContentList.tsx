'use client'

import { useState, useEffect, useRef } from 'react'
import ContentTable from './ContentTable'
import AdultContentTable from './AdultContentTable'
import TabSelector from './TabSelector'
import SortSelector from './SortSelector'
import { Loader2 } from './Icon'

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
  const [activeTab, setActiveTab] = useState(initialTab)
  const [orderBy, setOrderBy] = useState(initialOrderBy)
  const [techContents, setTechContents] = useState(initialTechContents)
  const [adultContents, setAdultContents] = useState(initialAdultContents)
  
  // 分页状态
  const [techPage, setTechPage] = useState(1)
  const [adultPage, setAdultPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [techHasMore, setTechHasMore] = useState(true)
  const [adultHasMore, setAdultHasMore] = useState(true)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 删除处理函数
  const handleDeleteTech = (id: string) => {
    setTechContents(prev => prev.filter(item => item.id !== id))
  }

  const handleDeleteAdult = (id: string) => {
    setAdultContents(prev => prev.filter(item => item.id !== id))
  }
  
  // 加载更多
  const loadMore = async () => {
    if (loading) return
    
    setLoading(true)
    
    try {
      const isTech = activeTab === 'tech'
      const nextPage = isTech ? techPage + 1 : adultPage + 1
      const endpoint = isTech ? '/api/content/paginated' : '/api/adult-content/paginated'
      
      const response = await fetch(
        `${endpoint}?page=${nextPage}&pageSize=${ITEMS_PER_PAGE}&orderBy=${orderBy}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch more contents')
      }
      
      const data = await response.json()
      
      if (isTech) {
        setTechContents(prev => [...prev, ...data.contents])
        setTechPage(nextPage)
        setTechHasMore(data.pagination.hasMore)
      } else {
        setAdultContents(prev => [...prev, ...data.contents])
        setAdultPage(nextPage)
        setAdultHasMore(data.pagination.hasMore)
      }
    } catch (error) {
      console.error('Failed to load more:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Intersection Observer 监听滚动到底部
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const hasMore = activeTab === 'tech' ? techHasMore : adultHasMore
          if (hasMore && !loading) {
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
  }, [activeTab, techHasMore, adultHasMore, loading, techPage, adultPage, orderBy])
  
  // 切换排序时重置数据
  useEffect(() => {
    // 重置为初始数据
    setTechContents(initialTechContents)
    setAdultContents(initialAdultContents)
    setTechPage(1)
    setAdultPage(1)
    setTechHasMore(true)
    setAdultHasMore(true)
  }, [orderBy, initialTechContents, initialAdultContents])

  const sortedTechContents = sortContents(techContents, orderBy)
  const sortedAdultContents = sortContents(adultContents, orderBy)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <h2 className="text-xl md:text-2xl font-semibold text-black">内容列表</h2>
          <TabSelector 
            currentTab={activeTab} 
            onTabChange={setActiveTab}
          />
        </div>
        <SortSelector 
          value={orderBy} 
          currentTab={activeTab}
          onSortChange={setOrderBy}
        />
      </div>
      
      {/* 使用 CSS 隐藏/显示，避免重新渲染 */}
      <div className={activeTab === 'tech' ? 'block' : 'hidden'}>
        <ContentTable contents={techContents} onDelete={handleDeleteTech} />
      </div>
      
      <div className={activeTab === 'adult' ? 'block' : 'hidden'}>
        <AdultContentTable contents={adultContents} onDelete={handleDeleteAdult} />
      </div>
      
      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="py-8">
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        )}
        {!loading && ((activeTab === 'tech' && !techHasMore) || (activeTab === 'adult' && !adultHasMore)) && (
          <div className="text-center text-gray-400 text-sm">
            已加载全部内容
          </div>
        )}
      </div>
    </div>
  )
}
