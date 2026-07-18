const MEDIA_PROXY_ORIGIN = 'https://media.kedaya.xyz'
const HARD_UNAVAILABLE_STATUSES = new Set([403, 404, 410])
const MAX_VIDEO_URLS_PER_RECORD = 5

export type CleanupContentKind = 'content' | 'adultContent'
export type CleanupAssessmentState = 'unavailable' | 'available' | 'inconclusive' | 'no-video'

export interface StoredVideoUrl {
  storedUrl: string
  targetUrl: string
  probeUrl: string
}

export interface MediaProbeResult extends StoredVideoUrl {
  status: number | null
  error?: 'timeout' | 'network'
}

export interface XMediaAssessment {
  state: CleanupAssessmentState
  checks: MediaProbeResult[]
}

export type MediaProbe = (video: StoredVideoUrl) => Promise<MediaProbeResult>

function toAbsoluteUrl(value: string): string {
  return value.startsWith('//') ? `https:${value}` : value
}

function isTwitterVideoUrl(url: URL): boolean {
  return url.hostname.toLowerCase() === 'video.twimg.com'
}

export function parseStoredVideoUrl(value: string): StoredVideoUrl | null {
  if (!value || typeof value !== 'string') return null

  try {
    const stored = new URL(toAbsoluteUrl(value))
    const targetValue = stored.hostname.toLowerCase() === 'media.kedaya.xyz'
      ? stored.searchParams.get('url')
      : stored.toString()

    if (!targetValue) return null

    const target = new URL(toAbsoluteUrl(targetValue))
    if (!isTwitterVideoUrl(target)) return null

    const targetUrl = target.toString()
    return {
      storedUrl: value,
      targetUrl,
      probeUrl: `${MEDIA_PROXY_ORIGIN}/?url=${encodeURIComponent(targetUrl)}`,
    }
  } catch {
    return null
  }
}

export function collectStoredVideoUrls(mediaUrls: string[]): StoredVideoUrl[] {
  const seen = new Set<string>()
  const videos: StoredVideoUrl[] = []

  for (const value of mediaUrls) {
    const parsed = parseStoredVideoUrl(value)
    if (!parsed || seen.has(parsed.targetUrl)) continue

    seen.add(parsed.targetUrl)
    videos.push(parsed)
    if (videos.length >= MAX_VIDEO_URLS_PER_RECORD) break
  }

  return videos
}

export async function probeStoredVideo(video: StoredVideoUrl): Promise<MediaProbeResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(video.probeUrl, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        Range: 'bytes=0-0',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    })

    if (response.body) await response.body.cancel().catch(() => undefined)
    return { ...video, status: response.status }
  } catch (error) {
    return {
      ...video,
      status: null,
      error: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function assessStoredXMedia(
  mediaUrls: string[],
  probe: MediaProbe = probeStoredVideo,
): Promise<XMediaAssessment> {
  const videos = collectStoredVideoUrls(mediaUrls)
  if (videos.length === 0) return { state: 'no-video', checks: [] }

  const checks = await Promise.all(videos.map(probe))
  if (checks.some((check) => check.status !== null && check.status >= 200 && check.status < 400)) {
    return { state: 'available', checks }
  }

  if (checks.every((check) => check.status !== null && HARD_UNAVAILABLE_STATUSES.has(check.status))) {
    return { state: 'unavailable', checks }
  }

  return { state: 'inconclusive', checks }
}
