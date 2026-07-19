import { describe, expect, test } from 'vitest'
import { buildPreviewMediaFailureResult } from '@/lib/preview-media-service'

describe('preview media failure contract', () => {
  test('keeps an unavailable or deleted post as a recoverable empty result', () => {
    expect(buildPreviewMediaFailureResult('https://x.com/user/status/1', 'Token request failed: 403')).toEqual({
      success: true,
      url: 'https://x.com/user/status/1',
      media: [],
      videos: [],
      images: [],
      count: { videos: 0, images: 0, total: 0 },
      extractError: 'Token request failed: 403',
      warning: 'Media extraction failed',
    })
  })
})
