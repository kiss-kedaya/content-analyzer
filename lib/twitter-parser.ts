/**
 * Parse Twitter/X content from jina.ai response
 * Extracts structured tweet data for rendering
 */

export interface TwitterTweetData {
  author: {
    name: string
    handle: string
    avatar: string
    verified: boolean
  }
  content: {
    text: string
    images: string[]
    timestamp: string
    url: string
  }
  stats: {
    replies: number
    retweets: number
    likes: number
    bookmarks: number
    views: number
  }
}

export function parseTwitterContent(text: string, url: string): TwitterTweetData | null {
  if (!text || !url) return null

  // Check if this is Twitter/X content
  const isTwitter = url.includes('x.com') || url.includes('twitter.com')
  if (!isTwitter) return null

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Extract author info
  let authorName = ''
  let authorHandle = ''
  let authorAvatar = ''
  let verified = false

  // Extract tweet content
  let tweetText = ''
  const images: string[] = []
  let timestamp = ''
  let tweetUrl = url

  // Extract stats
  let replies = 0
  let retweets = 0
  let likes = 0
  let bookmarks = 0
  let views = 0

  // Parse line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Extract author handle (@username)
    if (line.startsWith('@') && !authorHandle) {
      authorHandle = line
      // Author name is usually the line before @handle
      if (i > 0 && !lines[i - 1].startsWith('http') && !lines[i - 1].includes('Image')) {
        authorName = lines[i - 1]
      }
    }

    // Extract avatar URL
    if (line.includes('pbs.twimg.com/profile_images') && !authorAvatar) {
      authorAvatar = line
    }

    // Check if verified
    if (line.includes('认证账号') || line.includes('Verified')) {
      verified = true
    }

    // Extract timestamp
    if (line.match(/\d{1,2}:\d{2} (AM|PM) · \w+ \d{1,2}, \d{4}/) || 
        line.match(/(上午|下午)\d{1,2}:\d{2} · \d{4}年\d{1,2}月\d{1,2}日/)) {
      timestamp = line
    }

    // Extract images
    if (line.includes('pbs.twimg.com/media/') && !line.includes('profile_images')) {
      images.push(line)
    }

    // Extract stats
    const repliesMatch = line.match(/(\d+)\s*(回复|replies?)/i)
    if (repliesMatch) replies = parseInt(repliesMatch[1])

    const retweetsMatch = line.match(/(\d+)\s*(次转帖|retweets?)/i)
    if (retweetsMatch) retweets = parseInt(retweetsMatch[1])

    const likesMatch = line.match(/(\d+)\s*(喜欢|likes?)/i)
    if (likesMatch) likes = parseInt(likesMatch[1])

    const bookmarksMatch = line.match(/(\d+)\s*(书签|bookmarks?)/i)
    if (bookmarksMatch) bookmarks = parseInt(bookmarksMatch[1])

    const viewsMatch = line.match(/([\d.]+)([KMB万]?)\s*(Views?|查看)/i)
    if (viewsMatch) {
      let num = parseFloat(viewsMatch[1])
      const unit = viewsMatch[2]
      if (unit === 'K' || unit === '千') num *= 1000
      else if (unit === 'M' || unit === '百万') num *= 1000000
      else if (unit === 'B' || unit === '十亿') num *= 1000000000
      else if (unit === '万') num *= 10000
      views = Math.floor(num)
    }
  }

  // Extract main tweet text (between author info and images/stats)
  // Look for the longest continuous text block
  let maxTextBlock = ''
  let currentBlock = ''
  let inTweetContent = false

  for (const line of lines) {
    // Start capturing after author handle
    if (line === authorHandle) {
      inTweetContent = true
      continue
    }

    // Stop at images or stats
    if (line.includes('pbs.twimg.com') || 
        line.match(/\d+\s*(回复|replies|转帖|retweets|喜欢|likes|书签|bookmarks|查看|views)/i) ||
        line.includes('Translate post') ||
        line.includes('翻译推文')) {
      if (currentBlock.length > maxTextBlock.length) {
        maxTextBlock = currentBlock
      }
      currentBlock = ''
      inTweetContent = false
      continue
    }

    if (inTweetContent && line && !line.startsWith('http') && !line.includes('Image')) {
      currentBlock += (currentBlock ? '\n' : '') + line
    }
  }

  if (currentBlock.length > maxTextBlock.length) {
    maxTextBlock = currentBlock
  }

  tweetText = maxTextBlock.trim()

  // Fallback: if no author name found, try to extract from URL
  if (!authorName && url.includes('x.com/')) {
    const match = url.match(/x\.com\/([^/]+)/)
    if (match) {
      authorHandle = '@' + match[1]
      authorName = match[1]
    }
  }

  // Validate we have minimum required data
  if (!tweetText || !authorHandle) {
    return null
  }

  return {
    author: {
      name: authorName || authorHandle.replace('@', ''),
      handle: authorHandle,
      avatar: authorAvatar,
      verified
    },
    content: {
      text: tweetText,
      images,
      timestamp,
      url: tweetUrl
    },
    stats: {
      replies,
      retweets,
      likes,
      bookmarks,
      views
    }
  }
}
