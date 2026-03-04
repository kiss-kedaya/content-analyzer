# 内容分析系统 (Content Analyzer)

OpenClaw Agent 驱动的智能内容分析和管理系统。

## 🌟 特性

- 🤖 **Agent 驱动**：由 OpenClaw Agent 自动分析内容并上传
- 📊 **双表管理**：技术内容和成人内容分开管理
- 🎯 **智能评分**：0-10 分评分系统，基于内容质量自动打分
- 📈 **排序功能**：按评分、创建时间、分析时间排序
- 📄 **详情页面**：查看完整内容和媒体
- 🔗 **原文链接**：跳转到原始来源
- 🎬 **媒体提取**：自动提取 Twitter 图片和视频
- 🔒 **JWT 认证**：安全的访问控制
- ⭐ **收藏功能**：标记和管理喜欢的内容
- 📊 **偏好分析**：基于收藏数据分析用户偏好
- ⚡ **高性能**：Vercel 全球 CDN + Edge Runtime

## 🏗️ 技术栈

- **前端框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS + Vercel 极简风格
- **数据库**: Neon PostgreSQL + Prisma 5.22.0
- **认证**: JWT (jose 库，Edge Runtime 兼容)
- **媒体提取**: yt-dlp + snapvid API + agent-browser
- **部署**: Vercel (Edge Runtime)
- **语言**: TypeScript

## 📦 项目结构

```
content-analyzer/
├── app/
│   ├── page.tsx                      # 首页（双表格切换）
│   ├── content/[id]/page.tsx         # 技术内容详情页
│   ├── adult-content/[id]/page.tsx   # 成人内容详情页
│   ├── favorites/page.tsx            # 收藏夹页面
│   ├── preferences/page.tsx          # 偏好分析页面
│   ├── api-docs/page.tsx             # API 文档
│   ├── login/page.tsx                # 登录页面
│   ├── api/
│   │   ├── content/
│   │   │   ├── route.ts              # 创建/获取技术内容
│   │   │   ├── batch/route.ts        # 批量创建技术内容
│   │   │   ├── [id]/route.ts         # 获取/删除单个内容
│   │   │   └── [id]/favorite/route.ts # 收藏/取消收藏
│   │   ├── adult-content/
│   │   │   ├── route.ts              # 创建/获取成人内容
│   │   │   ├── batch/route.ts        # 批量创建成人内容
│   │   │   ├── [id]/route.ts         # 获取/删除单个内容
│   │   │   └── [id]/favorite/route.ts # 收藏/取消收藏
│   │   ├── auth/
│   │   │   ├── login/route.ts        # 登录
│   │   │   └── logout/route.ts       # 登出
│   │   ├── extract-media/route.ts    # 提取媒体
│   │   ├── preferences/analyze/route.ts # 偏好分析
│   │   └── stats/route.ts            # 统计信息
│   ├── layout.tsx                    # 布局
│   └── globals.css                   # 全局样式
├── components/
│   ├── ContentTable.tsx              # 技术内容表格
│   ├── AdultContentTable.tsx         # 成人内容表格
│   ├── TabSelector.tsx               # 标签切换器
│   ├── FavoriteButton.tsx            # 收藏按钮
│   └── Icon.tsx                      # 图标组件
├── lib/
│   ├── api.ts                        # 技术内容 API
│   ├── adult-api.ts                  # 成人内容 API
│   ├── auth.ts                       # JWT 认证
│   ├── db.ts                         # 数据库连接
│   ├── media-extractor.ts            # yt-dlp 媒体提取
│   ├── media-extractor-snapvid.ts    # snapvid API 提取
│   ├── media-extractor-browser.ts    # agent-browser 提取
│   ├── media-extractor-unified.ts    # 统一媒体提取
│   └── twitter-url-utils.ts          # Twitter URL 工具
├── scripts/
│   ├── batch-scrape.ts               # 批量抓取脚本
│   ├── fix-missing-media.ts          # 修复缺失媒体
│   ├── clean-media.ts                # 清理重复媒体
│   └── upload.ts                     # 上传脚本
├── prisma/
│   └── schema.prisma                 # 数据库模型
└── middleware.ts                     # JWT 认证中间件
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# 认证配置
ACCESS_PASSWORD="your-password"
JWT_SECRET="your-secret-key-64-chars"
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

### 认证

所有 API 请求都需要 JWT 认证。

#### 登录获取 Token

```bash
curl -X POST https://ca.kedaya.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "your-password"}'
```

响应会设置 `auth-token` Cookie（7天有效期）。

### 技术内容 API

#### 创建单个内容

```bash
curl -X POST https://ca.kedaya.xyz/api/content \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "source": "twitter",
    "url": "https://x.com/user/status/123",
    "title": "示例标题",
    "summary": "内容摘要（50-200字）",
    "content": "完整内容",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  }'
