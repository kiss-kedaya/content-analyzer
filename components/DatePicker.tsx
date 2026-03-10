'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Calendar } from '@/components/Icon'

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日']

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getMonthGrid(year: number, month: number) {
  // month: 0-11
  const first = new Date(year, month, 1)
  const startDay = (first.getDay() + 6) % 7 // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<{ date: Date | null; label: number | null }> = []
  for (let i = 0; i < startDay; i++) {
    cells.push({ date: null, label: null })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), label: d })
  }
  return cells
}

type Props = {
  value?: string | null
  onChange: (value: string | null) => void
}

export default function DatePicker({ value, onChange }: Props) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!value) return
    const d = new Date(`${value}T00:00:00`)
    if (!Number.isNaN(d.getTime())) {
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  const selectedDate = value ? new Date(`${value}T00:00:00`) : null

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const label = value ? value : '选择日期'

  const goPrev = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(prev.getFullYear())
    setViewMonth(prev.getMonth())
  }

  const goNext = () => {
    const next = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }

  const selectDate = (d: Date) => {
    onChange(formatDate(d))
    setOpen(false)
  }

  const clearDate = () => {
    onChange(null)
    setOpen(false)
  }

  const toToday = () => {
    const now = new Date()
    onChange(formatDate(now))
    setOpen(false)
  }

  // 点击外部关闭
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-black hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        {label}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-black">
              {viewYear} 年 {viewMonth + 1} 月
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                上一月
              </button>
              <button
                type="button"
                onClick={goNext}
                className="px-2 py-1 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                下一月
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, idx) => {
              if (!cell.date) {
                return <div key={`empty-${idx}`} className="h-8" />
              }

              const dateStr = formatDate(cell.date)
              const selected = selectedDate && formatDate(selectedDate) === dateStr

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => selectDate(cell.date as Date)}
                  className={`h-8 rounded-md text-sm ${selected ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                >
                  {cell.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={toToday}
              className="text-sm text-gray-600 hover:text-black"
            >
              今天
            </button>
            <button
              type="button"
              onClick={clearDate}
              className="text-sm text-gray-600 hover:text-black"
            >
              清除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
