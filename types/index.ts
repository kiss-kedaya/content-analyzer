/**
 * 通用类型定义
 */

/**
 * 内容基础类型
 */
export interface BaseContent {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  content: string
  score: number
  analyzedAt: Date
  analyzedBy?: string | null
  createdAt: Date
  updatedAt: Date
  favorited: boolean
  favoritedAt?: Date | null
}

/**
 * 技术内容类型
 */
export interface Content extends BaseContent {
  sourceTime?: Date | null
}

/**
 * 成人内容类型
 */
export interface AdultContent extends BaseContent {}

/**
 * 媒体信息类型
 */
export interface MediaInfo {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
  width?: number
  height?: number
  format?: string
  quality?: string
}

/**
 * 分页参数类型
 */
export interface PaginationParams {
  page: number
  pageSize: number
  orderBy: 'score' | 'createdAt' | 'analyzedAt'
}

/**
 * 分页响应类型
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  pagination?: PaginationMeta
}

/**
 * 统计数据类型
 */
export interface Stats {
  techCount: number
  adultCount: number
  totalCount: number
  avgScore: number
  favoritedCount: number
}

/**
 * 用户偏好类型
 */
export interface UserPreferences {
  defaultTab: 'tech' | 'adult'
  defaultOrderBy: 'score' | 'createdAt' | 'analyzedAt'
  itemsPerPage: number
}
