/**
 * 统一的 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T, pagination?: ApiResponse['pagination']): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(pagination && { pagination })
  }
}

/**
 * 创建错误响应
 */
export function errorResponse(
  message: string,
  code: string,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && details && { details })
    }
  }
}

/**
 * 错误代码常量
 */
export const ErrorCodes = {
  // 认证错误
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  
  // 资源错误
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // 服务器错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // 速率限制
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const

import { logApiError } from './logger'

/**
 * 日志记录辅助函数
 */
export function logError(context: string, error: unknown, metadata?: Record<string, any>) {
  logApiError(context, error, metadata)
}
