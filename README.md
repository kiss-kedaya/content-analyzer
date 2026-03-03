# 内容分析系统 (Content Analyzer)

OpenClaw Agent 驱动的内容分析和管理系统。

## 🌟 特性

- 🤖 **Agent 驱动**：由 OpenClaw Agent 分析内容并上传
- 📊 **内容管理**：创建、查看、删除内容
- 🎯 **智能评分**：0-10 分评分系统
- 📈 **排序功能**：按评分、时间排序
- 📄 **详情页面**：查看完整内容
- 🔗 **原文链接**：跳转到原始来源
- ⚡ **高性能**：Vercel 全球 CDN

## 🏗️ 技术栈

- **前端框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS
- **数据库**: Neon PostgreSQL + Prisma ORM
- **部署**: Vercel
- **语言**: TypeScript

## 📦 项目结构

```
content-analyzer/
├── app/
│   ├── page.tsx              # 首页（表格）
│   ├── content/[id]/page.tsx # 详情页
│   ├── api-docs/page.tsx     # API 文档
│   ├── api/
│   │   ├── content/route.ts  # 创建/获取内容
│   │   ├── content/[id]/route.ts # 获取/删除单个内容
│   │   └── stats/route.ts    # 统计信息
│   ├── layout.tsx            # 布局
│   └── globals.css           # 全局样式
├── components/
│   └── ContentTable.tsx      # 内容表格组件
├── lib/
│   ├── api.ts                # API 工具函数
│   └── db.ts                 # 数据库连接
└── prisma/
    └── schema.prisma         # 数据库模型
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

## 📡 API 使用

### 创建内容

```bash
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "示例标题",
    "summary": "内容摘要",
    "content": "完整内容",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  }'
```

### 获取内容列表

```bash
curl http://localhost:3000/api/content?orderBy=score
```

### 获取内容详情

```bash
curl http://localhost:3000/api/content/[id]
```

### 删除内容

```bash
curl -X DELETE http://localhost:3000/api/content/[id]
```

### 获取统计信息

```bash
curl http://localhost:3000/api/stats
```

## 🌐 部署到 Vercel

### 1. 创建 Neon 数据库

1. 访问 [Neon](https://neon.tech)
2. 创建免费项目
3. 复制连接字符串

### 2. 部署到 Vercel

1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 添加环境变量：
   - `DATABASE_URL`
4. 部署

### 3. 初始化数据库

```bash
npx prisma db push
```

## 📊 数据库模型

```prisma
model Content {
  id         String   @id @default(cuid())
  source     String   // 来源
  url        String   @unique
  title      String?
  summary    String   // 摘要
  content    String   // 完整内容
  score      Float    // 评分（0-10）
  analyzedBy String?  // 分析者
  analyzedAt DateTime
  createdAt  DateTime
  updatedAt  DateTime
}
```

## 🎯 功能特性

### 表格页面

- 显示所有内容
- 按评分/时间排序
- 删除按钮
- 点击查看详情

### 详情页面

- 完整内容展示
- 原文链接
- 评分显示
- 元数据信息

### API 接口

- POST /api/content - 创建内容
- GET /api/content - 获取列表
- GET /api/content/[id] - 获取详情
- DELETE /api/content/[id] - 删除内容
- GET /api/stats - 统计信息

## 🔧 OpenClaw Agent 集成

在 OpenClaw Agent 中使用：

```typescript
// 分析内容后上传
const response = await fetch('https://your-domain.vercel.app/api/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'twitter',
    url: 'https://...',
    title: '标题',
    summary: '摘要',
    content: '完整内容',
    score: 8.5,
    analyzedBy: 'OpenClaw Agent'
  })
})
```

## 💰 成本估算

完全免费：

- **Vercel**: 免费（Hobby 计划）
- **Neon PostgreSQL**: 免费（0.5GB 存储）

## 📈 性能优化

- Next.js App Router
- Vercel 全球 CDN
- 数据库索引优化
- 实时数据更新

## 🔒 安全性

- 环境变量加密
- 数据库 SSL 连接
- API 输入验证
- Vercel 安全防护

## 📝 开发说明

### 数据库管理

```bash
# 打开 Prisma Studio
npx prisma studio

# 推送数据库变更
npx prisma db push

# 生成 Prisma Client
npx prisma generate
```

### 构建

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 🐛 故障排查

### 数据库连接失败

检查 `DATABASE_URL` 是否正确，确认包含 `?sslmode=require`。

### API 请求失败

查看浏览器控制台和 Vercel 日志。

### 页面不更新

检查 `revalidate` 配置，确保设置为 0（实时更新）。

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ by Senior Full-Stack Architect**
