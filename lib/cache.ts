/**
 * 缓存配置
 * 
 * 使用 Next.js 的缓存机制优化性能
 */

/**
 * 静态页面缓存时间（秒）
 */
export const STATIC_CACHE_TIME = 60 * 60 * 24 // 24 小时

/**
 * API 响应缓存时间（秒）
 */
export const API_CACHE_TIME = 60 * 5 // 5 分钟

/**
 * 媒体文件缓存时间（秒）
 */
export const MEDIA_CACHE_TIME = 60 * 60 * 24 * 7 // 7 天

/**
 * 重新验证时间（秒）
 * 
 * ISR (Incremental Static Regeneration) 配置
 */
export const REVALIDATE_TIME = 60 * 10 // 10 分钟

/**
 * 缓存标签
 * 
 * 用于按需重新验证
 */
export const CACHE_TAGS = {
  CONTENT: 'content',
  ADULT_CONTENT: 'adult-content',
  STATS: 'stats',
  PREFERENCES: 'preferences',
} as const

/**
 * 获取缓存控制头
 */
export function getCacheHeaders(maxAge: number, staleWhileRevalidate?: number) {
  const swr = staleWhileRevalidate ?? maxAge * 2
  return {
    'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${swr}`,
  }
}

/**
 * 获取不缓存的头
 */
export function getNoCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}
