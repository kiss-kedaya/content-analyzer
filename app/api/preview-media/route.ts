import { NextRequest, NextResponse } from 'next/server'
import { extractWithSnapvid } from '@/lib/media-extractor-snapvid'
import { logApiError } from '@/lib/logger'

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
    
    try {
      // 提取媒体链接（带超时）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 10000) // 10 秒超时
      })
      
      const mediaList = await Promise.race([
        extractWithSnapvid(url),
        timeoutPromise
      ]) as any[]
      
      // 尝试解析数据
      try {
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
      } catch (parseError) {
        // 解析失败，返回原始数据
        logApiError('preview-media-parse', parseError, { url })
        
        return NextResponse.json({
          success: true,
          url: url,
          raw: mediaList, // 返回原始数据
          parseError: parseError instanceof Error ? parseError.message : 'Parse failed',
          warning: 'Failed to parse media data, returning raw response'
        })
      }
    } catch (extractError) {
      // 提取失败，返回空结果
      logApiError('preview-media-extract', extractError, { url })
      
      return NextResponse.json({
        success: true,
        url: url,
        videos: [],
        images: [],
        count: {
          videos: 0,
          images: 0,
          total: 0
        },
        extractError: extractError instanceof Error ? extractError.message : 'Extract failed',
        warning: 'Media extraction failed'
      })
    }
  } catch (error) {
    logApiError('preview-media', error)
    return NextResponse.json(
      { 
        error: 'Failed to preview media',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
