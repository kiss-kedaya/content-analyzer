import { NextRequest, NextResponse } from 'next/server'
import { createContent, getAllContents } from '@/lib/api'
import { normalizeSource } from '@/lib/normalize-source'

// POST /api/content - 创建内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证必填字段
    if (!body.source || !body.url || !body.summary || !body.content || body.score === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: source, url, summary, content, score' },
        { status: 400 }
      )
    }
    
    // 验证评分范围
    if (body.score < 0 || body.score > 10) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 10' },
        { status: 400 }
      )
    }

    if (body.sourceTime !== undefined && typeof body.sourceTime !== 'number') {
      return NextResponse.json(
        { error: 'sourceTime must be a number (timestamp ms)' },
        { status: 400 }
      )
    }
    
    const content = await createContent({
      source: normalizeSource(body.source), // 规范化 source
      url: body.url,
      title: body.title,
      summary: body.summary,
      content: body.content,
      score: body.score,
      analyzedBy: body.analyzedBy,
      sourceTime: typeof body.sourceTime === 'number' ? body.sourceTime : undefined
    })
    
    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Error creating content:', error)
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    )
  }
}

// GET /api/content - 获取内容列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderBy = searchParams.get('orderBy') as 'score' | 'createdAt' | 'analyzedAt' || 'score'
    
    const contents = await getAllContents(orderBy)
    
    return NextResponse.json(contents)
  } catch (error) {
    console.error('Error fetching contents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contents' },
      { status: 500 }
    )
  }
}
