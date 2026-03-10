/**
 * Clean up jina.ai content for Twitter/X posts
 * Removes navigation, sidebars, footers, and other noise
 */
export function cleanTwitterContent(text: string): string {
  if (!text) return text

  // Check if this is Twitter/X content
  const isTwitter = text.includes('x.com') || text.includes('twitter.com') || text.includes('/ X')

  if (!isTwitter) return text

  const lines = text.split('\n')
  const cleaned: string[] = []
  let inConversation = false
  let skipUntilBlank = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip common Twitter UI elements
    if (
      line === "Don't miss what's happening" ||
      line === 'People on X are the first to know.' ||
      line === 'Log in' ||
      line === 'Sign up' ||
      line === 'Post' ||
      line === 'See new posts' ||
      line === 'New to X?' ||
      line === 'Sign up now to get your own personalized timeline!' ||
      line === 'Sign up with Apple' ||
      line === 'Create account' ||
      line === 'Trending now' ||
      line === "What's happening" ||
      line === 'Show more' ||
      line === 'Terms of Service' ||
      line === 'Privacy Policy' ||
      line === 'Cookie Policy' ||
      line === 'Accessibility' ||
      line === 'Ads info' ||
      line === 'More' ||
      line === 'Translate post' ||
      line === 'Read 28 replies' ||
      line.match(/^Read \d+ repl(y|ies)$/) ||
      line.match(/^© \d{4} X Corp\.?$/) ||
      line.match(/^Sports · Trending$/) ||
      line.match(/^Trending (in|with)/) ||
      line === '|'
    ) {
      skipUntilBlank = true
      continue
    }

    // Start capturing after "Conversation"
    if (line === 'Conversation') {
      inConversation = true
      continue
    }

    // Stop at "New to X?" or similar sections
    if (
      line === 'New to X?' ||
      line === 'Trending now' ||
      line.includes('By signing up, you agree')
    ) {
      break
    }

    // Skip blank lines after UI elements
    if (skipUntilBlank) {
      if (line === '') {
        skipUntilBlank = false
      }
      continue
    }

    // Only capture content after "Conversation" section
    if (inConversation && line) {
      // Skip profile images and user handles (they're usually just links)
      if (line.startsWith('Image ') && line.includes(':')) {
        continue
      }

      // Skip standalone @ mentions
      if (line.match(/^@\w+$/)) {
        continue
      }

      // Skip view counts and timestamps alone
      if (line.match(/^\d+(\.\d+)?[KMB]? (Views?|查看)$/)) {
        continue
      }

      // Skip standalone numbers (likes, retweets, etc.)
      if (line.match(/^\d+$/)) {
        continue
      }

      cleaned.push(lines[i]) // Keep original line with formatting
    }
  }

  return cleaned.join('\n').trim()
}
