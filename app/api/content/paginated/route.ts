import { NextRequest, NextResponse } from 'next/server'
import { getAllContents, getContentsCount } from '@/lib/api'
import { PaginationQuerySchema } from '@/lib/validation'
import { successResponse, errorResponse, ErrorCodes, logError } from '@/lib/api-response'
import { z } from 'zod'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    // 解析和验证查询参数
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const { page, pageSize, orderBy } = PaginationQuerySchema.parse(searchParams)
    
    // 获取数据
    const [contents, total] = await Promise.all([
      getAllContents(orderBy, page, pageSize),
      getContentsCount()
    ])
    
    // 返回响应
    return NextResponse.json(
      successResponse(contents, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      })
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError
      return NextResponse.json(
        errorResponse(
          zodError.errors[0].message,
          ErrorCodes.VALIDATION_ERROR,
          zodError.errors
        ),
        { status: 400 }
      )
    }
    
    logError('GET /api/content/paginated', error, {
      searchParams: Object.fromEntries(request.nextUrl.searchParams)
    })
    
    return NextResponse.json(
      errorResponse('Failed to fetch contents', ErrorCodes.DATABASE_ERROR),
      { status: 500 }
    )
  }
}
