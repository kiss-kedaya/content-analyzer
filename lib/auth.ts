import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

/**
 * 生成 JWT Token
 */
export function generateToken(): string {
  return jwt.sign(
    {
      authenticated: true,
      timestamp: Date.now()
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  )
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : error)
    return false
  }
}

/**
 * 解码 JWT Token（不验证签名）
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}
