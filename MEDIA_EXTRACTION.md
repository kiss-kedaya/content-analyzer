# Twitter 媒体提取功能

自动从 Twitter 推文中提取图片和视频的直接下载链接。

## 技术方案

使用 **yt-dlp** 提取媒体链接：
- ✅ 稳定可靠
- ✅ 自动选择最高质量
- ✅ 支持图片和视频
- ✅ 无需解析复杂的 JavaScript

## API 使用

### 单个 URL 提取

```bash
POST /api/extract-media
Content-Type: application/json

{
  "url": "https://twitter.com/user/status/123456789"
}
```

**响应**:
```json
{
  "url": "https://twitter.com/user/status/123456789",
  "media": [
    {
      "type": "video",
      "url": "https://video.twimg.com/...",
      "thumbnail": "https://pbs.twimg.com/...",
      "width": 1280,
      "height": 720,
      "format": "mp4"
    },
    {
      "type": "image",
      "url": "https://pbs.twimg.com/media/...",
      "width": 1200,
      "height": 675
    }
  ],
  "count": 2
}
```

### 批量 URL 提取

```bash
POST /api/extract-media
Content-Type: application/json

{
  "urls": [
    "https://twitter.com/user/status/123456789",
    "https://twitter.com/user/status/987654321"
  ]
}
```

**响应**:
```json
{
  "results": {
    "https://twitter.com/user/status/123456789": [
      "https://video.twimg.com/...",
      "https://pbs.twimg.com/media/..."
    ],
    "https://twitter.com/user/status/987654321": [
      "https://pbs.twimg.com/media/..."
    ]
  },
  "total": 2
}
```

## CLI 测试

```bash
# 测试单个 URL
npm run test-media -- --url "https://twitter.com/user/status/123456789"
```

**输出示例**:
```
🔍 提取 Twitter 媒体链接...
URL: https://twitter.com/user/status/123456789

✅ 提取成功！

媒体数量: 2

媒体 1:
  类型: video
  URL: https://video.twimg.com/...
  缩略图: https://pbs.twimg.com/...
  尺寸: 1280x720
  格式: mp4

媒体 2:
  类型: image
  URL: https://pbs.twimg.com/media/...
  尺寸: 1200x675
```

## 集成到内容上传

在上传成人内容时自动提取媒体链接：

```typescript
import { extractTwitterMediaUrls } from '@/lib/media-extractor'

// 提取媒体链接
const mediaUrls = await extractTwitterMediaUrls(twitterUrl)

// 上传到数据库
await fetch('/api/adult-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: 'twitter',
    url: twitterUrl,
    summary: '...',
    content: '...',
    score: 8.5,
    mediaUrls: mediaUrls,  // 自动提取的媒体链接
    analyzedBy: 'OpenClaw Agent'
  })
})
```

## 媒体类型

### 图片
- URL 格式: `https://pbs.twimg.com/media/{id}?format=jpg&name=large`
- 支持格式: jpg, png, webp
- 自动选择最高质量（large）

### 视频
- URL 格式: `https://video.twimg.com/...`
- 支持格式: mp4
- 自动选择最高质量（bitrate）

## 错误处理

如果提取失败，API 会返回错误信息：

```json
{
  "error": "Failed to extract media",
  "message": "Invalid Twitter URL"
}
```

常见错误：
- **Invalid Twitter URL**: URL 格式不正确
- **Tweet not found**: 推文已被删除或不存在
- **Private account**: 账号为私密账号
- **Rate limit**: 请求过于频繁

## 性能优化

- ✅ 自动去重（基于 URL）
- ✅ 批量提取支持
- ✅ 错误隔离（单个失败不影响其他）
- ✅ 缓存支持（可选）

## 依赖

- **yt-dlp-wrap**: Node.js wrapper for yt-dlp
- **yt-dlp**: 自动下载（首次运行时）

## 注意事项

1. **首次运行**: yt-dlp 会自动下载二进制文件（~10MB）
2. **网络要求**: 需要能访问 Twitter（可能需要代理）
3. **速度**: 提取速度取决于网络和 Twitter 响应时间
4. **限制**: Twitter 可能有速率限制

## 未来优化

- [ ] 添加缓存机制（避免重复提取）
- [ ] 支持更多平台（YouTube, Instagram 等）
- [ ] 添加进度回调
- [ ] 支持代理配置
- [ ] 添加重试机制

---

**媒体提取功能已完成！** 🎉

使用 yt-dlp 稳定提取 Twitter 图片和视频链接。
