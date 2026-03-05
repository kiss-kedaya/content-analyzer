import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateToken } from '@/lib/auth'
import { LoginSchema } from '@/lib/validation'
import { successResponse, errorResponse, ErrorCodes, logError } from '@/lib/api-response'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    // 验证请求体
    const body = await req.json()
    const { password } = LoginSchema.parse(body)
    
    // 从环境变量获取密码
    const correctPassword = process.env.ACCESS_PASSWORD
    
    if (!correctPassword) {
      logError('Login', new Error('ACCESS_PASSWORD not configured'))
      return NextResponse.json(
        errorResponse('Server configuration error', ErrorCodes.INTERNAL_ERROR),
        { status: 500 }
      )
    }
    
    // 验证密码
    if (password !== correctPassword) {
      return NextResponse.json(
        errorResponse('Invalid password', ErrorCodes.INVALID_CREDENTIALS),
        { status: 401 }
      )
    }
    
    // 生成 JWT token
    const token = await generateToken()
    
    // 设置 Cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: '/'
    })
    
    // 创建响应
    const response = NextResponse.json(successResponse({ authenticated: true }))
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse(
          error.issues[0].message,
          ErrorCodes.VALIDATION_ERROR,
          error.issues
        ),
        { status: 400 }
      )
    }
    
    logError('Login', error)
    return NextResponse.json(
      errorResponse('Login failed', ErrorCodes.INTERNAL_ERROR),
      { status: 500 }
    )
  }
}
