# Twitter/X URL 工具

支持 twitter.com 和 x.com 两种 URL 格式的工具函数。

## 功能

### isValidTwitterUrl(url)

验证是否为有效的 Twitter/X URL。

```typescript
import { isValidTwitterUrl } from '@/lib/twitter-url-utils'

isValidTwitterUrl('https://x.com/user/status/123')        // true
isValidTwitterUrl('https://twitter.com/user/status/123')  // true
isValidTwitterUrl('https://example.com')                  // false
```

### normalizeToTwitter(url)

将 x.com 转换为 twitter.com（yt-dlp 可能需要）。

```typescript
import { normalizeToTwitter } from '@/lib/twitter-url-utils'

normalizeToTwitter('https://x.com/user/status/123')
// 返回: 'https://twitter.com/user/status/123'

normalizeToTwitter('https://twitter.com/user/status/123')
// 返回: 'https://twitter.com/user/status/123'
```

### normalizeToX(url)

将 twitter.com 转换为 x.com。

```typescript
import { normalizeToX } from '@/lib/twitter-url-utils'

normalizeToX('https://twitter.com/user/status/123')
// 返回: 'https://x.com/user/status/123'

normalizeToX('https://x.com/user/status/123')
// 返回: 'https://x.com/user/status/123'
```

### parseTwitterUrl(url)

从 URL 提取用户名和状态 ID。

```typescript
import { parseTwitterUrl } from '@/lib/twitter-url-utils'

parseTwitterUrl('https://x.com/elonmusk/status/123456789')
// 返回: { username: 'elonmusk', statusId: '123456789' }

parseTwitterUrl('https://twitter.com/elonmusk/status/123456789')
// 返回: { username: 'elonmusk', statusId: '123456789' }
```

### buildTwitterUrl(username, statusId, useX?)

构建 Twitter URL。

```typescript
import { buildTwitterUrl } from '@/lib/twitter-url-utils'

buildTwitterUrl('elonmusk', '123456789', true)
// 返回: 'https://x.com/elonmusk/status/123456789'

buildTwitterUrl('elonmusk', '123456789', false)
// 返回: 'https://twitter.com/user/status/123456789'
```

## 支持的 URL 格式

✅ 支持的格式：
- `https://x.com/user/status/123`
- `https://twitter.com/user/status/123`
- `https://www.x.com/user/status/123`
- `https://www.twitter.com/user/status/123`
- `http://x.com/user/status/123`（自动转换为 https）
- `http://twitter.com/user/status/123`（自动转换为 https）

❌ 不支持的格式：
- 不包含 `/status/` 的 URL
- 其他域名的 URL

## 使用场景

### 媒体提取

```typescript
import { extractTwitterMediaUrls } from '@/lib/media-extractor-unified'
import { isValidTwitterUrl } from '@/lib/twitter-url-utils'

const url = 'https://x.com/user/status/123'

if (isValidTwitterUrl(url)) {
  const mediaUrls = await extractTwitterMediaUrls(url)
  console.log(mediaUrls)
}
```

### URL 转换

```typescript
import { normalizeToTwitter, normalizeToX } from '@/lib/twitter-url-utils'

// yt-dlp 可能需要 twitter.com 格式
const twitterUrl = normalizeToTwitter('https://x.com/user/status/123')
const info = await ytDlp.getVideoInfo(twitterUrl)

// 显示时使用 x.com 格式
const xUrl = normalizeToX(twitterUrl)
console.log('查看原文:', xUrl)
```

### URL 解析

```typescript
import { parseTwitterUrl, buildTwitterUrl } from '@/lib/twitter-url-utils'

const url = 'https://x.com/elonmusk/status/123456789'
const parsed = parseTwitterUrl(url)

if (parsed) {
  console.log('用户名:', parsed.username)
  console.log('状态 ID:', parsed.statusId)
  
  // 重建 URL
  const newUrl = buildTwitterUrl(parsed.username, parsed.statusId, true)
  console.log('新 URL:', newUrl)
}
```

## 错误处理

所有函数都会验证 URL 格式：

```typescript
import { normalizeToTwitter } from '@/lib/twitter-url-utils'

try {
  normalizeToTwitter('https://example.com')
} catch (error) {
  console.error(error.message) // 'Invalid Twitter/X URL'
}
```

## 集成

URL 工具已集成到媒体提取器中：

- `lib/media-extractor-unified.ts` - 自动验证和转换 URL
- `lib/media-extractor-browser.ts` - 支持两种格式
- `scripts/batch-scrape.ts` - 批量处理时自动处理

## 注意事项

1. **yt-dlp 兼容性**: yt-dlp 可能需要 twitter.com 格式，工具会自动转换
2. **agent-browser 兼容性**: agent-browser 支持两种格式
3. **URL 标准化**: 所有 URL 都会转换为 https 协议
4. **大小写**: URL 中的用户名保持原样（Twitter 用户名不区分大小写）

---

**Twitter/X URL 工具已完成！** 🎉

完全支持 twitter.com 和 x.com 两种 URL 格式！
