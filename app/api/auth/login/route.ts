import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    
    // 从环境变量获取密码
    const correctPassword = process.env.ACCESS_PASSWORD
    
    if (!correctPassword) {
      console.error('ACCESS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    if (password === correctPassword) {
      // Next.js 15: cookies() 返回 Promise，需要 await
      const cookieStore = await cookies()
      cookieStore.set('auth-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 天
        path: '/'
      })
      
      // 创建响应并再次设置 Cookie（双重保险）
      const response = NextResponse.json({ success: true })
      response.cookies.set('auth-token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
      
      console.log('Login successful, cookie set')
      return response
    }
    
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
