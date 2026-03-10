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

  const lines = text.split('\n').map(l => l.trim())

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

  // First pass: extract metadata
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Extract author handle (@username)
    if (line.startsWith('@') && line.length < 30 && !authorHandle) {
      authorHandle = line
      // Author name is usually the line before @handle
      if (i > 0 && !lines[i - 1].startsWith('http') && !lines[i - 1].includes('Image')) {
        authorName = lines[i - 1]
      }
    }

    // Extract avatar URL (including from Markdown image syntax)
    if (line.includes('pbs.twimg.com/profile_images') && !authorAvatar) {
      // Try to extract from Markdown image syntax: [![Image X](URL)](link)
      let urlMatch = line.match(/!\[.*?\]\((https:\/\/pbs\.twimg\.com\/profile_images\/[^\s)]+)\)/)
      if (!urlMatch) {
        // Try simple URL extraction
        urlMatch = line.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^\s)]+/)
      }
      if (urlMatch) {
        authorAvatar = urlMatch[1] || urlMatch[0]
      }
    }

    // Check if verified
    if (line.includes('认证账号') || line.includes('Verified') || line.includes('icon-verified')) {
      verified = true
    }

    // Extract timestamp
    if (line.match(/\d{1,2}:\d{2} (AM|PM) · \w+ \d{1,2}, \d{4}/) || 
        line.match(/(上午|下午)\d{1,2}:\d{2} · \d{4}年\d{1,2}月\d{1,2}日/)) {
      timestamp = line
    }

    // Extract images (media URLs and video thumbnails, not profile images)
    if (line.includes('pbs.twimg.com/media/') || line.includes('pbs.twimg.com/amplify_video_thumb/')) {
      // Extract URL from Markdown syntax if present
      const urlMatch = line.match(/https:\/\/pbs\.twimg\.com\/(media|amplify_video_thumb)\/[^\s)]+/)
      if (urlMatch) {
        images.push(urlMatch[0])
      }
    }

    // Extract stats
    const repliesMatch = line.match(/(\d+)\s*(回复|replies?)/i)
    if (repliesMatch) replies = parseInt(repliesMatch[1])

    const retweetsMatch = line.match(/(\d+)\s*(次转帖|转帖|retweets?)/i)
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

  // Second pass: extract main tweet text
  // Strategy 1: Try to extract from Title section (preserves original line breaks)
  // Strategy 2: Fall back to Conversation section if Title is incomplete
  
  let titleText = ''
  let conversationText = ''
  let inTitle = false
  let foundConversation = false
  let foundAuthor = false
  let contentLines: string[] = []
  
  // First, try to extract from Title section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Look for Title marker
    if (line.startsWith('Title:')) {
      inTitle = true
      // Extract text after "Title: author on X: "
      const titleMatch = line.match(/Title:\s*.*?\s+on\s+X:\s+"(.*)/)
      if (titleMatch) {
        titleText = titleMatch[1]
      }
      continue
    }
    
    // Collect lines until we hit URL Source or Markdown Content
    if (inTitle) {
      if (line.startsWith('URL Source:') || line.startsWith('Markdown Content:')) {
        inTitle = false
        break
      }
      // Skip the closing quote and " / X" at the end
      if (line.endsWith('" / X')) {
        titleText += '\n' + line.replace(/"\s*\/\s*X$/, '')
        break
      }
      titleText += '\n' + line
    }
  }
  
  titleText = titleText.trim()
  
  // If Title text is substantial (> 100 chars), use it
  if (titleText.length > 100) {
    tweetText = titleText
  } else {
    // Fall back to Conversation section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Look for "Conversation" marker
      if (line === 'Conversation' || line.includes('Conversation')) {
        foundConversation = true
        continue
      }
      
      // Skip until we find the conversation section
      if (!foundConversation) {
        continue
      }
      
      // Skip author info lines after Conversation
      if (!foundAuthor) {
        // Skip separator lines (= or -)
        if (line.match(/^[=-]+$/)) {
          continue
        }
        // Skip avatar/profile image links
        if (line.includes('pbs.twimg.com/profile_images')) {
          continue
        }
        // Skip author name and handle links (Markdown format)
        if (line.match(/^\[.*?\]\(https:\/\/(x\.com|twitter\.com)\//)) {
          continue
        }
        // Once we hit real content (not a link, not empty), mark author as found
        if (line && !line.startsWith('[') && !line.startsWith('http')) {
          foundAuthor = true
        } else {
          continue
        }
      }
      
      // Stop at various markers
      if (
        line.includes('Translate post') ||
        line.includes('翻译推文') ||
        line.includes('pbs.twimg.com/media/') ||
        line.includes('pbs.twimg.com/amplify_video_thumb/') ||
        line.match(/^\d{1,2}:\d{2} (AM|PM)/) || // Timestamp
        line.match(/^Read \d+ repl/i) ||
        line.includes('New to') ||
        line.includes('Sign up') ||
        line.includes('Create account') ||
        line.includes('Terms of Service')
      ) {
        break
      }
      
      // Collect content lines (including empty lines for paragraph breaks)
      if (foundAuthor) {
        // Skip URLs, Image labels, emoji images, and Markdown images
        if (line.startsWith('http://') || 
            line.startsWith('https://') || 
            line.match(/^Image \d+:/) ||
            line.match(/^!\[Image \d+\]/) ||
            line.includes('abs-0.twimg.com/emoji')) {
          continue
        }
        // Include the line (even if empty, for paragraph breaks)
        contentLines.push(line)
      }
    }
    
    conversationText = contentLines.join('\n').trim()
    
    // Use conversation text and apply intelligent line breaks
    tweetText = conversationText
    if (tweetText) {
      tweetText = tweetText
        // Add line break before bullet points (• or →) if not at start of line
        .replace(/([^\n])([•→])/g, '$1\n$2')
        // Add line break after colons followed by list items (for section headers)
        .replace(/：\s*\n/g, '：\n')
        // Clean up multiple consecutive line breaks
        .replace(/\n{3,}/g, '\n\n')
    }
  }

  // Fallback: if no author info found, try to extract from URL
  if (!authorName && url.includes('x.com/')) {
    const match = url.match(/x\.com\/([^/]+)/)
    if (match) {
      authorHandle = '@' + match[1]
      authorName = match[1]
    }
  }

  // Relaxed validation: only require tweet text OR author handle
  if (!tweetText && !authorHandle) {
    return null
  }

  // If we have handle but no text, try to extract from the full text
  if (!tweetText && authorHandle) {
    // Look for any substantial text block
    const textBlocks = text.split('\n\n').filter(block => 
      block.length > 50 && 
      !block.includes('http') && 
      !block.includes('Image') &&
      !block.includes('Sign up') &&
      !block.includes('Trending')
    )
    if (textBlocks.length > 0) {
      tweetText = textBlocks[0].trim()
    }
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
