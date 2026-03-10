import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { renderContentMarkdown } from '@/lib/md'

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const item = await prisma.adultContent.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 })
  }

  const raw = await prisma.sourceCache.findUnique({ where: { url: item.url } })
  const md = renderContentMarkdown(item, raw)

  return new NextResponse(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8'
    }
  })
}
