'use client'

interface TabSelectorProps {
  currentTab: string
  onTabChange?: (tab: string) => void
}

export default function TabSelector({ currentTab, onTabChange }: TabSelectorProps) {
  const tabs = [
    { id: 'tech', label: '技术内容' },
    { id: 'adult', label: '成人内容' }
  ]

  const handleTabClick = (tabId: string) => onTabChange?.(tabId)

  return (
    <div className="inline-flex w-full items-center rounded-xl bg-surface-raised p-1 sm:w-auto" role="tablist" aria-label="内容类型">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleTabClick(tab.id)}
          role="tab"
          aria-selected={currentTab === tab.id}
          className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:flex-none ${
            currentTab === tab.id
              ? 'bg-surface text-content shadow-sm'
              : 'text-muted hover:text-content'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
