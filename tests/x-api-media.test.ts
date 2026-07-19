import { describe, expect, test, vi } from 'vitest'
import { extractWithXApiDetailed, parseXApiMediaPayload, selectBestXVideoVariant } from '@/lib/media-extractor-x-api'

const variants = [
  { bit_rate: 10_368_000, content_type: 'video/mp4', url: 'https://video.twimg.com/a/vid/avc1/1440x1080/high.mp4' },
  { bit_rate: 2_176_000, content_type: 'video/mp4', url: 'https://video.twimg.com/a/vid/avc1/960x720/mobile.mp4' },
  { bit_rate: 832_000, content_type: 'video/mp4', url: 'https://video.twimg.com/a/vid/avc1/480x360/low.mp4' },
  { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/a/master.m3u8' },
]

describe('X API media extraction', () => {
  test('selects the best mobile-safe MP4 variant', () => {
    expect(selectBestXVideoVariant(variants)?.url).toContain('/960x720/mobile.mp4')
  })

  test('preserves attachment order and maps one URL per media item', () => {
    const media = parseXApiMediaPayload({
      data: { attachments: { media_keys: ['video-1', 'photo-1'] } },
      includes: {
        media: [
          { media_key: 'photo-1', type: 'photo', url: 'https://pbs.twimg.com/media/example.jpg' },
          { media_key: 'video-1', type: 'video', variants },
        ],
      },
    })

    expect(media).toEqual([
      expect.objectContaining({ type: 'video', quality: '960x720', format: 'mp4' }),
      expect.objectContaining({ type: 'image', url: 'https://pbs.twimg.com/media/example.jpg' }),
    ])
  })

  test('requests variants from the official API without exposing the token in the URL', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      data: { attachments: { media_keys: ['video-1'] } },
      includes: { media: [{ media_key: 'video-1', type: 'video', variants }] },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    const result = await extractWithXApiDetailed('https://x.com/user/status/2078006193696772377', {
      bearerToken: 'server-secret',
      fetchImpl: fetchImpl as typeof fetch,
    })

    const [url, init] = fetchImpl.mock.calls[0]
    expect(String(url)).toContain('media.fields=media_key%2Ctype%2Curl%2Cpreview_image_url%2Cvariants%2Cwidth%2Cheight')
    expect(String(url)).not.toContain('server-secret')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer server-secret')
    expect(result.media[0].url).toContain('/960x720/mobile.mp4')
  })
})
