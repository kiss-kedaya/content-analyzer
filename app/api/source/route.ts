import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getOrFetchSourceText } from '@/lib/source-cache'
import { HttpUrlSchema } from '@/lib/url-validate'

const QuerySchema = z.object({
  url: HttpUrlSchema,
  force: z.string().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const parsed = QuerySchema.safeParse({
    url: searchParams.get('url') ?? '',
    force: searchParams.get('force') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: { message: 'Invalid url' },
    }, { status: 400 })
  }

  const { url, force } = parsed.data

  try {
    const cached = await getOrFetchSourceText(url, { force: force === '1' })

    return NextResponse.json({
      success: true,
      data: {
        url: cached.url,
        provider: cached.provider,
        status: cached.status,
        title: cached.title,
        text: cached.status === 'ok' ? cached.text : null,
        errorText: cached.status === 'ok' ? null : cached.text,
        wordCount: cached.wordCount,
        sha256: cached.sha256,
        lastFetchedAt: cached.lastFetchedAt,
      }
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { message: err instanceof Error ? err.message : 'Unknown error' },
    }, { status: 500 })
  }
}
