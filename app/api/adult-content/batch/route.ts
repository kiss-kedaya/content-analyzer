import { NextRequest, NextResponse } from 'next/server'
import { createAdultContent } from '@/lib/adult-api'
import { normalizeSource } from '@/lib/normalize-source'

interface AdultContentInput {
  source: string
  url: string
  title?: string
  content: string
  summary?: string
  score?: number
  analyzedBy?: string
  mediaUrls?: string[]
}

interface BatchResult {
  success: number
  failed: number
  total: number
  errors: Array<{
    index: number
    url: string
    error: string
  }>
  created: Array<{
    index: number
    id: string
    url: string
  }>
}

// POST /api/adult-content/batch - 批量创建成人内容
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证输入是否为数组
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array' },
        { status: 400 }
      )
    }

    // 验证数组不为空
    if (body.length === 0) {
      return NextResponse.json(
        { error: 'Array cannot be empty' },
        { status: 400 }
      )
    }

    // 限制批量上传数量
    const MAX_BATCH_SIZE = 100
    if (body.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size cannot exceed ${MAX_BATCH_SIZE}` },
        { status: 400 }
      )
    }

    const result: BatchResult = {
      success: 0,
      failed: 0,
      total: body.length,
      errors: [],
      created: []
    }

    // 逐个处理每条内容
    for (let i = 0; i < body.length; i++) {
      const item = body[i] as AdultContentInput

      try {
        // 验证必填字段
        if (!item.source || !item.url || !item.content) {
          throw new Error('Missing required fields: source, url, content')
        }

        // 创建内容
        const created = await createAdultContent({
          source: normalizeSource(item.source), // 规范化 source
          url: item.url,
          title: item.title,
          content: item.content,
          analyzedBy: item.analyzedBy,
          mediaUrls: Array.isArray(item.mediaUrls) ? item.mediaUrls : undefined,
        })

        result.success++
        result.created.push({
          index: i,
          id: created.id,
          url: created.url
        })
      } catch (error) {
        result.failed++
        result.errors.push({
          index: i,
          url: item.url || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // 返回结果
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Batch upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch upload' },
      { status: 500 }
    )
  }
}
