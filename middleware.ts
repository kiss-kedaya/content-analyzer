import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
    tokenValue: authToken?.value,
    allCookies: request.cookies.getAll().map(c => c.name)
  })
  
  if (!authToken || authToken.value !== 'authenticated') {
    console.log('[Middleware] Redirecting to login:', pathname)
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  console.log('[Middleware] Access granted:', pathname)
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
