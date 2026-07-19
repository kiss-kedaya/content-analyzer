import type { CachedMediaItem } from '@/lib/media-cache'
import { parseTwitterUrl } from '@/lib/twitter-url-utils'

const DEFAULT_X_API_BASE_URL = 'https://api.x.com/2'

export interface XApiMediaVariant {
  bit_rate?: number
  content_type?: string
  url?: string
}

export interface XApiMediaEntity {
  media_key?: string
  type?: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
  variants?: XApiMediaVariant[]
  width?: number
  height?: number
}

export interface XApiPostMediaPayload {
  data?: {
    id?: string
    attachments?: { media_keys?: string[] }
  }
  includes?: { media?: XApiMediaEntity[] }
  errors?: Array<{ detail?: string; title?: string }>
}

export interface XApiMediaExtractionResult {
  media: CachedMediaItem[]
  rawResponse: XApiPostMediaPayload
}

type VariantWithSize = XApiMediaVariant & { url: string; width?: number; height?: number }

function variantWithSize(variant: XApiMediaVariant): VariantWithSize | null {
  if (variant.content_type !== 'video/mp4' || !variant.url) return null
  const match = new URL(variant.url).pathname.match(/\/(\d+)x(\d+)\//)
  return {
    ...variant,
    url: variant.url,
    width: match ? Number(match[1]) : undefined,
    height: match ? Number(match[2]) : undefined,
  }
}

/** Prefer a mobile-safe MP4 while retaining the best bitrate within that tier. */
export function selectBestXVideoVariant(variants: XApiMediaVariant[] = []): VariantWithSize | null {
  const mp4 = variants.map(variantWithSize).filter(Boolean) as VariantWithSize[]
  if (mp4.length === 0) return null

  const mobileSafe = mp4.filter((variant) => {
    if (!variant.width || !variant.height) return false
    return Math.max(variant.width, variant.height) <= 1280 && (!variant.bit_rate || variant.bit_rate <= 5_000_000)
  })
  const candidates = mobileSafe.length > 0 ? mobileSafe : mp4

  return candidates.sort((a, b) => {
    const bitrate = (b.bit_rate || 0) - (a.bit_rate || 0)
    if (bitrate !== 0) return bitrate
    return ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0))
  })[0]
}

export function parseXApiMediaPayload(payload: XApiPostMediaPayload): CachedMediaItem[] {
  const mediaByKey = new Map(
    (payload.includes?.media || [])
      .filter((item): item is XApiMediaEntity & { media_key: string } => Boolean(item.media_key))
      .map((item) => [item.media_key, item]),
  )
  const keys = payload.data?.attachments?.media_keys || []
  const ordered = keys.length > 0
    ? keys.map((key) => mediaByKey.get(key)).filter(Boolean) as XApiMediaEntity[]
    : payload.includes?.media || []

  return ordered.flatMap((item): CachedMediaItem[] => {
    if (item.type === 'photo' && item.url) {
      return [{ type: 'image', url: item.url, sourceUrl: item.url, format: 'image' }]
    }

    if (item.type === 'video' || item.type === 'animated_gif') {
      const variant = selectBestXVideoVariant(item.variants)
      if (!variant) return []
      const quality = variant.width && variant.height ? `${variant.width}x${variant.height}` : undefined
      return [{
        type: 'video',
        url: variant.url,
        sourceUrl: variant.url,
        quality,
        format: 'mp4',
      }]
    }

    return []
  })
}

export function hasXApiMediaToken(): boolean {
  return Boolean((process.env.X_API_BEARER_TOKEN || process.env.X_API_ACCESS_TOKEN || '').trim())
}

export async function extractWithXApiDetailed(
  postUrl: string,
  options: {
    signal?: AbortSignal
    bearerToken?: string
    fetchImpl?: typeof fetch
    baseUrl?: string
  } = {},
): Promise<XApiMediaExtractionResult> {
  const post = parseTwitterUrl(postUrl)
  if (!post?.statusId) throw new Error('Invalid Twitter/X status URL')

  const bearerToken = (options.bearerToken || process.env.X_API_BEARER_TOKEN || process.env.X_API_ACCESS_TOKEN || '').trim()
  if (!bearerToken) throw new Error('X API media token is not configured')

  const params = new URLSearchParams({
    expansions: 'attachments.media_keys',
    'tweet.fields': 'attachments',
    'media.fields': 'media_key,type,url,preview_image_url,variants,width,height',
  })
  const baseUrl = (options.baseUrl || process.env.X_API_BASE_URL || DEFAULT_X_API_BASE_URL).replace(/\/$/, '')
  const response = await (options.fetchImpl || fetch)(`${baseUrl}/tweets/${post.statusId}?${params}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${bearerToken}`,
    },
    signal: options.signal,
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => ({})) as XApiPostMediaPayload
  if (!response.ok) {
    const detail = payload.errors?.[0]?.detail || payload.errors?.[0]?.title
    throw new Error(`X API media request failed: ${response.status}${detail ? ` (${detail})` : ''}`)
  }

  return { media: parseXApiMediaPayload(payload), rawResponse: payload }
}
