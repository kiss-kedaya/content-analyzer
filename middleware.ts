import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 允许访问登录页面和登录 API
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next()
  }
  
  // 检查 Cookie
  const authToken = request.cookies.get('auth-token')
  
  // 调试日志
  console.log('[Middleware]', {
    pathname,
    hasToken: !!authToken,
    tokenLength: authToken?.value.length,
    allCookies: request.cookies.getAll().map(c => c.name)
  })
  
  if (!authToken) {
    console.log('[Middleware] No token')

    // API routes should return 401 (agents/curl should not be redirected)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({
        success: false,
        error: { message: 'Unauthorized' },
      }, { status: 401 })
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 验证 JWT token（异步，Edge Runtime 兼容）
  const isValid = await verifyToken(authToken.value)
  
  if (!isValid) {
    console.log('[Middleware] Token verification failed')

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({
        success: false,
        error: { message: 'Unauthorized' },
      }, { status: 401 })
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  console.log('[Middleware] Token verified, access granted')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
