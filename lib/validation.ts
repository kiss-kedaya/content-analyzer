import { z } from 'zod'

/**
 * 内容创建验证 Schema
 */
export const ContentCreateSchema = z.object({
  source: z.enum(['twitter', 'xiaohongshu', 'linuxdo'], {
    message: 'Source must be one of: twitter, xiaohongshu, linuxdo'
  }),
  url: z.string().url({ message: 'Invalid URL format' }),
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  summary: z.string()
    .min(10, 'Summary must be at least 10 characters')
    .max(1000, 'Summary must be less than 1000 characters'),
  content: z.string()
    .min(20, 'Content must be at least 20 characters')
    .max(10000, 'Content must be less than 10000 characters'),
  score: z.number()
    .min(0, 'Score must be at least 0')
    .max(10, 'Score must be at most 10'),
  analyzedBy: z.string().max(100).optional()
})

/**
 * 批量内容创建验证 Schema
 */
export const ContentBatchCreateSchema = z.object({
  contents: z.array(ContentCreateSchema)
    .min(1, 'At least one content item is required')
    .max(100, 'Maximum 100 items per batch')
})

/**
 * 分页查询验证 Schema
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  pageSize: z.coerce.number()
    .int('Page size must be an integer')
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size must be at most 100')
    .default(20),
  orderBy: z.enum(['score', 'createdAt', 'analyzedAt'], {
    message: 'OrderBy must be one of: score, createdAt, analyzedAt'
  }).default('score')
})

/**
 * 收藏操作验证 Schema
 */
export const FavoriteSchema = z.object({
  favorited: z.boolean()
})

/**
 * 登录验证 Schema
 */
export const LoginSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password is too long')
})

/**
 * 类型导出
 */
export type ContentCreateInput = z.infer<typeof ContentCreateSchema>
export type ContentBatchCreateInput = z.infer<typeof ContentBatchCreateSchema>
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type FavoriteInput = z.infer<typeof FavoriteSchema>
export type LoginInput = z.infer<typeof LoginSchema>
