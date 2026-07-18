'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from './Icon'

interface SearchBarProps {
  value?: string
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value = '', onSearch, placeholder = '搜索标题、摘要或来源…', className = '' }: SearchBarProps) {
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasMounted = useRef(false)
  const onSearchRef = useRef(onSearch)

  useEffect(() => setDraft(value), [value])
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    const timer = window.setTimeout(() => onSearchRef.current(draft.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [draft])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        setDraft('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="content-search" className="sr-only">搜索内容</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
      <input
        id="content-search"
        ref={inputRef}
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-lg border border-default bg-surface py-2 pl-10 pr-20 text-sm text-content placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => setDraft('')}
          className="absolute right-2 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-label="清空搜索"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-default bg-surface-raised px-1.5 py-0.5 text-[11px] font-medium text-subtle sm:block">Ctrl / ⌘ K</kbd>
      )}
    </div>
  )
}
