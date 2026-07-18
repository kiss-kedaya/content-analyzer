import { describe, expect, it, vi } from 'vitest'
import {
  assessStoredXMedia,
  collectStoredVideoUrls,
  parseStoredVideoUrl,
  StoredVideoUrl,
} from '@/lib/x-media-cleanup'

const directVideo = 'https://video.twimg.com/ext_tw_video/123/pu/vid/avc1/480x270/sample.mp4?tag=12'
const proxiedVideo = `//media.kedaya.xyz/?url=${encodeURIComponent(directVideo)}`

describe('X media cleanup URL parsing', () => {
  it('normalizes an existing media proxy URL', () => {
    expect(parseStoredVideoUrl(proxiedVideo)).toEqual({
      storedUrl: proxiedVideo,
      targetUrl: directVideo,
      probeUrl: `https://media.kedaya.xyz/?url=${encodeURIComponent(directVideo)}`,
    })
  })

  it('wraps a direct twimg video with the media proxy', () => {
    expect(parseStoredVideoUrl(directVideo)?.probeUrl).toBe(
      `https://media.kedaya.xyz/?url=${encodeURIComponent(directVideo)}`,
    )
  })

  it('ignores images, arbitrary hosts, malformed URLs, and duplicates', () => {
    expect(collectStoredVideoUrls([
      'https://pbs.twimg.com/media/example.jpg',
      'https://example.com/video.mp4',
      'not-a-url',
      directVideo,
      proxiedVideo,
    ])).toHaveLength(1)
  })
})

describe('X media cleanup assessment', () => {
  const result = (video: StoredVideoUrl, status: number | null) => ({ ...video, status })

  it('marks a record unavailable only when every stored video is a hard failure', async () => {
    const probe = vi.fn(async (video: StoredVideoUrl) => result(video, 403))
    await expect(assessStoredXMedia([directVideo, directVideo.replace('sample', 'second')], probe))
      .resolves.toMatchObject({ state: 'unavailable' })
    expect(probe).toHaveBeenCalledTimes(2)
  })

  it('protects the record when any video is still available', async () => {
    const probe = vi.fn(async (video: StoredVideoUrl) => result(video, video.targetUrl.includes('second') ? 206 : 403))
    await expect(assessStoredXMedia([directVideo, directVideo.replace('sample', 'second')], probe))
      .resolves.toMatchObject({ state: 'available' })
  })

  it('does not treat timeouts, rate limits, or server errors as deleted media', async () => {
    for (const status of [null, 429, 500]) {
      const probe = vi.fn(async (video: StoredVideoUrl) => result(video, status))
      await expect(assessStoredXMedia([directVideo], probe)).resolves.toMatchObject({ state: 'inconclusive' })
    }
  })

  it('does not scan records without stored videos', async () => {
    const probe = vi.fn()
    await expect(assessStoredXMedia(['https://pbs.twimg.com/media/example.jpg'], probe))
      .resolves.toEqual({ state: 'no-video', checks: [] })
    expect(probe).not.toHaveBeenCalled()
  })
})
