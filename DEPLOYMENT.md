# 部署指南 (Deployment Guide) v2.0

## 📋 前置准备

### 1. 账号注册

- [ ] [GitHub](https://github.com) - 代码托管
- [ ] [Neon](https://neon.tech) - PostgreSQL 数据库
- [ ] [Vercel](https://vercel.com) - 部署平台

### 2. 工具安装

- [ ] Node.js 20+
- [ ] Git

## 🗄️ 步骤 1：创建 Neon 数据库

1. 访问 [Neon Console](https://console.neon.tech)
2. 点击 "Create Project"
3. 选择区域（推荐：US East）
4. 复制连接字符串：
   ```
   postgresql://user:password@host/database?sslmode=require
   ```
5. 保存到 `.env` 文件

## 🚀 步骤 2：部署到 Vercel

### 2.1 连接 GitHub

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **New Project**
3. 选择 **Import Git Repository**
4. 选择你的 GitHub 仓库

### 2.2 配置项目

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 2.3 添加环境变量

在 **Environment Variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Neon 连接字符串 |

### 2.4 部署

点击 **Deploy**，等待构建完成。

## 🔧 步骤 3：初始化数据库

### 3.1 本地初始化

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/content-analyzer.git
cd content-analyzer

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填写 DATABASE_URL

# 4. 生成 Prisma Client
npx prisma generate

# 5. 推送数据库 schema
npx prisma db push
```

### 3.2 验证

```bash
# 打开 Prisma Studio 查看数据库
npx prisma studio
```

## 🧪 步骤 4：测试

### 4.1 本地测试

```bash
# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 4.2 测试 API

```bash
# 创建测试内容
curl -X POST http://localhost:3000/api/content \
  -H "Content-Type: application/json" \
  -d '{
    "source": "twitter",
    "url": "https://twitter.com/test/status/123",
    "title": "测试内容",
    "summary": "这是一条测试内容的摘要",
    "content": "这是完整的测试内容...",
    "score": 8.5,
    "analyzedBy": "Test Agent"
  }'

# 获取内容列表
curl http://localhost:3000/api/content

# 获取统计信息
curl http://localhost:3000/api/stats
```

### 4.3 生产环境测试

1. 访问你的 Vercel 域名
2. 检查页面是否正常显示
3. 测试 API 接口
4. 测试删除功能

## 🤖 步骤 5：OpenClaw Agent 集成

### 5.1 创建上传函数

在 OpenClaw Agent 中创建工具函数：

```typescript
// lib/content-uploader.ts
export async function uploadContent(data: {
  source: string
  url: string
  title?: string
  summary: string
  content: string
  score: number
}) {
  const response = await fetch('https://your-domain.vercel.app/api/content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      analyzedBy: 'OpenClaw Agent'
    })
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  return await response.json()
}
```

### 5.2 使用示例

```typescript
// 分析并上传内容
const analysis = {
  source: 'twitter',
  url: 'https://twitter.com/user/status/123',
  title: '示例推文',
  summary: '这是一条关于技术的推文',
  content: '完整的推文内容...',
  score: 8.5
}

const result = await uploadContent(analysis)
console.log('Content uploaded:', result.id)
```

## 📊 步骤 6：监控

### 6.1 Vercel Analytics

1. 进入 Vercel 项目
2. 查看 **Analytics** 标签
3. 监控访问量、性能指标

### 6.2 Neon 监控

1. 进入 Neon Console
2. 查看 **Monitoring** 标签
3. 监控数据库大小、查询性能

## 🔧 故障排查

### 问题 1：Vercel 构建失败

**原因**：环境变量未设置

**解决**：
1. 检查 `DATABASE_URL` 是否正确
2. 确认格式包含 `?sslmode=require`
3. 查看构建日志

### 问题 2：数据库连接失败

**原因**：连接字符串错误

**解决**：
1. 检查 `DATABASE_URL` 格式
2. 确认 SSL 模式：`?sslmode=require`
3. 测试连接：`npx prisma db push`

### 问题 3：API 请求失败

**原因**：CORS 或数据格式错误

**解决**：
1. 检查请求头：`Content-Type: application/json`
2. 验证数据格式
3. 查看浏览器控制台

### 问题 4：页面不更新

**原因**：缓存问题

**解决**：
1. 检查 `revalidate` 配置
2. 清除浏览器缓存
3. 重新部署

## 🔄 更新流程

### 代码更新

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装新依赖
npm install

# 3. 更新数据库
npx prisma db push

# 4. 推送到 GitHub
git push origin main
```

Vercel 会自动重新部署。

### 数据库迁移

```bash
# 1. 修改 prisma/schema.prisma
# 2. 生成迁移
npx prisma migrate dev --name your_migration_name

# 3. 推送到生产
npx prisma migrate deploy
```

## 📈 扩展

### 添加自定义域名

1. 在 Vercel 项目设置中
2. 进入 **Domains**
3. 添加自定义域名
4. 配置 DNS

### 添加环境变量

1. 在 Vercel 项目设置中
2. 进入 **Environment Variables**
3. 添加新变量
4. 重新部署

## 🎯 最佳实践

### 1. 定期备份

```bash
# 导出数据库
npx prisma db pull

# 备份到 GitHub
git add prisma/schema.prisma
git commit -m "backup: database schema"
git push
```

### 2. 监控成本

- 每月检查 Vercel 使用量
- 监控 Neon 数据库大小
- 查看 API 请求数

### 3. 安全更新

- 定期更新依赖：`npm update`
- 检查安全漏洞：`npm audit`
- 更新 Node.js 版本

## 📞 获取帮助

- **GitHub Issues**: 提交问题
- **文档**: 查看 README.md 和 ARCHITECTURE.md
- **API 文档**: 访问 /api-docs

---

**部署完成！** 🎉

访问你的网站，开始使用内容分析系统。

**下一步**：
- [ ] 配置自定义域名
- [ ] 集成 OpenClaw Agent
- [ ] 测试 API 接口
- [ ] 分享给团队

---

**文档版本**: 2.0.0  
**最后更新**: 2026-03-04
