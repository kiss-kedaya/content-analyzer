import { describe, expect, test } from 'vitest'
import { transformXBookmarks } from '@/lib/x-bookmark-import'

describe('X bookmark import', () => {
  test('uses deterministic fields, sensitive routing, deduplication, and oldest-first writes', () => {
    const result = transformXBookmarks({
      data: [
        { id: '3', author_id: 'u1', text: 'new sensitive', url: 'https://x.com/alice/status/3', created_at: '2026-07-03T00:00:00Z', possibly_sensitive: true },
        { id: '2', author_id: 'u1', text: 'new regular', url: 'https://x.com/alice/status/2', created_at: '2026-07-02T00:00:00Z' },
        { id: '1', author_id: 'u1', text: 'old regular', url: 'https://x.com/alice/status/1', created_at: '2026-07-01T00:00:00Z' },
        { id: '2-copy', author_id: 'u1', text: 'duplicate', url: 'https://x.com/alice/status/2' },
      ],
      includes: { users: [{ id: 'u1', name: 'Alice', username: 'alice' }] },
    })

    expect(result.content.map((item) => item.url)).toEqual([
      'https://x.com/alice/status/1',
      'https://x.com/alice/status/2',
    ])
    expect(result.adultContent).toHaveLength(1)
    expect(result.content[0]).toMatchObject({
      title: 'Alice (@alice)',
      content: 'old regular',
      summary: 'old regular',
      score: 0,
      analyzedBy: 'alice',
      sourceTime: Date.parse('2026-07-01T00:00:00Z'),
    })
  })
})
