'use client'
import { ArrowUpDown } from '@/components/Icon'

interface SortSelectorProps {
  value: string
  currentTab?: string
  onSortChange?: (sort: string) => void
}

export default function SortSelector({ value, currentTab = 'tech', onSortChange }: SortSelectorProps) {
  const handleSortChange = (newSort: string) => onSortChange?.(newSort)

  return (
    <label className="grid gap-1.5 text-sm font-medium text-muted">
      <span className="flex items-center gap-2"><ArrowUpDown className="h-4 w-4" aria-hidden="true" /> 排序</span>
      <select
        value={value}
        onChange={(e) => handleSortChange(e.target.value)}
        className="min-h-11 rounded-lg border border-default bg-surface px-3 text-sm text-content focus:outline-none focus:ring-2 focus:ring-brand"
      >
        <option value="score">评分（高到低）</option>
        <option value="createdAt">创建时间（新到旧）</option>
        <option value="analyzedAt">分析时间（新到旧）</option>
      </select>
    </label>
  )
}
