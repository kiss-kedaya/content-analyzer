'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from './Icon'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ onSearch, placeholder = '搜索...', className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 快捷键支持：Ctrl/Cmd + K 聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      
      // ESC 清空搜索
      if (e.key === 'Escape' && isFocused) {
        setQuery('')
        onSearch('')
        inputRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocused, onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all ${
        isFocused ? 'ring-2 ring-black' : 'ring-1 ring-gray-200'
      } rounded-lg bg-white`}>
        {/* 搜索图标 */}
        <div className="absolute left-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 text-sm text-black placeholder-gray-400 bg-transparent border-none outline-none"
        />

        {/* 快捷键提示 / 清空按钮 */}
        <div className="absolute right-3 flex items-center gap-2">
          {query ? (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="清空搜索"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-50 rounded border border-gray-200">
              <kbd className="font-mono">⌘</kbd>
              <kbd className="font-mono">K</kbd>
            </div>
          )}
        </div>
      </div>

      {/* 搜索提示 */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <p className="text-xs text-gray-500">
            搜索标题、摘要或来源
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">⌘K</kbd>
            <span>聚焦搜索</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">ESC</kbd>
            <span>清空</span>
          </div>
        </div>
      )}
    </div>
  )
}
