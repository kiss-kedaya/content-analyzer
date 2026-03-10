# API 改进实施指南

## 已完成 ✓

### 1. Source 字段规范化工具
- ✓ 创建 `lib/normalize-source.ts` 工具函数
- ✓ 支持 X (Twitter), Linuxdo, Xiaohongshu 等规范化
- ✓ 创建数据库迁移脚本
- ✓ 验证现有数据已规范化（571 条记录都是 X）

## 待完成 TODO

### 2. 应用 Source 规范化到所有 API

需要修改以下文件，在创建/更新内容时应用 `normalizeSource()`:

```typescript
import { normalizeSource } from '@/lib/normalize-source'

// 在创建内容前规范化
const content = await createContent({
  source: normalizeSource(body.source), // 添加规范化
  url: body.url,
  // ...
})
```

**需要修改的文件：**
- [ ] `app/api/content/route.ts` (POST)
- [ ] `app/api/adult-content/route.ts` (POST)
- [ ] `app/api/content/batch/route.ts` (POST)
- [ ] `app/api/adult-content/batch/route.ts` (POST)

### 3. 更新 API 文档

**文件：** `app/api-docs/page.tsx`

#### 3.1 标注必填/可选字段

当前：
```json
{
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent"
}
```

改为：
```json
{
  "source": "X",                 // 必填：来源（自动规范化：twitter→X, linuxdo→Linuxdo）
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选：标题（缺失时后端会自动生成）
  "summary": "内容摘要",         // 必填：摘要
  "content": "完整内容",         // 必填：完整内容
  "score": 8.5,                  // 必填：评分（0-10）
  "analyzedBy": "OpenClaw Agent" // 可选：分析者
}
```

#### 3.2 添加自动补充标题说明

在文档中添加新章节：

```markdown
## 自动字段处理

### 标题自动生成

当创建内容时 `title` 字段为空或缺失，后端会自动分析以下信息生成标题：
1. 数据库中的 `summary`（摘要）
2. 数据库中的 `content`（完整内容）
3. 从 defuddle.md 或 r.jina.ai 获取的原文

使用 Cloudflare Workers AI (GLM-4.7-flash) 生成简洁准确的中文标题（不超过50字）。

**适用范围：** 技术内容和成人内容均支持

**示例：**
```bash
# 不提供 title，后端自动生成
curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b "auth-token=<token>" \\
  -d '{
    "source": "X",
    "url": "https://x.com/user/status/123",
    "summary": "OpenClaw 是一个强大的 AI Agent 框架",
    "content": "详细内容...",
    "score": 8.5
  }'

# 响应中会包含自动生成的 title
{
  "id": "clxxx...",
  "title": "OpenClaw：强大的AI Agent框架", // 自动生成
  ...
}
```

### Source 字段规范化

所有 `source` 字段会自动规范化为统一格式：

| 输入 | 输出 |
|------|------|
| twitter, Twitter, TWITTER | X |
| linuxdo, LinuxDo, LINUXDO | Linuxdo |
| xiaohongshu, XiaoHongShu | Xiaohongshu |
| github, Github, GITHUB | GitHub |

**建议：** 直接使用规范化后的名称（X, Linuxdo, Xiaohongshu 等）
```

### 4. 合并技术内容和成人内容接口（可选，较复杂）

这是一个较大的重构，建议分阶段实施：

#### 阶段 1：实现新的统一接口

创建 `app/api/content-v2/route.ts`:

```typescript
import { normalizeSource } from '@/lib/normalize-source'

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'tech' // tech | adult
  
  const body = await request.json()
  
  // 规范化 source
  const normalizedSource = normalizeSource(body.source)
  
  // 根据 type 选择表
  const table = type === 'adult' ? prisma.adultContent : prisma.content
  
  // 创建内容
  const content = await table.create({
    data: {
      source: normalizedSource,
      url: body.url,
      title: body.title,
      summary: body.summary,
      content: body.content,
      score: body.score,
      analyzedBy: body.analyzedBy
    }
  })
  
  return NextResponse.json(content, { status: 201 })
}
```

#### 阶段 2：保留旧接口作为别名

修改 `app/api/adult-content/route.ts`:

```typescript
import { NextRequest } from 'next/server'

// 重定向到新接口
export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  url.pathname = '/api/content-v2'
  url.searchParams.set('type', 'adult')
  
  return fetch(url, {
    method: 'POST',
    headers: request.headers,
    body: request.body
  })
}
```

#### 阶段 3：更新文档和前端

- 更新 API 文档，推荐使用新接口
- 标记旧接口为 deprecated
- 逐步迁移前端代码

## 实施优先级

1. **高优先级**（立即实施）
   - [x] Source 规范化工具
   - [ ] 应用 Source 规范化到所有 API
   - [ ] 更新 API 文档（字段说明 + 自动标题说明）

2. **中优先级**（本周内）
   - [ ] 添加 Source 规范化示例到文档
   - [ ] 测试所有 API 的 Source 规范化

3. **低优先级**（可选）
   - [ ] 合并接口（需要充分测试和兼容性处理）

## 测试清单

- [ ] 测试 Source 规范化（twitter → X）
- [ ] 测试自动标题生成（技术内容）
- [ ] 测试自动标题生成（成人内容）
- [ ] 测试批量创建的 Source 规范化
- [ ] 验证 API 文档准确性

## 注意事项

1. **向后兼容性**：旧的 source 值（如 twitter）仍然可以使用，会自动转换为 X
2. **数据一致性**：所有新创建的内容都会使用规范化的 source
3. **文档同步**：确保 API 文档与实际行为一致
4. **错误处理**：规范化失败时应该有合理的 fallback
