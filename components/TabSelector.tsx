'use client'

import { useRouter } from 'next/navigation'

interface TabSelectorProps {
  currentTab: string
  onTabChange?: (tab: string) => void
}

export default function TabSelector({ currentTab, onTabChange }: TabSelectorProps) {
  const router = useRouter()
  
  const tabs = [
    { id: 'tech', label: '技术内容' },
    { id: 'adult', label: '成人内容' }
  ]

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      // 客户端切换（不刷新页面）
      onTabChange(tabId)
    } else {
      // 服务端切换（刷新页面）
      router.push(`/?tab=${tabId}`)
    }
  }

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 w-full md:w-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex-1 md:flex-none px-4 py-2.5 md:py-2 text-sm font-medium rounded-md transition-colors ${
            currentTab === tab.id
              ? 'bg-white text-black shadow-sm'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
