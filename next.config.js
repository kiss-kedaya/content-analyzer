/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 部署，不需要 output: 'export'
  // 支持 API Routes 和 SSR
  
  // 设置 workspace root 为当前项目目录，避免 Next.js 推断错误
  outputFileTracingRoot: __dirname,
  
  async headers() {
    return [
      {
        // 为所有 API 路由添加 CORS 头
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // 生产环境应该设置具体域名
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
