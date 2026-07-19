import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateToken } from '@/lib/auth'
import { ErrorCodes, errorResponse, logError, successResponse } from '@/lib/api-response'
import { env } from '@/lib/env'
import { clearLoginFailures, constantTimeEqual, getLoginRateLimit, recordLoginFailure } from '@/lib/login-security'
import { LoginSchema } from '@/lib/validation'

export const runtime = 'nodejs'

function clientKey(request: NextRequest) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
}

export async function POST(request: NextRequest) {
  const key = clientKey(request)
  const limit = getLoginRateLimit(key)
  if (!limit.allowed) {
    return NextResponse.json(
      errorResponse('Too many login attempts. Try again later.', ErrorCodes.RATE_LIMIT_EXCEEDED),
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds), 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const { password } = LoginSchema.parse(await request.json())
    if (!constantTimeEqual(password, env.ACCESS_PASSWORD)) {
      const nextLimit = recordLoginFailure(key)
      return NextResponse.json(
        errorResponse('Invalid password', ErrorCodes.INVALID_CREDENTIALS),
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store',
            ...(nextLimit.allowed ? {} : { 'Retry-After': String(nextLimit.retryAfterSeconds) }),
          },
        },
      )
    }

    clearLoginFailures(key)
    const token = await generateToken()
    const response = NextResponse.json(successResponse({ authenticated: true }), {
      headers: { 'Cache-Control': 'no-store' },
    })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      const message = error instanceof z.ZodError ? error.issues[0].message : 'Request body must be valid JSON'
      return NextResponse.json(
        errorResponse(message, ErrorCodes.VALIDATION_ERROR, error instanceof z.ZodError ? error.issues : undefined),
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    logError('POST /api/auth/login', error)
    return NextResponse.json(
      errorResponse('Login failed', ErrorCodes.INTERNAL_ERROR),
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
