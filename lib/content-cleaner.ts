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
  let skipUntilBlank = false

  // UI noise patterns to skip
  const noisePatterns = [
    "Don't miss what's happening",
    'People on X are the first to know.',
    'Log in',
    'Sign up',
    'Post',
    'See new posts',
    'New to X?',
    'Sign up now to get your own personalized timeline!',
    'Sign up with Apple',
    'Create account',
    'Trending now',
    "What's happening",
    'Show more',
    'Terms of Service',
    'Privacy Policy',
    'Cookie Policy',
    'Accessibility',
    'Ads info',
    'More',
    'Translate post',
    'By signing up, you agree',
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) {
      cleaned.push(lines[i])
      continue
    }

    // Skip common Twitter UI elements
    if (
      noisePatterns.includes(line) ||
      line.match(/^Read \d+ repl(y|ies)$/i) ||
      line.match(/^© \d{4} X Corp\.?$/i) ||
      line.match(/^Sports · Trending$/i) ||
      line.match(/^Trending (in|with)/i) ||
      line === '|'
    ) {
      skipUntilBlank = true
      continue
    }

    // Skip blank lines after UI elements
    if (skipUntilBlank) {
      if (line === '') {
        skipUntilBlank = false
      }
      continue
    }

    // Skip "Image X:" labels but keep the actual content
    if (line.match(/^Image \d+:/)) {
      continue
    }

    // Keep everything else
    cleaned.push(lines[i])
  }

  const result = cleaned.join('\n').trim()
  
  // If cleaning removed everything, return original text
  // This prevents accidentally removing all content
  if (!result || result.length < 50) {
    return text
  }

  return result
}
