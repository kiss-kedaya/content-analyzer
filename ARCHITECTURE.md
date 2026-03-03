# 内容分析系统 - 架构设计文档 v2.0

## 1. 系统概述

### 1.1 项目目标

构建一个由 OpenClaw Agent 驱动的内容分析和管理系统，能够：
- 接收 Agent 分析的内容
- 存储和管理内容
- 提供 Web 界面查看和管理
- 支持 CRUD 操作

### 1.2 核心功能

1. **内容上传**：通过 API 接收 Agent 分析的内容
2. **内容管理**：查看、删除内容
3. **排序功能**：按评分、时间排序
4. **详情页面**：查看完整内容
5. **统计信息**：内容数量统计

## 2. 技术架构

### 2.1 技术选型

| 层级 | 技术 | 理由 |
|------|------|------|
| 前端框架 | Next.js 15 (App Router) | SSR/SSG 支持，API Routes |
| 样式 | Tailwind CSS | 快速开发，响应式设计 |
| 数据库 | Neon PostgreSQL | 免费 0.5GB，Serverless |
| ORM | Prisma | 类型安全，开发体验好 |
| 部署 | Vercel | 免费，全球 CDN，易用 |
| 语言 | TypeScript | 类型安全 |

### 2.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     OpenClaw Agent                           │
│                                                               │
│  分析内容 → 生成摘要 → 评分 → 调用 API 上传                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    POST /api/content
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ POST /content│ -> │ Neon DB      │ <- │ GET /content │  │
│  │ (创建)        │    │ (存储)        │    │ (查询)        │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Pages (Vercel)                     │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ 表格页面      │    │ 详情页面      │    │ API 文档      │  │
│  │ (排序/删除)   │    │ (完整内容)    │    │ (使用说明)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 3. 数据流程

### 3.1 内容上传流程

```
1. OpenClaw Agent 分析内容
   ↓
2. 生成摘要和评分
   ↓
3. 调用 POST /api/content
   ↓
4. 验证数据格式
   ↓
5. 存储到 Neon PostgreSQL
   ↓
6. 返回创建的内容
```

### 3.2 内容查看流程

```
1. 用户访问网站
   ↓
2. Next.js SSR 渲染页面
   ↓
3. 从 Neon DB 读取数据
   ↓
4. 渲染表格/详情页
   ↓
5. 用户查看内容
```

### 3.3 内容删除流程

```
1. 用户点击删除按钮
   ↓
2. 确认删除
   ↓
3. 调用 DELETE /api/content/[id]
   ↓
4. 从数据库删除
   ↓
5. 刷新页面
```

## 4. 数据库设计

### 4.1 Content 表

```prisma
model Content {
  id         String   @id @default(cuid())
  source     String   // 来源（twitter, xiaohongshu, linuxdo 等）
  url        String   @unique
  title      String?
  summary    String   @db.Text
  content    String   @db.Text  // 完整内容
  score      Float    // 评分（0-10）
  analyzedBy String?  // 分析者（Agent 名称）
  analyzedAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([source])
  @@index([score])
  @@index([analyzedAt])
  @@index([createdAt])
}
```

### 4.2 索引策略

- `source`: 按来源筛选
- `score`: 按评分排序
- `analyzedAt`: 按分析时间排序
- `createdAt`: 按创建时间排序
- `url`: 唯一索引，避免重复

## 5. API 设计

### 5.1 API 接口

#### POST /api/content

创建内容

**请求体**：
```json
{
  "source": "twitter",
  "url": "https://...",
  "title": "标题（可选）",
  "summary": "摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent"
}
```

**响应**：
```json
{
  "id": "clxxx...",
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent",
  "analyzedAt": "2026-03-04T01:00:00.000Z",
  "createdAt": "2026-03-04T01:00:00.000Z",
  "updatedAt": "2026-03-04T01:00:00.000Z"
}
```

#### GET /api/content

获取内容列表

**查询参数**：
- `orderBy`: 排序字段（score, createdAt, analyzedAt），默认 score

**响应**：
```json
[
  {
    "id": "clxxx...",
    "source": "twitter",
    "url": "https://...",
    "title": "标题",
    "summary": "摘要",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent",
    "analyzedAt": "2026-03-04T01:00:00.000Z"
  }
]
```

