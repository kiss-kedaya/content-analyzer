import { describe, expect, test } from 'vitest'
import {
  CONTENT_LIST_SNAPSHOT_MAX_AGE_MS,
  createContentListKey,
  parseContentListSnapshot,
  type ContentListSnapshot,
} from '@/lib/content-list-snapshot'

const snapshot: ContentListSnapshot = {
  version: 1,
  pending: true,
  key: 'tab=adult&q=video',
  savedAt: 10_000,
  filters: { tab: 'adult', q: 'video' },
  items: [{
    id: 'item-1', source: 'X', url: 'https://x.com/a/status/1', title: 'One', summary: 'Text',
    createdAt: '2026-07-19T00:00:00.000Z', favorited: false, mediaUrls: [],
  }],
  itemsTab: 'adult',
  page: 3,
  total: 50,
  hasMore: true,
  scrollY: 3200,
}

describe('content list return snapshot', () => {
  test('builds a stable key and restores a matching fresh snapshot', () => {
    expect(createContentListKey({ tab: 'adult', q: 'video' })).toBe('tab=adult&q=video')
    expect(parseContentListSnapshot(JSON.stringify(snapshot), snapshot.key, 20_000)).toEqual(snapshot)
  })

  test('rejects mismatched, stale, or malformed snapshots', () => {
    expect(parseContentListSnapshot(JSON.stringify(snapshot), 'tab=tech', 20_000)).toBeNull()
    expect(parseContentListSnapshot(JSON.stringify(snapshot), snapshot.key, snapshot.savedAt + CONTENT_LIST_SNAPSHOT_MAX_AGE_MS + 1)).toBeNull()
    expect(parseContentListSnapshot('{bad json', snapshot.key, 20_000)).toBeNull()
  })
})
