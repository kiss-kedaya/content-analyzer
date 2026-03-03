# Twitter 媒体提取功能（agent-browser 版本）

使用 agent-browser 从 Twitter 推文中提取图片和视频的直接下载链接。

## 技术方案

使用 **agent-browser + DOM 解析** 提取媒体链接：
- ✅ 无需额外依赖（使用已有的 agent-browser）
- ✅ 直接从页面 DOM 提取
- ✅ 支持图片和视频
- ✅ 本地运行（agent-browser 无法在 Vercel 上运行）

## 使用方法

### 单个 URL 提取

```bash
npm run test-media-browser -- --url "https://twitter.com/user/status/123456789"
```

**输出示例**:
```
🔍 提取 Twitter 媒体链接（使用 agent-browser）...
URL: https://twitter.com/user/status/123456789

[Browser] 打开 Twitter 页面: https://twitter.com/user/status/123456789
[Browser] 找到 2 张图片
[Browser] 找到 1 个视频
[Browser] 总计 3 个媒体

✅ 提取成功！

媒体数量: 3

媒体 1:
  类型: image
  URL: https://pbs.twimg.com/media/...?format=jpg&name=large
  尺寸: 1200x675

媒体 2:
  类型: image
  URL: https://pbs.twimg.com/media/...?format=jpg&name=large
  尺寸: 1200x675

媒体 3:
  类型: video
  URL: https://video.twimg.com/...
  缩略图: https://pbs.twimg.com/...
  尺寸: 1280x720
  格式: mp4
```

### 批量提取（集成到抓取脚本）

```bash
npm run batch-scrape
```

脚本会自动：
1. 使用 agent-browser 打开每个 Twitter 页面
2. 从 DOM 提取图片和视频链接
3. 分析内容并打分
4. 批量上传到对应的 API

## 提取逻辑

### 图片提取

```typescript
// 查找所有包含 pbs.twimg.com 的图片
const images = Array.from(document.querySelectorAll('img[src*="pbs.twimg.com"]'))
  .map(img => ({
    type: 'image',
    url: img.src.replace(/&name=\w+/, '&name=large'), // 强制使用 large 尺寸
    width: img.naturalWidth,
    height: img.naturalHeight
  }))
  .filter(img => img.url.includes('/media/')) // 只保留媒体图片
```

### 视频提取

```typescript
// 查找所有 video 标签
const videos = Array.from(document.querySelectorAll('video'))
  .map(video => {
    const source = video.querySelector('source');
    return {
      type: 'video',
      url: source ? source.src : '',
      thumbnail: video.poster || '',
      width: video.videoWidth,
      height: video.videoHeight,
      format: 'mp4'
    };
  })
  .filter(v => v.url && v.url.includes('video.twimg.com'))
```

## API 函数

### extractTwitterMediaBrowser(url)

提取完整媒体信息：

```typescript
import { extractTwitterMediaBrowser } from '@/lib/media-extractor-browser'

const mediaList = await extractTwitterMediaBrowser(twitterUrl)
// 返回: MediaInfo[]
```

### extractTwitterMediaUrlsBrowser(url)

仅提取 URL：

```typescript
import { extractTwitterMediaUrlsBrowser } from '@/lib/media-extractor-browser'

const mediaUrls = await extractTwitterMediaUrlsBrowser(twitterUrl)
// 返回: string[]
```

### extractBatchTwitterMediaBrowser(urls)

批量提取：

```typescript
import { extractBatchTwitterMediaBrowser } from '@/lib/media-extractor-browser'

const results = await extractBatchTwitterMediaBrowser([url1, url2, ...])
// 返回: Record<string, string[]>
```

## 集成到上传流程

```typescript
import { extractTwitterMediaUrlsBrowser } from '@/lib/media-extractor-browser'

// 提取媒体链接
const mediaUrls = await extractTwitterMediaUrlsBrowser(twitterUrl)

// 上传到数据库
await fetch('https://ca.kedaya.xyz/api/adult-content', {
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
- 从 video 标签的 source 提取

## 优势

1. **无需额外依赖**: 使用已有的 agent-browser
2. **直接提取**: 从页面 DOM 直接获取媒体链接
3. **灵活**: 可以提取更多信息（尺寸、格式等）
4. **稳定**: 不依赖第三方 API
5. **支持代理**: agent-browser 已配置代理（127.0.0.1:7890）

## 限制

1. **本地运行**: agent-browser 无法在 Vercel serverless 上运行
2. **需要浏览器**: 需要安装 Chrome/Chromium
3. **速度**: 比 API 调用慢（需要打开浏览器）
4. **网络**: 需要能访问 Twitter（可能需要代理）

## 架构

- **本地**: 使用 agent-browser 提取媒体
- **Vercel**: 仅存储和展示数据
- **上传流程**: 本地提取 → 上传到 Vercel

## 备用方案

如果 DOM 提取失败，可以使用 `extractTwitterMediaFromState()` 从 `window.__INITIAL_STATE__` 提取：

```typescript
import { extractTwitterMediaFromState } from '@/lib/media-extractor-browser'

const mediaList = await extractTwitterMediaFromState(twitterUrl)
```

这会从 Twitter 的全局状态对象中提取媒体数据，通常包含更完整的信息。

## 故障排除

### agent-browser 未找到

```bash
# 安装 agent-browser
npm install -g agent-browser
```

### 页面加载失败

- 检查网络连接
- 确认代理配置（127.0.0.1:7890）
- 增加等待时间（默认 3 秒）

### 未找到媒体

- 推文可能没有媒体
- 推文可能已被删除
- 页面结构可能已变化（需要更新选择器）

---

**媒体提取功能（agent-browser 版本）已完成！** 🎉

使用 agent-browser 稳定提取 Twitter 图片和视频链接！
