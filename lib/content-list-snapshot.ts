import type { ContentListItem } from '@/types'

export const CONTENT_LIST_HISTORY_FIELD = '__contentAnalyzerListKey'
export const CONTENT_LIST_SNAPSHOT_STORAGE_KEY = 'content-analyzer:list-return:v1'
export const CONTENT_LIST_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000

export type ContentListTab = 'tech' | 'adult'
export type ContentListFilters = { tab: ContentListTab; date?: string; q?: string }

export type ContentListSnapshot = {
  version: 1
  pending: true
  key: string
  savedAt: number
  filters: ContentListFilters
  items: ContentListItem[]
  itemsTab: ContentListTab
  page: number
  total: number
  hasMore: boolean
  scrollY: number
}

export function createContentListKey(filters: ContentListFilters) {
  const params = new URLSearchParams({ tab: filters.tab })
  if (filters.date) params.set('date', filters.date)
  if (filters.q) params.set('q', filters.q)
  return params.toString()
}

export function parseContentListSnapshot(
  raw: string | null,
  expectedKey: string,
  now = Date.now(),
): ContentListSnapshot | null {
  if (!raw) return null

  try {
    const value = JSON.parse(raw) as Partial<ContentListSnapshot>
    if (
      value.version !== 1
      || value.pending !== true
      || value.key !== expectedKey
      || typeof value.savedAt !== 'number'
      || now - value.savedAt > CONTENT_LIST_SNAPSHOT_MAX_AGE_MS
      || !value.filters
      || (value.filters.tab !== 'tech' && value.filters.tab !== 'adult')
      || !Array.isArray(value.items)
      || value.items.length === 0
      || !value.items.every((item) => item && typeof item.id === 'string')
      || (value.itemsTab !== 'tech' && value.itemsTab !== 'adult')
      || typeof value.page !== 'number'
      || value.page < 1
      || typeof value.total !== 'number'
      || typeof value.hasMore !== 'boolean'
      || typeof value.scrollY !== 'number'
    ) {
      return null
    }

    return value as ContentListSnapshot
  } catch {
    return null
  }
}
