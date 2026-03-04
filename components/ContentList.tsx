'use client'

import { useState } from 'react'
import ContentTable from './ContentTable'
import AdultContentTable from './AdultContentTable'
import TabSelector from './TabSelector'
import SortSelector from './SortSelector'

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
        <ContentTable contents={sortedTechContents} onDelete={handleDeleteTech} />
      </div>
      
      <div className={activeTab === 'adult' ? 'block' : 'hidden'}>
        <AdultContentTable contents={sortedAdultContents} onDelete={handleDeleteAdult} />
      </div>
    </div>
  )
}