```

#### 批量创建内容

```bash
curl -X POST https://ca.kedaya.xyz/api/content/batch \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '[
    {
      "source": "twitter",
      "url": "https://x.com/user/status/123",
      "summary": "摘要",
      "content": "内容",
      "score": 8.5
    }
  ]'
```

**批量上传特性**：
- 最多 100 条
- 部分失败不影响其他内容
- 返回详细的成功/失败统计

### 成人内容 API

#### 创建成人内容

```bash
curl -X POST https://ca.kedaya.xyz/api/adult-content/batch \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '[
    {
      "source": "twitter",
      "url": "https://x.com/user/status/123",
      "summary": "摘要",
      "content": "内容",
      "score": 8.5
    }
  ]'
```

**注意**：
- `mediaUrls` 字段是可选的
- 系统会自动提取媒体（通过 `fix-missing-media.ts` 脚本）
- 媒体存储为 JSON 字符串

### 收藏功能

```bash
# 收藏技术内容
curl -X POST https://ca.kedaya.xyz/api/content/[id]/favorite \
  -H "Cookie: auth-token=YOUR_TOKEN"

# 收藏成人内容
curl -X POST https://ca.kedaya.xyz/api/adult-content/[id]/favorite \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

### 偏好分析

```bash
curl https://ca.kedaya.xyz/api/preferences/analyze \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

返回基于收藏数据的用户偏好分析。

## 📊 数据库模型

### Content（技术内容）

```prisma
model Content {
  id         String   @id @default(cuid())
  source     String   // 来源（twitter, xiaohongshu, linuxdo）
  url        String   @unique
  title      String?
  summary    String   @db.Text
  content    String   @db.Text
  score      Float    // 评分（0-10）
  analyzedBy String?  // 分析者
  analyzedAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  favorited  Boolean  @default(false)
  favoritedAt DateTime?
  
  @@index([source])
  @@index([score])
  @@index([favorited])
}
```

### AdultContent（成人内容）

```prisma
model AdultContent {
  id         String   @id @default(cuid())
  source     String
  url        String   @unique
  title      String?
  summary    String   @db.Text
  content    String   @db.Text
  score      Float
  mediaUrls  String   @db.Text  // JSON array
  analyzedBy String?
  analyzedAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  favorited  Boolean  @default(false)
  favoritedAt DateTime?
  
  @@index([source])
  @@index([score])
  @@index([favorited])
}
```

## 🎬 媒体提取机制

### 三层提取策略

1. **yt-dlp**（优先）：稳定可靠，支持多平台
2. **snapvid API**（备选）：快速，专门针对 Twitter
3. **agent-browser**（兜底）：本地浏览器提取

### 自动提取脚本

```bash
# 修复缺失媒体
npm run fix-media

