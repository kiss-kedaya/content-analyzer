import { NextRequest, NextResponse } from 'next/server'
import { createAdultContent, getAllAdultContents } from '@/lib/adult-api'
import { normalizeSource } from '@/lib/normalize-source'

// GET /api/adult-content - 获取所有成人内容
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderBy = searchParams.get('orderBy') || 'createdAt'
    
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
    if (!body.source || !body.url || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: source, url, content' },
        { status: 400 }
      )
    }
    
    const content = await createAdultContent({
      source: normalizeSource(body.source), // 规范化 source
      url: body.url,
      title: body.title,
      content: body.content,
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
