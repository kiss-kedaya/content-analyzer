import { NextRequest, NextResponse } from 'next/server'
import { extractTwitterMedia, extractBatchTwitterMedia } from '@/lib/media-extractor'

// POST /api/extract-media - 提取 Twitter 媒体链接
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 单个 URL
    if (body.url && typeof body.url === 'string') {
      const mediaList = await extractTwitterMedia(body.url)
      
      return NextResponse.json({
        url: body.url,
        media: mediaList,
        count: mediaList.length
      })
    }
    
    // 批量 URL
    if (body.urls && Array.isArray(body.urls)) {
      const results = await extractBatchTwitterMedia(body.urls)
      
      return NextResponse.json({
        results,
        total: Object.keys(results).length
      })
    }
    
    return NextResponse.json(
      { error: 'Missing required field: url or urls' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error extracting media:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