# 清理重复媒体（只保留最高质量）
npm run clean-media
```

### 媒体优化

- 只保存最高质量视频（1080p）
- 过滤视频缩略图
- 使用 API 下载链接（dl.snapcdn.app）
- 支持纯图片推文

## 🔒 认证系统

### JWT 认证

- 使用 `jose` 库（Edge Runtime 兼容）
- Token 有效期：7天
- HttpOnly Cookie（XSS 防护）
- Secure + SameSite:lax（CSRF 防护）

### 中间件保护

所有路由都受 `middleware.ts` 保护，除了：
- `/login`
- `/api/auth/login`
- 静态资源

## 🎯 评分标准

### 技术内容（0-10分）

- **基础分**: 5.0
- **技术深度**: +2.0 (详细 >200字) / +1.0 (中等 >100字) / -1.0 (太短 <20字)
- **技术关键词**: 每个 +0.5 (AI, ML, 开发, 编程, 框架, 工具, 算法)
- **实用性**: +1.0 (教程、工具推荐、最佳实践)
- **广告/营销**: -2.0

### 成人内容（0-10分）

- **基础分**: 5.0
- **媒体质量**: +2.0 (视频) / +1.0 (图片) / -1.0 (无媒体)
- **内容描述**: +0.5 (详细描述) / -0.5 (描述太短)
- **多媒体**: +0.5 (多张图片/视频)
- **广告/营销**: -2.0

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
   - `ACCESS_PASSWORD`
   - `JWT_SECRET`
4. 部署

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 配置自定义域名

在 Vercel 项目设置中添加自定义域名（如 `ca.kedaya.xyz`）。

## 🔧 OpenClaw Agent 集成

### Cron Job 配置

```javascript
{
  "name": "Twitter 首页内容分析",
  "schedule": {
    "kind": "every",
    "everyMs": 300000  // 每 5 分钟
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "使用 agent-browser 访问 Twitter 首页，抓取推文并上传到 content-analyzer"
  }
}
```

### 批量上传示例

```typescript
// 技术内容
const techContents = [
  {
    source: 'twitter',
    url: 'https://x.com/user/status/123',
    summary: '摘要',
    content: '内容',
    score: 8.5,
    analyzedBy: 'OpenClaw Agent'
  }
]

await fetch('https://ca.kedaya.xyz/api/content/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'auth-token=YOUR_TOKEN'
  },
  body: JSON.stringify(techContents)
})

// 成人内容
const adultContents = [
  {
    source: 'twitter',
    url: 'https://x.com/user/status/456',
    summary: '摘要',
    content: '内容',
    score: 7.5,
    analyzedBy: 'OpenClaw Agent'
  }
]

await fetch('https://ca.kedaya.xyz/api/adult-content/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'auth-token=YOUR_TOKEN'
  },
  body: JSON.stringify(adultContents)
})
```

## 💰 成本估算

完全免费：

- **Vercel**: 免费（Hobby 计划）
- **Neon PostgreSQL**: 免费（0.5GB 存储）
- **Edge Runtime**: 免费（更快的响应速度）

## 📈 性能优化

- Next.js 15 App Router
- Edge Runtime（更低延迟）
- Vercel 全球 CDN
- 数据库索引优化
- 客户端状态管理（CSS 切换，40x 更快）
- 只保存最高质量媒体（节省 80% 存储）

## 🎨 设计风格

- **Vercel 极简风格**：黑/白/灰配色
- **Inter 字体**：现代、清晰
- **移动优先**：响应式设计
- **卡片布局**：移动端友好
- **无 Emoji**：使用 lucide-react 图标

## 🔧 开发说明

### 数据库管理

```bash
# 打开 Prisma Studio
npx prisma studio

# 推送数据库变更
npx prisma db push

# 生成 Prisma Client
npx prisma generate
```

### 脚本命令

```bash
# 批量抓取 Twitter 内容
npm run batch-scrape

# 修复缺失媒体
npm run fix-media

# 清理重复媒体
npm run clean-media

# 上传内容
npm run upload -- --file data.json --url https://ca.kedaya.xyz
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

### 认证失败（401）

- 检查 Cookie 是否正确设置
- Token 可能已过期（7天有效期）
- 重新登录获取新 Token

### 媒体提取失败

- 检查 yt-dlp 是否安装
- 检查网络连接
- 尝试使用 snapvid API 或 agent-browser

### Prisma 版本问题

使用 Prisma 5.22.0（Prisma 6.x 在 Vercel/Neon 不稳定）。

## 📝 API 字段说明

### 必填字段

- `source`: 来源（twitter, xiaohongshu, linuxdo）
- `url`: 原文链接（唯一，重复会失败）
- `summary`: 摘要（50-200字）
- `content`: 完整内容
- `score`: 评分（0-10）

### 可选字段

- `title`: 标题
- `analyzedBy`: 分析者名称
- `mediaUrls`: 媒体链接数组（成人内容，可选）

## 🔗 相关链接

- **网站**: https://ca.kedaya.xyz
- **API 文档**: https://ca.kedaya.xyz/api-docs
- **GitHub**: 私有仓库
- **Vercel**: content-analyzer
- **Neon**: PostgreSQL 数据库

## 📄 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ by OpenClaw Agent**
