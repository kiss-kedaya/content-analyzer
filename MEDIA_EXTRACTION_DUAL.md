# Twitter 媒体提取 - 双方案兼容

支持两种媒体提取方案，自动回退机制确保稳定性。

## 方案对比

| 特性 | yt-dlp（方案 1） | agent-browser（方案 2） |
|------|-----------------|----------------------|
| 稳定性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 速度 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 质量 | 自动最高质量 | 手动选择 |
| 依赖 | yt-dlp 二进制 | agent-browser |
| Vercel | ❌ 不支持 | ❌ 不支持 |
| 本地 | ✅ 支持 | ✅ 支持 |
| 代理 | ✅ 支持 | ✅ 支持 |

## 安装

### 方案 1: yt-dlp

**Windows**:
```bash
# 使用 winget
winget install yt-dlp

# 或使用 Python
pip install yt-dlp
```

**macOS**:
```bash
brew install yt-dlp
```

**Linux**:
```bash
sudo apt install yt-dlp
# 或
pip install yt-dlp
```

### 方案 2: agent-browser

```bash
npm install -g agent-browser
```

## 配置

创建 `.env.local` 文件：

```env
# 媒体提取方法
# auto: 自动回退（优先 yt-dlp）
# ytdlp: 仅使用 yt-dlp
# browser: 仅使用 agent-browser
MEDIA_EXTRACTOR_METHOD=auto
```

## 使用方法

### 自动回退模式（推荐）

```typescript
import { extractTwitterMediaUrls } from '@/lib/media-extractor-unified'

// 自动选择最佳方案
const mediaUrls = await extractTwitterMediaUrls(twitterUrl)
```

### 手动指定方案

```typescript
import { extractTwitterMediaUrls } from '@/lib/media-extractor-unified'

// 仅使用 yt-dlp
const mediaUrls = await extractTwitterMediaUrls(twitterUrl, 'ytdlp')

// 仅使用 agent-browser
const mediaUrls = await extractTwitterMediaUrls(twitterUrl, 'browser')

// 自动回退
const mediaUrls = await extractTwitterMediaUrls(twitterUrl, 'auto')
```

## CLI 测试

### 测试两种方案

```bash
npm run test-extractors -- --url "https://twitter.com/user/status/123456789"
```

**输出示例**:
```
🧪 测试两种媒体提取方案

URL: https://twitter.com/user/status/123456789

📋 检查提取器可用性...

yt-dlp: ✅ 可用
agent-browser: ✅ 可用

📋 方案 1: yt-dlp

✅ yt-dlp 提取成功
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

📋 方案 2: agent-browser

✅ agent-browser 提取成功
媒体数量: 2

媒体 1:
  类型: image
  URL: https://pbs.twimg.com/media/...
  尺寸: 1200x675

媒体 2:
  类型: video
  URL: https://video.twimg.com/...
  缩略图: https://pbs.twimg.com/...
  尺寸: 1280x720
  格式: mp4

📋 方案 3: 自动回退（auto）

✅ 自动回退提取成功
媒体数量: 2

✅ 测试完成！
```

### 测试单个方案

**yt-dlp**:
```bash
npm run test-media -- --url "https://twitter.com/user/status/123"
```

**agent-browser**:
```bash
npm run test-media-browser -- --url "https://twitter.com/user/status/123"
```

## 批量抓取

```bash
npm run batch-scrape
```

脚本会自动使用统一接口，优先 yt-dlp，失败时回退到 agent-browser。

## 智能回退机制

```typescript
export async function extractTwitterMedia(url: string, method: 'auto' | 'ytdlp' | 'browser' = 'auto') {
  if (method === 'auto') {
    try {
      // 优先使用 yt-dlp
      return await extractWithYtDlp(url)
    } catch (ytdlpError) {
      console.warn('yt-dlp 失败，回退到 agent-browser')
      
      try {
        // 回退到 agent-browser
        return await extractWithBrowser(url)
      } catch (browserError) {
        console.error('两种方法都失败')
        return []
      }
    }
  }
  
  // 手动指定方法
  if (method === 'ytdlp') return await extractWithYtDlp(url)
  if (method === 'browser') return await extractWithBrowser(url)
}
```

## API 函数

### extractTwitterMedia(url, method?)

提取完整媒体信息：

```typescript
import { extractTwitterMedia } from '@/lib/media-extractor-unified'

const mediaList = await extractTwitterMedia(twitterUrl, 'auto')
// 返回: MediaInfo[]
```

### extractTwitterMediaUrls(url, method?)

仅提取 URL：

```typescript
import { extractTwitterMediaUrls } from '@/lib/media-extractor-unified'

const mediaUrls = await extractTwitterMediaUrls(twitterUrl, 'auto')
// 返回: string[]
```

### extractBatchTwitterMedia(urls, method?)

批量提取：

```typescript
import { extractBatchTwitterMedia } from '@/lib/media-extractor-unified'

const results = await extractBatchTwitterMedia([url1, url2, ...], 'auto')
// 返回: Record<string, string[]>
```

### testExtractors()

测试提取器可用性：

```typescript
import { testExtractors } from '@/lib/media-extractor-unified'

const availability = await testExtractors()
// 返回: { ytdlp: boolean, browser: boolean }
```

## 优势

1. **稳定性**: 双方案确保至少一种可用
2. **灵活性**: 可手动选择或自动回退
3. **兼容性**: 支持本地和 Vercel（需配置）
4. **易用性**: 统一接口，无需关心底层实现

## 故障排除

### yt-dlp 不可用

```bash
# 检查安装
yt-dlp --version

# 重新安装
pip install --upgrade yt-dlp
```

### agent-browser 不可用

```bash
# 检查安装
agent-browser --version

# 重新安装
npm install -g agent-browser
```

### 两种方法都失败

1. 检查网络连接
2. 确认代理配置
3. 验证 Twitter URL 格式
4. 查看错误日志

## 环境变量

```env
# 媒体提取方法
MEDIA_EXTRACTOR_METHOD=auto  # auto | ytdlp | browser
```

## 部署到 Vercel

⚠️ **注意**: 两种方案都无法在 Vercel serverless 上运行。

**解决方案**:
1. 在本地提取媒体
2. 上传到 Vercel 数据库
3. Vercel 仅负责存储和展示

**工作流**:
```
本地 (agent-browser/yt-dlp) → 提取媒体 → 上传到 Vercel → 展示
```

---

**双方案兼容已完成！** 🎉

优先使用 yt-dlp，失败时自动回退到 agent-browser，确保媒体提取的稳定性！
