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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

  function stripMarkdownInline(input: string): string {
    if (!input) return input

    // ![alt](url) -> alt
    let out = input.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')

    // [text](url) -> text
    out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')

    // **bold** / __bold__ -> bold
    out = out.replace(/\*\*([^*]+)\*\*/g, '$1')
    out = out.replace(/__([^_]+)__/g, '$1')

    // *italic* / _italic_ -> italic
    out = out.replace(/\*([^*]+)\*/g, '$1')
    out = out.replace(/_([^_]+)_/g, '$1')

    // Inline code `x`
    out = out.replace(/`([^`]+)`/g, '$1')

    return out.trim()
  }

  // First pass: extract metadata
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Extract author name + handle from defuddle-style first line: "Name @handle"
    if (!authorHandle) {
      const inlineHandle = line.match(/^(.+?)\s+(@[A-Za-z0-9_]{1,15})$/)
      if (inlineHandle) {
        authorName = stripMarkdownInline(inlineHandle[1].trim())
        authorHandle = inlineHandle[2]
      }
    }

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
  
  // Check if Title text is truncated by comparing with Conversation section
  // Extract a preview of Conversation text to compare
  let conversationPreview = ''
  let foundConv = false
  let foundAuth = false
  let previewLines: string[] = []
  
  for (let i = 0; i < lines.length && previewLines.length < 50; i++) {
    const line = lines[i]
    if (line === 'Conversation' || line.includes('Conversation')) {
      foundConv = true
      continue
    }
    if (!foundConv) continue
    
    if (!foundAuth) {
      if (line.match(/^[=-]+$/) || line.includes('pbs.twimg.com/profile_images') || 
          line.match(/^\[.*?\]\(https:\/\/(x\.com|twitter\.com)\//)) {
        continue
      }
      if (line && !line.startsWith('[') && !line.startsWith('http')) {
        foundAuth = true
      } else {
        continue
      }
    }
    
    if (line.includes('Translate post') || line.includes('pbs.twimg.com/media/')) break
    if (foundAuth && line && !line.startsWith('http') && !line.match(/^Image \d+:/)) {
      previewLines.push(line)
    }
  }
  
  conversationPreview = previewLines.join(' ').trim()
  
  // Title is truncated if Conversation has significantly more content
  const isTitleTruncated = conversationPreview.length > titleText.length * 1.5
  
  // If Title text is substantial and not truncated, use it
  if (titleText.length > 100 && !isTitleTruncated) {
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
        // Skip Image labels (non-content) and media-only markdown images
        if (line.match(/^Image \d+:/)) {
          continue
        }

        // Convert inline emoji markdown images to their alt text, keep the rest of the line
        // Example: "• ![Image 6: 🎮](...emoji...) 多人游戏" -> "• 🎮 多人游戏"
        let normalizedLine = line
        if (normalizedLine.includes('abs-0.twimg.com/emoji') || normalizedLine.includes('emoji/v2/svg')) {
          normalizedLine = normalizedLine.replace(/!\[Image\s+\d+:\s*([^\]]+)\]\([^)]*\)/g, '$1')
        }

        // Drop media markdown images if a line is only an image
        // Example: "![Image 2](https://pbs.twimg.com/media/...)"
        if (normalizedLine.match(/^!\[Image \d+\]\(https:\/\/pbs\.twimg\.com\/(media|amplify_video_thumb)\//)) {
          continue
        }

        // Keep URLs if they are part of the content (some tweets have standalone URL lines)
        contentLines.push(normalizedLine)
      }
    }
    
    conversationText = contentLines.join('\n').trim()
    
    // Use conversation text and apply intelligent formatting to restore paragraph/list structure
    tweetText = conversationText
    if (tweetText) {
      const workspaceApps = ['Gmail', 'Drive', 'Docs', 'Sheets', 'Calendar', 'Chat']

      // 1) Normalize whitespace first
      tweetText = tweetText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')

      // 2) Force section breaks for common patterns (when content is flattened)
      // Keep "Google Workspace CLI" as a standalone block if it appears.
      tweetText = tweetText.replace(/\s*(Google Workspace CLI)\s*/g, '\n\n$1\n\n')

      // 3) Split bullet and arrow lists
      // Ensure every bullet/arrow starts at the beginning of a line.
      tweetText = tweetText
        .replace(/\s*•\s*/g, '\n• ')
        .replace(/\s*→\s*/g, '\n→ ')

      // 4) Ensure question/section headers create paragraph breaks (generic)
      const paragraphHeads = [
        '几个关键点很有意思：',
        '这意味着什么？',
        'AI Agent 可以直接：',
        '未来的办公流可能是：',
        '最骚的演示：',
        '适用场景：',
        '开源地址：',
        '来源：',
      ]
      for (const h of paragraphHeads) {
        // add blank line before heading if it is glued to previous text
        tweetText = tweetText.replace(new RegExp(`([^\n])\s*(${escapeRegExp(h)})`, 'g'), `$1\n\n$2`)
        // ensure blank line after heading
        tweetText = tweetText.replace(new RegExp(`${escapeRegExp(h)}\s*`, 'g'), `${h}\n\n`)
      }

      // 5) Split known app names into one-per-line after "整个 Google Workspace："
      tweetText = tweetText.replace(/(整个 Google Workspace：)\s*([A-Za-z][A-Za-z0-9+.-]*(?:\s+[A-Za-z][A-Za-z0-9+.-]*)*)/g, (_, head: string, list: string) => {
        const tokens = list.split(/\s+/).filter(Boolean)
        const allKnown = tokens.length >= 3 && tokens.every(t => workspaceApps.includes(t))
        if (!allKnown) return `${head}\n${list}`
        return `${head}\n${tokens.join('\n')}`
      })

      // 6) Add paragraph breaks after major sentence boundaries when next phrase is a new section
      tweetText = tweetText
        .replace(/([。！？])\s*(几个关键点很有意思：)/g, '$1\n\n$2')
        .replace(/([。！？])\s*(这意味着什么？)/g, '$1\n\n$2')
        .replace(/([。！？])\s*(适用场景：)/g, '$1\n\n$2')
        .replace(/([。！？])\s*(开源地址：)/g, '$1\n\n$2')
        .replace(/([。！？])\s*(来源：)/g, '$1\n\n$2')
        .replace(/([。！？])\s*(整个)/g, '$1\n\n$2')
        .replace(/([。！？])\s*(未来)/g, '$1\n\n$2')

      // 7) Convert markdown links to plain URL when it is a naked link
      tweetText = tweetText.replace(/\[https?:\/\/[^\]]+\]\((https?:\/\/[^)]+)\)/g, '$1')

      // 8) Clean up: remove leading spaces after newlines, normalize blank lines
      tweetText = tweetText
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      // 9) Ensure the content starts without a leading blank line
      tweetText = tweetText.replace(/^\n+/, '')
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

  function extractDefuddlePlainTweet(linesInput: string[]): string {
    // For defuddle/jina plain text, try to take everything after the author line,
    // stopping before the first image markdown or obvious metadata.
    const stopPatterns: RegExp[] = [
      /^!\[\]\(/,                       // markdown image
      /^\[!\[.*\]\(/,                  // linked image
      /^https?:\/\//,                    // url block
      /^Read \d+ repl/i,                  // read replies
      /^Translate post/i,
      /^翻译推文/, 
      /\b(replies|retweets|likes|views)\b/i,
      /\b(回复|转帖|喜欢|查看)\b/,
    ]

    const isStop = (l: string) => stopPatterns.some((re) => re.test(l))

    // Find author line index.
    let start = -1
    for (let i = 0; i < linesInput.length; i++) {
      const l = linesInput[i]
      if (!l) continue
      if (authorHandle && l.includes(authorHandle)) {
        start = i + 1
        break
      }
      if (l.match(/^.+?\s+@[A-Za-z0-9_]{1,15}$/)) {
        start = i + 1
        break
      }
      if (l.startsWith('@') && l.length < 30) {
        start = i + 1
        break
      }
    }

    if (start < 0) return ''

    const out: string[] = []
    for (let i = start; i < linesInput.length; i++) {
      const l = linesInput[i]
      if (!l) {
        // keep paragraph breaks but avoid leading blanks
        if (out.length > 0 && out[out.length - 1] !== '') out.push('')
        continue
      }

      if (isStop(l)) break

      out.push(l)
    }

    return out.join('\n').trim()
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

    // Additional fallback for defuddle plain format
    if (!tweetText) {
      tweetText = extractDefuddlePlainTweet(lines)
    }
  }

  // If tweetText exists but is suspiciously short, try to use defuddle plain format.
  if (tweetText && tweetText.length < 120) {
    const candidate = extractDefuddlePlainTweet(lines)
    if (candidate && candidate.length > tweetText.length * 2) {
      tweetText = candidate
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
