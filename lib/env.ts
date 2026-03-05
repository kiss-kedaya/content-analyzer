import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * 服务器端环境变量
   * 这些变量只在服务器端可用，不会暴露给客户端
   */
  server: {
    // 数据库连接
    DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),
    
    // 认证
    ACCESS_PASSWORD: z.string().min(8, 'ACCESS_PASSWORD must be at least 8 characters'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    
    // Node 环境
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  /**
   * 客户端环境变量
   * 这些变量会暴露给客户端，必须以 NEXT_PUBLIC_ 开头
   */
  client: {
    // 目前没有客户端环境变量
  },

  /**
   * 运行时环境变量
   * 从 process.env 中读取
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    ACCESS_PASSWORD: process.env.ACCESS_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },

  /**
   * 跳过验证（仅在构建时）
   * 在构建时跳过验证，因为环境变量可能在运行时才设置
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
