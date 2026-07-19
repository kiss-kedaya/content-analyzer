import { describe, expect, test } from 'vitest'
import { prepareXTimelineImport } from '@/lib/x-timeline-import'

describe('browser-captured X timeline import', () => {
  test('keeps media posts, routes adult content, and ignores text-only posts', () => {
    const result = prepareXTimelineImport({
      data: [
        {
          id: '100', author_id: 'tech', text: 'API release', url: 'https://x.com/tech/status/100',
          attachments: { media_keys: ['photo-1'] },
        },
        {
          id: '101', author_id: 'adult', text: '第一视角被操得太颠簸', url: 'https://x.com/adult/status/101',
          attachments: { media_keys: ['video-1'] }, possibly_sensitive: false,
        },
        { id: '102', author_id: 'tech', text: 'text only', url: 'https://x.com/tech/status/102' },
      ],
      includes: {
        users: [
          { id: 'tech', name: 'Developer', username: 'tech' },
          { id: 'adult', name: 'Creator', username: 'creator' },
        ],
        media: [
          { media_key: 'photo-1', type: 'photo', url: 'https://pbs.twimg.com/media/example.jpg' },
          {
            media_key: 'video-1', type: 'video', variants: [
              { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/example/master.m3u8' },
              { content_type: 'video/mp4', bit_rate: 2_000_000, url: 'https://video.twimg.com/example/vid/avc1/720x1280/video.mp4' },
            ],
          },
        ],
      },
    })

    expect(result.content).toHaveLength(1)
    expect(result.adultContent).toHaveLength(1)
    expect(result.acceptedPostIds).toEqual(['100', '101'])
    expect(result.ignoredPostIds).toEqual(['102'])
    expect(result.content[0].mediaUrls?.[0]).toContain('media.kedaya.xyz')
    expect(result.adultContent[0].mediaUrls?.[0]).toContain('media.kedaya.xyz')
  })

  test('rejects more than 100 captured posts', () => {
    expect(() => prepareXTimelineImport({
      data: Array.from({ length: 101 }, (_, index) => ({ id: String(index + 1) })),
    })).toThrow()
  })
})
