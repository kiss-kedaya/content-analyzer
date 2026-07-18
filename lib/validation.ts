import { z } from 'zod'
import { getShanghaiDayRange } from './date'

/**
 * 内容创建验证 Schema
 */
export const ContentCreateSchema = z.object({
  source: z.string().refine(
    (value) => ['twitter', 'Twitter', 'x', 'X', 'xiaohongshu', 'linuxdo', 'Linuxdo'].includes(value),
    { message: 'Source must be one of: X, twitter, xiaohongshu, linuxdo, Linuxdo' }
  ),
  url: z.string().url({ message: 'Invalid URL format' }),
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  summary: z.string().max(10000).optional(),
  content: z.string()
    .min(20, 'Content must be at least 20 characters')
    .max(10000, 'Content must be less than 10000 characters'),
  score: z.number()
    .min(0, 'Score must be at least 0')
    .max(10, 'Score must be at most 10')
    .optional(),
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
  orderBy: z.literal('createdAt').default('createdAt')
})

/** User-facing list query. Agent endpoints intentionally keep their own contract. */
export const ContentListQuerySchema = PaginationQuerySchema.extend({
  q: z.string()
    .trim()
    .max(100, 'Search query must be at most 100 characters')
    .optional()
    .transform((value) => value || undefined),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD')
    .refine((value) => {
      try {
        getShanghaiDayRange(value)
        return true
      } catch {
        return false
      }
    }, 'Date must be a valid calendar date')
    .optional(),
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
export type ContentListQuery = z.infer<typeof ContentListQuerySchema>
export type FavoriteInput = z.infer<typeof FavoriteSchema>
export type LoginInput = z.infer<typeof LoginSchema>
