import { parseXApiMediaPayload, type XApiMediaEntity } from './media-extractor-x-api'
import { normalizePersistentMediaUrls } from './persistent-media'

export interface XBookmarkPost {
  id: string
  text?: string
  url?: string
  author_id?: string
  created_at?: string
  possibly_sensitive?: boolean
  attachments?: { media_keys?: string[] }
}

export interface XBookmarkUser {
  id: string
  name?: string
  username?: string
}

export interface XBookmarksPayload {
  data?: XBookmarkPost[]
  includes?: { users?: XBookmarkUser[]; media?: XApiMediaEntity[] }
}

export interface BookmarkImportItem {
  source: 'X'
  url: string
  title: string
  content: string
  /** Legacy database compatibility; this is the original post text, not an AI summary. */
  summary: string
  /** Legacy database compatibility; scoring is disabled. */
  score: 0
  analyzedBy?: string
  sourceTime?: number
  mediaUrls?: string[]
}

export interface TransformedBookmarks {
  content: BookmarkImportItem[]
  adultContent: BookmarkImportItem[]
}

const ADULT_TEXT_PATTERN = /(?:自慰|做爱|性爱|口交|肛交|性交|内射|射精|榨精|高潮|潮喷|性瘾|约炮|炮友|阴道|阴蒂|乳交|鸡巴|肉棒|嫩穴|骚穴|骚逼|骚货|骚狗|少妇|裸舞|脱衣|避孕套|飞机杯|露出|床上功夫|福利姬|女优|无码|色情|涩涩|黄油|国产自拍|成人视频|看片)|\b(?:porn|nsfw|xxx|hentai|chudai|wataa|nudes?|naked|blowjob|handjob|cuckold|milf|pussy|cock|cumshot|fuck(?:ing|ed)?)\b/i
const ADULT_AUTHOR_PATTERN = /(?:sexy|porn|nsfw|xxx|hentai|adult|milf)/i

/** X's possibly_sensitive flag is incomplete, especially on reposts. */
export function hasAdultXSignals(post: XBookmarkPost, user?: XBookmarkUser): boolean {
  const text = post.text || ''
  const author = `${user?.name || ''} ${user?.username || ''}`
  return ADULT_TEXT_PATTERN.test(text) || ADULT_AUTHOR_PATTERN.test(author)
}

function usernameFromUrl(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const match = new URL(value).pathname.match(/^\/([^/]+)\/status\//)
    return match?.[1]
  } catch {
    return undefined
  }
}

export function transformXBookmarks(payload: XBookmarksPayload): TransformedBookmarks {
  const users = new Map((payload.includes?.users || []).map((user) => [user.id, user]))
  const adultAuthorIds = new Set(
    (payload.data || [])
      .filter((post) => post.author_id && hasAdultXSignals(post, users.get(post.author_id)))
      .map((post) => post.author_id as string),
  )
  const regular: BookmarkImportItem[] = []
  const adult: BookmarkImportItem[] = []
  const seen = new Set<string>()

  for (const post of payload.data || []) {
    if (!post?.id) continue
    const user = post.author_id ? users.get(post.author_id) : undefined
    const username = user?.username || usernameFromUrl(post.url)
    const url = post.url || `https://x.com/i/status/${post.id}`
    if (seen.has(url)) continue
    seen.add(url)

    const text = post.text?.trim() || url
    const sourceTime = post.created_at ? Date.parse(post.created_at) : Number.NaN
    const title = user?.name && username
      ? `${user.name} (@${username})`
      : username
        ? `@${username}`
        : 'X 书签'
    const extractedMedia = parseXApiMediaPayload({
      data: { id: post.id, attachments: post.attachments },
      includes: { media: payload.includes?.media },
    })
    const mediaUrls = normalizePersistentMediaUrls(
      extractedMedia.map((media) => media.sourceUrl || media.url),
    )

    const item: BookmarkImportItem = {
      source: 'X',
      url,
      title: title.slice(0, 200),
      content: text,
      summary: text,
      score: 0,
      analyzedBy: username,
      sourceTime: Number.isFinite(sourceTime) ? sourceTime : undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    }

    const isAdult = post.possibly_sensitive === true
      || hasAdultXSignals(post, user)
      || Boolean(post.author_id && adultAuthorIds.has(post.author_id))

    if (isAdult) adult.push(item)
    else regular.push(item)
  }

  // Batch endpoints write sequentially. Oldest-first insertion preserves the
  // X bookmark response order when the application displays createdAt desc.
  return {
    content: regular.reverse(),
    adultContent: adult.reverse(),
  }
}
