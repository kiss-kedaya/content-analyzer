# 批量上传功能

Content Analyzer 支持批量上传内容，提供 API 和 CLI 两种方式。

## 📡 API 方式

### 端点

```
POST /api/content/batch
```

### 请求格式

```json
[
  {
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "标题（可选）",
    "summary": "摘要",
    "content": "完整内容",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  },
  {
    "source": "xiaohongshu",
    "url": "https://xiaohongshu.com/...",
    "summary": "摘要",
    "content": "完整内容",
    "score": 7.0
  }
]
```

### 响应格式

```json
{
  "success": 2,
  "failed": 0,
  "total": 2,
  "errors": [],
  "created": [
    {
      "index": 0,
      "id": "clxxx...",
      "url": "https://twitter.com/user/status/123"
    },
    {
      "index": 1,
      "id": "clyyy...",
      "url": "https://xiaohongshu.com/..."
    }
  ]
}
```

### 限制

- 最大批量大小：100 条
- 必填字段：`source`, `url`, `summary`, `content`, `score`
- 评分范围：0-10

### 示例（curl）

```bash
curl -X POST https://content-analyzer-kappa.vercel.app/api/content/batch \
  -H "Content-Type: application/json" \
  -d '[
    {
      "source": "twitter",
      "url": "https://twitter.com/user/status/123",
      "title": "Example",
      "summary": "Summary",
      "content": "Content",
      "score": 8.5,
      "analyzedBy": "OpenClaw Agent"
    }
  ]'
```

### 示例（JavaScript/TypeScript）

```typescript
const contents = [
  {
    source: 'twitter',
    url: 'https://twitter.com/user/status/123',
    title: 'Example Tweet',
    summary: 'This is a summary',
    content: 'Full content here...',
    score: 8.5,
    analyzedBy: 'OpenClaw Agent'
  },
  // ... 更多内容
]

const response = await fetch('https://content-analyzer-kappa.vercel.app/api/content/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(contents)
})

const result = await response.json()
console.log(`Success: ${result.success}, Failed: ${result.failed}`)
```

## 🖥️ CLI 方式

### 安装依赖

```bash
npm install
```

### 准备数据文件

创建 JSON 文件（例如 `data.json`）：

```json
[
  {
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "Example Tweet",
    "summary": "This is a summary",
    "content": "Full content here...",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  }
]
```

参考示例文件：`scripts/example-data.json`

### 使用方法

**本地开发环境**：

```bash
npm run upload -- --file data.json
```

**生产环境**：

```bash
npm run upload -- --file data.json --url https://content-analyzer-kappa.vercel.app
```

**查看帮助**：

```bash
npm run upload -- --help
```

### CLI 参数

- `--file <path>` - JSON 文件路径（必填）
- `--url <api-url>` - API 基础 URL（默认：http://localhost:3000）
- `--help` - 显示帮助信息

### 输出示例

```
📂 Reading file: data.json
✅ Loaded 4 items

📤 Uploading 4 items to http://localhost:3000/api/content/batch...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Upload Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:   4
✅ Success: 4
❌ Failed:  0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Successfully created:
  [0] https://twitter.com/example/status/123456789
      ID: clxxx...
  [1] https://xiaohongshu.com/explore/123456
      ID: clyyy...
  [2] https://linux.do/t/topic/123456
      ID: clzzz...
  [3] https://twitter.com/example/status/987654321
      ID: clwww...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🤖 OpenClaw Agent 集成

在 OpenClaw Agent 中使用批量上传：

```typescript
// 收集内容
const contents = []

// 分析多个来源
for (const url of urls) {
  const analyzed = await analyzeContent(url)
  contents.push({
    source: analyzed.source,
    url: analyzed.url,
    title: analyzed.title,
    summary: analyzed.summary,
    content: analyzed.content,
    score: analyzed.score,
    analyzedBy: 'OpenClaw Agent'
  })
}

// 批量上传
const response = await fetch('https://content-analyzer-kappa.vercel.app/api/content/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(contents)
})

const result = await response.json()
console.log(`Uploaded ${result.success}/${result.total} items`)
```

## 📝 数据格式说明

### 必填字段

- `source` - 来源（twitter, xiaohongshu, linuxdo 等）
- `url` - 原文链接（必须唯一）
- `summary` - 内容摘要
- `content` - 完整内容
- `score` - 评分（0-10）

### 可选字段

- `title` - 标题
- `analyzedBy` - 分析者名称

### 字段验证

- `url` 必须唯一，重复的 URL 会导致创建失败
- `score` 必须在 0-10 之间
- `summary` 和 `content` 不能为空

## ⚠️ 注意事项

1. **批量大小限制**：单次最多上传 100 条内容
2. **URL 唯一性**：重复的 URL 会导致创建失败
3. **错误处理**：部分失败不会影响其他内容的创建
4. **性能考虑**：大批量上传建议分批进行

## 🔧 故障排查

### 问题：上传失败

**检查**：
- API URL 是否正确
- JSON 格式是否正确
- 必填字段是否完整
- 评分是否在 0-10 范围内

### 问题：部分内容创建失败

**检查**：
- 查看返回的 `errors` 数组
- 检查失败项的 URL 是否重复
- 验证失败项的字段是否符合要求

### 问题：CLI 工具无法运行

**解决**：
```bash
# 确保安装了依赖
npm install

# 确保 tsx 可用
npx tsx --version
```

## 📚 相关文档

- [API 文档](https://content-analyzer-kappa.vercel.app/api-docs)
- [README.md](./README.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
