import pino from 'pino'
import { env } from './env'

/**
 * 全局日志实例
 * 
 * 使用 pino 作为日志库，提供结构化日志记录
 * 
 * 日志级别：
 * - trace: 最详细的日志，用于调试
 * - debug: 调试信息
 * - info: 一般信息
 * - warn: 警告信息
 * - error: 错误信息
 * - fatal: 致命错误
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // 开发环境使用 pretty 格式，生产环境使用 JSON 格式
  transport: env.NODE_ENV === 'development' 
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  
  // 基础字段
  base: {
    env: env.NODE_ENV,
  },
})

/**
 * 创建子日志实例
 * 
 * @param name - 日志名称（通常是模块名或功能名）
 * @returns 子日志实例
 * 
 * @example
 * const log = createLogger('api/content')
 * log.info('Content created', { id: '123' })
 */
export function createLogger(name: string) {
  return logger.child({ name })
}

/**
 * API 日志辅助函数
 * 
 * @param context - 上下文信息（如 API 路径）
 * @param error - 错误对象
 * @param metadata - 额外的元数据
 */
export function logApiError(
  context: string,
  error: unknown,
  metadata?: Record<string, any>
) {
  const log = createLogger('api')
  
  log.error({
    context,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : String(error),
    ...metadata,
  }, `API Error: ${context}`)
}

/**
 * 数据库日志辅助函数
 */
export function logDatabaseError(
  operation: string,
  error: unknown,
  metadata?: Record<string, any>
) {
  const log = createLogger('database')
  
  log.error({
    operation,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : String(error),
    ...metadata,
  }, `Database Error: ${operation}`)
}

/**
 * 认证日志辅助函数
 */
export function logAuthEvent(
  event: 'login' | 'logout' | 'token_verify' | 'token_expired',
  success: boolean,
  metadata?: Record<string, any>
) {
  const log = createLogger('auth')
  
  if (success) {
    log.info({ event, ...metadata }, `Auth Event: ${event}`)
  } else {
    log.warn({ event, ...metadata }, `Auth Event Failed: ${event}`)
  }
}
