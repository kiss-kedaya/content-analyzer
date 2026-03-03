'use client'

import { useRouter } from 'next/navigation'

interface SortSelectorProps {
  value: string
}

export default function SortSelector({ value }: SortSelectorProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">排序：</span>
      <select
        value={value}
        onChange={(e) => router.push(`/?orderBy=${e.target.value}`)}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="score">评分（高到低）</option>
        <option value="createdAt">创建时间（新到旧）</option>
        <option value="analyzedAt">分析时间（新到旧）</option>
      </select>
    </div>
  )
}
