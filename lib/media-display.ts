export type DisplayMediaType = 'video' | 'image'

export const VIDEO_PLAYBACK_RATES = [1, 1.5, 2, 3, 4, 5, 6, 7, 8] as const

export interface VideoFeedItem {
  key: string
  id: string
  title: string
  mediaUrl: string
}

export interface VideoFeedSource {
  id: string
  title?: string | null
  mediaUrls?: string[]
}

export function toAbsoluteMediaUrl(value: string): string {
  return value.startsWith('//') ? `https:${value}` : value
}

export function getUnderlyingMediaUrl(value: string): string {
  try {
    const parsed = new URL(toAbsoluteMediaUrl(value))
    if (parsed.hostname.toLowerCase() === 'media.kedaya.xyz') {
      return parsed.searchParams.get('url') || parsed.toString()
    }
    return parsed.toString()
  } catch {
    return value
  }
}

export function detectDisplayMediaType(value: string): DisplayMediaType | null {
  try {
    const pathname = new URL(toAbsoluteMediaUrl(getUnderlyingMediaUrl(value))).pathname.toLowerCase()
    if (/\.(mp4|mov|m3u8)$/.test(pathname)) return 'video'
    if (/\.(jpe?g|png|webp|gif)$/.test(pathname)) return 'image'
    return null
  } catch {
    return null
  }
}

export function isStableDisplayMediaUrl(value: string): boolean {
  try {
    const host = new URL(toAbsoluteMediaUrl(value)).hostname.toLowerCase()
    return host === 'media.kedaya.xyz'
      || host === 'video.twimg.com'
      || host === 'pbs.twimg.com'
      || host.endsWith('.twimg.com')
  } catch {
    return false
  }
}

/** iOS Safari needs a tiny media time fragment before it paints the first frame. */
export function withVideoPreviewFrame(value: string): string {
  if (detectDisplayMediaType(value) !== 'video') return toAbsoluteMediaUrl(value)
  try {
    const parsed = new URL(toAbsoluteMediaUrl(value))
    if (!parsed.hash) parsed.hash = 't=0.001'
    return parsed.toString()
  } catch {
    return value
  }
}

export function pickPrimaryDisplayMedia(mediaUrls: string[] = []): string | null {
  const stable = mediaUrls.filter((value) => typeof value === 'string' && isStableDisplayMediaUrl(value))
  return stable.find((value) => detectDisplayMediaType(value) === 'video') || stable[0] || null
}

export function buildVideoFeed(contents: VideoFeedSource[]): VideoFeedItem[] {
  return contents.flatMap((content) => (content.mediaUrls || [])
    .filter((mediaUrl) => isStableDisplayMediaUrl(mediaUrl) && detectDisplayMediaType(mediaUrl) === 'video')
    .map((mediaUrl, mediaIndex) => ({
      key: `${content.id}:${mediaIndex}:${mediaUrl}`,
      id: content.id,
      title: content.title || '无标题',
      mediaUrl: toAbsoluteMediaUrl(mediaUrl),
    })))
}
