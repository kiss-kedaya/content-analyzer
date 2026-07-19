const isDevelopment = process.env.NODE_ENV === 'development'
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' https:${isDevelopment ? ' ws: wss:' : ''}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep local dev HMR artifacts separate from production builds. This prevents
  // `next build` from invalidating a running `next dev` stylesheet manifest.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',

  // Vercel 部署，不需要 output: 'export'
  // 支持 API Routes 和 SSR
  
  // 设置 workspace root 为当前项目目录，避免 Next.js 推断错误
  outputFileTracingRoot: __dirname,
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.svg' }]
  },
}

module.exports = nextConfig
