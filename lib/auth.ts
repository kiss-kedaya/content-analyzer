import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// 将字符串转换为 Uint8Array（Edge Runtime 兼容）
const secret = new TextEncoder().encode(JWT_SECRET)

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
    console.error('Token verification failed:', error instanceof Error ? error.message : error)
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
