import { SignJWT, jwtVerify } from 'jose'
import { env } from './env'
import { createLogger } from './logger'

const log = createLogger('auth')

// 将字符串转换为 Uint8Array（Edge Runtime 兼容）
const secret = new TextEncoder().encode(env.JWT_SECRET)

/**
 * 生成 JWT Token（Edge Runtime 兼容）
 */
export async function generateToken(): Promise<string> {
  const token = await new SignJWT({
    authenticated: true,
    timestamp: Date.now()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  
  return token
}

/**
 * 验证 JWT Token（Edge Runtime 兼容）
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret)
    return true
  } catch (error) {
    log.warn({
      err: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    }, 'Token verification failed')
    return false
  }
}

/**
 * 解码 JWT Token（Edge Runtime 兼容）
 */
export async function decodeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    return null
  }
}
