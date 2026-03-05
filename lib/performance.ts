/**
 * 性能监控工具
 * 
 * 用于监控和记录应用性能指标
 */

import { createLogger } from './logger'

const logger = createLogger('performance')

/**
 * 性能指标类型
 */
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  metadata?: Record<string, any>
}

/**
 * 记录性能指标
 */
export function recordMetric(metric: PerformanceMetric) {
  logger.info(metric, `Performance: ${metric.name}`)
  
  // 在生产环境可以发送到监控服务（如 Vercel Analytics）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // 可以集成 Vercel Analytics 或其他监控服务
    // window.analytics?.track('performance', metric)
  }
}

/**
 * 测量函数执行时间
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await fn()
    const duration = performance.now() - start
    
    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        success: true,
      },
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    })
    
    throw error
  }
}

/**
 * 测量同步函数执行时间
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = performance.now()
  
  try {
    const result = fn()
    const duration = performance.now() - start
    
    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        success: true,
      },
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
    })
    
    throw error
  }
}

/**
 * Web Vitals 监控
 * 
 * 监控 Core Web Vitals 指标
 */
export function reportWebVitals(metric: any) {
  // 记录 Web Vitals
  recordMetric({
    name: `web-vitals-${metric.name}`,
    value: metric.value,
    unit: 'ms',
    timestamp: Date.now(),
    metadata: {
      id: metric.id,
      label: metric.label,
    },
  })
}
