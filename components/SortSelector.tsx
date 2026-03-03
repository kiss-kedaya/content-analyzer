'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpDown } from '@/components/Icon'

interface SortSelectorProps {
  value: string
}

export default function SortSelector({ value }: SortSelectorProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ArrowUpDown className="w-4 h-4" />
        <span>排序：</span>
      </div>
      <select
        value={value}
        onChange={(e) => router.push(`/?orderBy=${e.target.value}`)}
        className="text-sm bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all cursor-pointer hover:border-gray-400"
      >
        <option value="score">评分（高到低）</option>
        <option value="createdAt">创建时间（新到旧）</option>
        <option value="analyzedAt">分析时间（新到旧）</option>
      </select>
    </div>
  )
}
