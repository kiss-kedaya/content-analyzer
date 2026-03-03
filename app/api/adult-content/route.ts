import { NextRequest, NextResponse } from 'next/server'
import { createAdultContent, getAllAdultContents } from '@/lib/adult-api'

// GET /api/adult-content - 获取所有成人内容
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderBy = (searchParams.get('orderBy') as 'score' | 'createdAt' | 'analyzedAt') || 'score'
    
    const contents = await getAllAdultContents(orderBy)
    
    return NextResponse.json(contents)
  } catch (error) {
    console.error('Error fetching adult contents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adult contents' },
      { status: 500 }
    )
  }
}

// POST /api/adult-content - 创建成人内容
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
    
    // 确保 mediaUrls 是数组
    const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls : []
    
    const content = await createAdultContent({
      source: body.source,
      url: body.url,
      title: body.title,
      summary: body.summary,
      content: body.content,
      score: body.score,
      mediaUrls: mediaUrls,
      analyzedBy: body.analyzedBy
    })
    
    return NextResponse.json(content, { status: 201 })
  } catch (error: any) {
    console.error('Error creating adult content:', error)
    
    // 处理唯一约束错误
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Content with this URL already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create adult content' },
      { status: 500 }
    )
  }
}
