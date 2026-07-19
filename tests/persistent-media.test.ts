import { describe, expect, test } from 'vitest'
import { normalizePersistentMediaUrl, parsePersistentMediaItems } from '@/lib/persistent-media'

describe('persistent media URLs', () => {
  test('normalizes direct twimg media and rejects unrelated hosts', () => {
    expect(normalizePersistentMediaUrl('https://video.twimg.com/path/720x1280/video.mp4?tag=14'))
      .toContain('//media.kedaya.xyz/?url=')
    expect(normalizePersistentMediaUrl('https://example.com/video.mp4')).toBeNull()
  })

  test('rehydrates stored proxy video and image URLs without extraction', () => {
    const items = parsePersistentMediaItems([
      '//media.kedaya.xyz/?url=https%3A%2F%2Fvideo.twimg.com%2Fpath%2Fvideo.mp4%3Ftag%3D14',
      '//media.kedaya.xyz/?url=https%3A%2F%2Fpbs.twimg.com%2Fmedia%2Fphoto.jpg',
    ])

    expect(items).toEqual([
      expect.objectContaining({ type: 'video', format: 'mp4', sourceUrl: expect.stringContaining('video.twimg.com') }),
      expect.objectContaining({ type: 'image', sourceUrl: expect.stringContaining('pbs.twimg.com') }),
    ])
  })
})
