import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

function extensionOrigin(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  return /^(?:chrome|moz)-extension:\/\/[a-z0-9-]+$/i.test(origin) ? origin : null
}

function withExtensionCors(response: NextResponse, request: NextRequest) {
  const origin = extensionOrigin(request)
  if (!origin) return response

  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Headers', 'authorization, content-type')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Max-Age', '86400')
  response.headers.set('Vary', 'Origin')
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return withExtensionCors(new NextResponse(null, { status: 204 }), request)
  }
  
  // 允许访问登录页面和登录 API
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/api/auth/extension-token' ||
    pathname === '/api/health'
  ) {
    return withExtensionCors(NextResponse.next(), request)
  }
  
  // 检查 Cookie
  const bearerToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const authToken = request.cookies.get('auth-token')?.value || bearerToken
  
  if (!authToken) {
    // API routes should return 401 (agents/curl should not be redirected)
    if (pathname.startsWith('/api/')) {
      return withExtensionCors(NextResponse.json({
        success: false,
        error: { message: 'Unauthorized' },
      }, { status: 401 }), request)
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 验证 JWT token（异步，Edge Runtime 兼容）
  const isValid = await verifyToken(authToken)
  
  if (!isValid) {
    if (pathname.startsWith('/api/')) {
      return withExtensionCors(NextResponse.json({
        success: false,
        error: { message: 'Unauthorized' },
      }, { status: 401 }), request)
    }

    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return withExtensionCors(NextResponse.next(), request)
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
