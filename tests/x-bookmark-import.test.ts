import { describe, expect, test } from 'vitest'
import { transformXBookmarks } from '@/lib/x-bookmark-import'

describe('X bookmark import', () => {
  test('uses deterministic fields, sensitive routing, deduplication, and oldest-first writes', () => {
    const result = transformXBookmarks({
      data: [
        { id: '3', author_id: 'u1', text: 'new sensitive', url: 'https://x.com/alice/status/3', created_at: '2026-07-03T00:00:00Z', possibly_sensitive: true, attachments: { media_keys: ['m1'] } },
        { id: '2', author_id: 'u1', text: 'new regular', url: 'https://x.com/alice/status/2', created_at: '2026-07-02T00:00:00Z' },
        { id: '1', author_id: 'u1', text: 'old regular', url: 'https://x.com/alice/status/1', created_at: '2026-07-01T00:00:00Z' },
        { id: '2-copy', author_id: 'u1', text: 'duplicate', url: 'https://x.com/alice/status/2' },
      ],
      includes: {
        users: [{ id: 'u1', name: 'Alice', username: 'alice' }],
        media: [{
          media_key: 'm1',
          type: 'video',
          variants: [{ bit_rate: 2_000_000, content_type: 'video/mp4', url: 'https://video.twimg.com/a/vid/avc1/720x1280/video.mp4' }],
        }],
      },
    })

    expect(result.content.map((item) => item.url)).toEqual([
      'https://x.com/alice/status/1',
      'https://x.com/alice/status/2',
    ])
    expect(result.adultContent).toHaveLength(1)
    expect(result.adultContent[0].mediaUrls?.[0]).toContain('//media.kedaya.xyz/?url=')
    expect(result.content[0]).toMatchObject({
      title: 'Alice (@alice)',
      content: 'old regular',
      summary: 'old regular',
      score: 0,
      analyzedBy: 'alice',
      sourceTime: Date.parse('2026-07-01T00:00:00Z'),
    })
  })

  test('routes explicit reposts and the same adult source without trusting the X flag', () => {
    const result = transformXBookmarks({
      data: [
        { id: '1', author_id: 'adult-source', text: '嫩萝自慰视频', url: 'https://x.com/source/status/1', possibly_sensitive: false },
        { id: '2', author_id: 'adult-source', text: '请给一个关注', url: 'https://x.com/source/status/2', possibly_sensitive: false },
        { id: '3', author_id: 'tech-source', text: 'Next.js API 性能优化', url: 'https://x.com/tech/status/3', possibly_sensitive: false },
        { id: '4', author_id: 'sexy-source', text: '新视频', url: 'https://x.com/sexy/status/4', possibly_sensitive: false },
        { id: '5', author_id: 'euphemism-source', text: '第一视角被操得太颠簸', url: 'https://x.com/euphemism/status/5', possibly_sensitive: false },
      ],
      includes: {
        users: [
          { id: 'adult-source', name: 'Creator', username: 'creator' },
          { id: 'tech-source', name: 'Developer', username: 'developer' },
          { id: 'sexy-source', name: 'Sexy Clip', username: 'sexy_clip' },
          { id: 'euphemism-source', name: 'Creator', username: 'creator_two' },
        ],
      },
    })

    expect(result.content.map((item) => item.url)).toEqual(['https://x.com/tech/status/3'])
    expect(result.adultContent.map((item) => item.url)).toEqual([
      'https://x.com/euphemism/status/5',
      'https://x.com/sexy/status/4',
      'https://x.com/source/status/2',
      'https://x.com/source/status/1',
    ])
  })
})
