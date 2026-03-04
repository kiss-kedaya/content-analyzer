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
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 排序函数
  const sortContents = <T extends Content>(contents: T[], sortBy: string): T[] => {
    const sorted = [...contents]
    
    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => b.score - a.score)
      case 'createdAt':
        return sorted.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      case 'analyzedAt':
        return sorted.sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      default:
        return sorted
    }
  }

  // 删除处理函数
  const handleDeleteTech = (id: string) => {
    setTechContents(prev => prev.filter(item => item.id !== id))
  }

  const handleDeleteAdult = (id: string) => {
    setAdultContents(prev => prev.filter(item => item.id !== id))
  }

  const sortedTechContents = sortContents(techContents, orderBy)
  const sortedAdultContents = sortContents(adultContents, orderBy)
  
  // 分页后的内容
  const paginatedTechContents = sortedTechContents.slice(0, techPage * ITEMS_PER_PAGE)
  const paginatedAdultContents = sortedAdultContents.slice(0, adultPage * ITEMS_PER_PAGE)
  
  // 是否还有更多内容
  const hasTechMore = paginatedTechContents.length < sortedTechContents.length
  const hasAdultMore = paginatedAdultContents.length < sortedAdultContents.length
  
  // 加载更多
  const loadMore = () => {
    if (loading) return
    
    setLoading(true)
    setTimeout(() => {
      if (activeTab === 'tech') {
        setTechPage(prev => prev + 1)
      } else {
        setAdultPage(prev => prev + 1)
      }
      setLoading(false)
    }, 300) // 模拟加载延迟
  }
  
  // Intersection Observer 监听滚动到底部
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const hasMore = activeTab === 'tech' ? hasTechMore : hasAdultMore
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
  }, [activeTab, hasTechMore, hasAdultMore, loading])
  
  // 切换排序时重置分页
  useEffect(() => {
    setTechPage(1)
    setAdultPage(1)
  }, [orderBy])
  
  // 切换标签时重置分页
  useEffect(() => {
    if (activeTab === 'tech') {
      setTechPage(1)
    } else {
      setAdultPage(1)
    }
  }, [activeTab])

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
        <ContentTable contents={paginatedTechContents} onDelete={handleDeleteTech} />
      </div>
      
      <div className={activeTab === 'adult' ? 'block' : 'hidden'}>
        <AdultContentTable contents={paginatedAdultContents} onDelete={handleDeleteAdult} />
      </div>
      
      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="py-8">
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">加载中...</span>
          </div>
        )}
        {!loading && ((activeTab === 'tech' && !hasTechMore) || (activeTab === 'adult' && !hasAdultMore)) && (
          <div className="text-center text-gray-400 text-sm">
            已加载全部内容
          </div>
        )}
      </div>
    </div>
  )
}
