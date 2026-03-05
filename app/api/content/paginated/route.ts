import { NextRequest, NextResponse } from 'next/server'
import { getAllContents, getContentsCount } from '@/lib/api'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const orderBy = (searchParams.get('orderBy') || 'score') as 'score' | 'createdAt' | 'analyzedAt'
    
    const [contents, total] = await Promise.all([
      getAllContents(orderBy, page, pageSize),
      getContentsCount()
    ])
    
    return NextResponse.json({
      contents,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch paginated contents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contents' },
      { status: 500 }
    )
  }
}
