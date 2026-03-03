import { NextRequest, NextResponse } from 'next/server'
import { extractWithSnapvid } from '@/lib/media-extractor-snapvid'

// GET /api/preview-media?url=https://x.com/user/status/123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing required parameter: url' },
        { status: 400 }
      )
    }
    
    // 提取媒体链接
    const mediaList = await extractWithSnapvid(url)
    
    // 分类视频和图片
    const videos = mediaList.filter(m => m.type === 'video')
    const images = mediaList.filter(m => m.type === 'image')
    
    return NextResponse.json({
      success: true,
      url: url,
      videos: videos.map(v => ({
        url: v.url,
        quality: v.quality,
        format: v.format
      })),
      images: images.map(i => ({
        url: i.url
      })),
      count: {
        videos: videos.length,
        images: images.length,
        total: mediaList.length
      }
    })
  } catch (error) {
    console.error('Preview media error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to preview media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