#### GET /api/content/[id]

获取内容详情

**响应**：
```json
{
  "id": "clxxx...",
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent",
  "analyzedAt": "2026-03-04T01:00:00.000Z",
  "createdAt": "2026-03-04T01:00:00.000Z",
  "updatedAt": "2026-03-04T01:00:00.000Z"
}
```

#### DELETE /api/content/[id]

删除内容

**响应**：
```json
{
  "success": true
}
```

#### GET /api/stats

获取统计信息

**响应**：
```json
{
  "total": 30,
  "bySource": {
    "twitter": 10,
    "xiaohongshu": 10,
    "linuxdo": 10
  }
}
```

## 6. 部署方案

### 6.1 Vercel 部署

**优势**：
- 免费 Hobby 计划
- 全球 CDN
- 自动 HTTPS
- Git 集成
- 环境变量管理
- 易于使用

**步骤**：
1. 连接 GitHub 仓库
2. 添加环境变量（`DATABASE_URL`）
3. 自动部署

### 6.2 Neon PostgreSQL

**配置**：
- 免费计划：0.5GB 存储
- Serverless：按需计费
- 自动休眠：节省资源

**连接**：
```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

## 7. 性能优化

### 7.1 服务端渲染（SSR）

```typescript
export const revalidate = 0 // 实时更新
```

**优势**：
- 数据实时性
- SEO 友好
- 首屏加载快

### 7.2 数据库优化

- 索引优化
- 连接池
- 查询优化

### 7.3 Vercel 优化

- 全球 CDN
- 边缘缓存
- 自动压缩

## 8. 成本分析

### 8.1 完全免费方案

| 服务 | 免费额度 | 预计使用 | 成本 |
|------|---------|---------|------|
| Vercel | 100GB 带宽/月 | 1GB/月 | $0 |
| Neon PostgreSQL | 0.5GB 存储 | 10MB | $0 |

**总成本**：$0/月

## 9. 安全性

### 9.1 环境变量

- 使用 Vercel 环境变量
- 不提交 `.env` 到代码库

### 9.2 数据库安全

- SSL 连接
- 定期备份

### 9.3 API 安全

- 输入验证
- 错误处理
- 限流（可选）

## 10. OpenClaw Agent 集成

### 10.1 Agent 工作流

```typescript
// 1. 分析内容
const analysis = await analyzeContent(url)

// 2. 上传到系统
const response = await fetch('https://your-domain.vercel.app/api/content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source: 'twitter',
    url: url,
    title: analysis.title,
    summary: analysis.summary,
    content: analysis.content,
    score: analysis.score,
    analyzedBy: 'OpenClaw Agent'
  })
})

// 3. 处理响应
const result = await response.json()
console.log('Content created:', result.id)
```

### 10.2 批量上传

```typescript
// 批量分析和上传
for (const url of urls) {
  const analysis = await analyzeContent(url)
  await uploadContent(analysis)
  await sleep(1000) // 避免限流
}
```

## 11. 扩展性

### 11.1 添加新功能

- 搜索功能
- 标签系统
- 用户评论
- 导出功能

### 11.2 性能扩展

- 添加缓存层（Redis）
- 数据库读写分离
- CDN 优化

## 12. 监控和日志

### 12.1 Vercel Analytics

- 访问量统计
- 性能指标
- 错误追踪

### 12.2 Neon 监控

- 数据库大小
- 查询性能
- 连接数

## 13. 开发流程

### 13.1 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env

# 3. 初始化数据库
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

### 13.2 部署

```bash
# 1. 推送到 GitHub
git push origin main

# 2. Vercel 自动部署
```

## 14. 最佳实践

### 14.1 代码规范

- TypeScript 严格模式
- ESLint + Prettier
- 组件化开发

### 14.2 Git 工作流

- main 分支保护
- PR 审查
- 语义化提交

### 14.3 文档维护

- README 更新
- API 文档
- 架构图更新

---

**设计完成时间**: 2026-03-04 02:00 GMT+8  
**设计人**: Senior Full-Stack Architect  
**版本**: 2.0.0
