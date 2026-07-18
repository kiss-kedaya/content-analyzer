export interface XBookmarkPost {
  id: string
  text?: string
  url?: string
  author_id?: string
  created_at?: string
  possibly_sensitive?: boolean
}

export interface XBookmarkUser {
  id: string
  name?: string
  username?: string
}

export interface XBookmarksPayload {
  data?: XBookmarkPost[]
  includes?: { users?: XBookmarkUser[] }
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
}

export interface TransformedBookmarks {
  content: BookmarkImportItem[]
  adultContent: BookmarkImportItem[]
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

    const item: BookmarkImportItem = {
      source: 'X',
      url,
      title: title.slice(0, 200),
      content: text,
      summary: text,
      score: 0,
      analyzedBy: username,
      sourceTime: Number.isFinite(sourceTime) ? sourceTime : undefined,
    }

    if (post.possibly_sensitive === true) adult.push(item)
    else regular.push(item)
  }

  // Batch endpoints write sequentially. Oldest-first insertion preserves the
  // X bookmark response order when the application displays createdAt desc.
  return {
    content: regular.reverse(),
    adultContent: adult.reverse(),
  }
}
