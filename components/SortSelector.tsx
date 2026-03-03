'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

interface SortSelectorProps {
  value: string
}

export default function SortSelector({ value }: SortSelectorProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
        <ArrowUpDown className="w-4 h-4" />
        <span>排序：</span>
      </div>
      <select
        value={value}
        onChange={(e) => router.push(`/?orderBy=${e.target.value}`)}
        className="text-sm bg-white/80 backdrop-blur-md border border-gray-300 rounded-xl px-4 py-2.5 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
      >
        <option value="score">评分（高到低）</option>
        <option value="createdAt">创建时间（新到旧）</option>
        <option value="analyzedAt">分析时间（新到旧）</option>
      </select>
    </div>
  )
}
