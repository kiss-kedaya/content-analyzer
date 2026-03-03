/**
 * Twitter/X URL 工具函数
 * 支持 twitter.com 和 x.com 两种格式
 */

/**
 * 验证是否为有效的 Twitter/X URL
 */
export function isValidTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (
      (urlObj.hostname === 'twitter.com' || 
       urlObj.hostname === 'x.com' ||
       urlObj.hostname === 'www.twitter.com' ||
       urlObj.hostname === 'www.x.com') &&
      urlObj.pathname.includes('/status/')
    )
  } catch {
    return false
  }
}

/**
 * 将 x.com 转换为 twitter.com
 * yt-dlp 可能需要 twitter.com 格式
 */
export function normalizeToTwitter(url: string): string {
  if (!isValidTwitterUrl(url)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  return url
    .replace('https://x.com/', 'https://twitter.com/')
    .replace('https://www.x.com/', 'https://twitter.com/')
    .replace('http://x.com/', 'https://twitter.com/')
    .replace('http://www.x.com/', 'https://twitter.com/')
}

/**
 * 将 twitter.com 转换为 x.com
 */
export function normalizeToX(url: string): string {
  if (!isValidTwitterUrl(url)) {
    throw new Error('Invalid Twitter/X URL')
  }
  
  return url
    .replace('https://twitter.com/', 'https://x.com/')
    .replace('https://www.twitter.com/', 'https://x.com/')
    .replace('http://twitter.com/', 'https://x.com/')
    .replace('http://www.twitter.com/', 'https://x.com/')
}

/**
 * 从 URL 提取用户名和状态 ID
 */
export function parseTwitterUrl(url: string): {
  username: string
  statusId: string
} | null {
  if (!isValidTwitterUrl(url)) {
    return null
  }
  
  try {
    const urlObj = new URL(url)
    const parts = urlObj.pathname.split('/')
    const statusIndex = parts.indexOf('status')
    
    if (statusIndex === -1 || statusIndex === 0) {
      return null
    }
    
    const username = parts[statusIndex - 1]
    const statusId = parts[statusIndex + 1]
    
    if (!username || !statusId) {
      return null
    }
    
    return { username, statusId }
  } catch {
    return null
  }
}

/**
 * 构建 Twitter URL
 */
export function buildTwitterUrl(username: string, statusId: string, useX: boolean = true): string {
  const domain = useX ? 'x.com' : 'twitter.com'
  return `https://${domain}/${username}/status/${statusId}`
}
