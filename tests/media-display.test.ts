import { describe, expect, test } from 'vitest'
import { buildVideoFeed, detectDisplayMediaType, pickPrimaryDisplayMedia, withVideoPreviewFrame } from '@/lib/media-display'

const video = '//media.kedaya.xyz/?url=https%3A%2F%2Fvideo.twimg.com%2Fpath%2F720x1280%2Fvideo.mp4%3Ftag%3D14'
const image = '//media.kedaya.xyz/?url=https%3A%2F%2Fpbs.twimg.com%2Fmedia%2Fphoto.jpg'

describe('media display helpers', () => {
  test('detects nested proxy media and prefers video for the card preview', () => {
    expect(detectDisplayMediaType(video)).toBe('video')
    expect(detectDisplayMediaType(image)).toBe('image')
    expect(pickPrimaryDisplayMedia([image, video])).toBe(video)
  })

  test('adds the iOS first-frame media fragment without changing the proxy target', () => {
    const preview = withVideoPreviewFrame(video)
    expect(preview).toContain('media.kedaya.xyz')
    expect(preview).toContain('#t=0.001')
    expect(preview).toContain('video.twimg.com')
  })

  test('builds an ordered video-only feed with detail links', () => {
    const feed = buildVideoFeed([
      { id: 'one', title: 'First', mediaUrls: [image, video] },
      { id: 'two', title: 'Images only', mediaUrls: [image] },
    ])

    expect(feed).toHaveLength(1)
    expect(feed[0]).toMatchObject({ id: 'one', title: 'First' })
    expect(feed[0].mediaUrl).toMatch(/^https:\/\/media\.kedaya\.xyz/)
  })
})
