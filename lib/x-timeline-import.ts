import { z } from 'zod'
import { transformXBookmarks } from './x-bookmark-import'

const MediaVariantSchema = z.object({
  bit_rate: z.number().int().nonnegative().optional(),
  content_type: z.string().max(100).optional(),
  url: z.string().url().max(4096).optional(),
})

const MediaSchema = z.object({
  media_key: z.string().min(1).max(128),
  type: z.enum(['photo', 'video', 'animated_gif']).optional(),
  url: z.string().url().max(4096).optional(),
  preview_image_url: z.string().url().max(4096).optional(),
  variants: z.array(MediaVariantSchema).max(20).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

const PostSchema = z.object({
  id: z.string().regex(/^\d{1,32}$/),
  text: z.string().max(20_000).optional(),
  url: z.string().url().max(4096).optional(),
  author_id: z.string().max(128).optional(),
  created_at: z.string().max(100).optional(),
  possibly_sensitive: z.boolean().optional(),
  attachments: z.object({ media_keys: z.array(z.string().max(128)).max(20).optional() }).optional(),
})

const UserSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().max(200).optional(),
  username: z.string().max(100).optional(),
})

export const XTimelineCaptureSchema = z.object({
  data: z.array(PostSchema).min(1).max(100),
  includes: z.object({
    users: z.array(UserSchema).max(100).optional(),
    media: z.array(MediaSchema).max(200).optional(),
  }).optional(),
})

function postUrl(post: z.infer<typeof PostSchema>) {
  return post.url || `https://x.com/i/status/${post.id}`
}

export function prepareXTimelineImport(input: unknown) {
  const payload = XTimelineCaptureSchema.parse(input)
  const transformed = transformXBookmarks(payload)
  const content = transformed.content.filter((item) => (item.mediaUrls?.length || 0) > 0)
  const adultContent = transformed.adultContent.filter((item) => (item.mediaUrls?.length || 0) > 0)
  const acceptedUrls = new Set([...content, ...adultContent].map((item) => item.url))

  return {
    payload,
    content,
    adultContent,
    acceptedPostIds: payload.data.filter((post) => acceptedUrls.has(postUrl(post))).map((post) => post.id),
    ignoredPostIds: payload.data.filter((post) => !acceptedUrls.has(postUrl(post))).map((post) => post.id),
  }
}
