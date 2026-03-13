---
name: content-analyzer
version: 1.0.0
description: 使用 Content Analyzer 网站进行内容写入、分析、抓取和 Agent 调用的完整指南
secrets:
  - name: CONTENT_ANALYZER_SKILL_KEY
    value: kedaya
---

# Content Analyzer Skill

本技能用于让 Agent 理解并正确使用 Content Analyzer 网站：包括鉴权、内容分析与上传、媒体抓取、Agent 调用等全流程。

## 1. 鉴权

- 除 `/login` 与 `/api/auth/login` 外，所有页面与 API 需要 Cookie：`auth-token`
- 未授权访问 `/api/*` 返回 401 JSON
- 生产 Base URL：`https://ca.kedaya.xyz`
- 本地 Base URL：`http://localhost:3000`

### 登录并保存 Cookie

```bash
curl -X POST https://ca.kedaya.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"password":"your-password"}'
```

后续请求统一使用 `-b cookies.txt`。

---

## 2. 内容写入（技术内容）

### 2.1 创建/更新（按 url upsert）

```bash
curl -X POST https://ca.kedaya.xyz/api/content \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "source":"X",
    "url":"https://x.com/user/status/123",
    "title":"标题",
    "summary":"摘要",
    "content":"完整内容",
    "score":8.5,
    "analyzedBy":"@username"
  }'
```

- `source` 会自动规范化（twitter/x -> X）
- `score` 范围 0-10
- 该接口为 upsert：同一 url 可能更新已有记录

### 2.2 批量上传（最多 100 条）

```bash
curl -X POST https://ca.kedaya.xyz/api/content/batch \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '[
    {
      "source":"X",
      "url":"https://x.com/user/status/123",
      "summary":"摘要",
      "content":"完整内容",
      "score":8.5
    }
  ]'
```

---

## 3. 内容写入（成人内容）

```bash
curl -X POST https://ca.kedaya.xyz/api/adult-content \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "source":"X",
    "url":"https://x.com/user/status/456",
    "summary":"摘要",
    "content":"完整内容",
    "score":7.9
  }'
```

- URL 重复会返回 409

---

## 4. 内容读取

### 4.1 全量列表

```bash
curl "https://ca.kedaya.xyz/api/content?orderBy=score" -b cookies.txt
curl "https://ca.kedaya.xyz/api/adult-content?orderBy=score" -b cookies.txt
```

### 4.2 分页列表（ApiResponse）

```bash
curl "https://ca.kedaya.xyz/api/content/paginated?page=1&pageSize=20&orderBy=score" -b cookies.txt
curl "https://ca.kedaya.xyz/api/adult-content/paginated?page=1&pageSize=20&orderBy=score" -b cookies.txt
```

### 4.3 详情与删除

```bash
curl https://ca.kedaya.xyz/api/content/<id> -b cookies.txt
curl -X DELETE https://ca.kedaya.xyz/api/content/<id> -b cookies.txt
```

---

## 5. 收藏与取消收藏

```bash
curl -X POST https://ca.kedaya.xyz/api/content/<id>/favorite -b cookies.txt
curl -X DELETE https://ca.kedaya.xyz/api/content/<id>/favorite -b cookies.txt
```

---

## 6. Agent 调用

### 6.1 单条 Markdown

```bash
curl https://ca.kedaya.xyz/api/agent/content/<id>/md -b cookies.txt
curl https://ca.kedaya.xyz/api/agent/adult-content/<id>/md -b cookies.txt
```

### 6.2 按日期分页（pageSize 最大 10）

```bash
curl "https://ca.kedaya.xyz/api/agent/content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt" -b cookies.txt
curl "https://ca.kedaya.xyz/api/agent/adult-content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt" -b cookies.txt
```

### 6.3 按日期 Markdown 聚合

```bash
curl "https://ca.kedaya.xyz/api/agent/content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt" -b cookies.txt
curl "https://ca.kedaya.xyz/api/agent/adult-content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt" -b cookies.txt
```

---

## 7. 原文抓取与媒体

### 7.1 原文抓取（优先 jina，失败 fallback defuddle）

```bash
curl "https://ca.kedaya.xyz/api/source?url=https%3A%2F%2Fexample.com" -b cookies.txt
```

### 7.2 媒体预览（仅 x.com/twitter.com）

```bash
curl "https://ca.kedaya.xyz/api/preview-media?url=https%3A%2F%2Fx.com%2Fuser%2Fstatus%2F123" -b cookies.txt
```

可选持久化回填：

```
&persistKind=content&persistId=<id>
```

---

## 8. 统计与偏好分析

```bash
curl https://ca.kedaya.xyz/api/stats -b cookies.txt
curl https://ca.kedaya.xyz/api/preferences/analyze -b cookies.txt
```

---

## 9. 最短路径 Quickstart

1) 登录获取 cookie
2) 上传内容（content/adult-content）
3) 按日期分页拉取（Agent by-date）
4) 媒体预览与原文抓取

---

## 10. 关键校验规则

- `score` 必须在 0~10
- `source` 会被规范化（twitter/x -> X）
- `/api/agent/*/by-date` 的 `pageSize` 最大 10
- `/api/preview-media` 只允许 x.com/twitter.com

---

## 11. 完整 curl 套件

```bash
# 1) 登录
curl -X POST https://ca.kedaya.xyz/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"password":"your-password"}'

# 2) 创建技术内容
curl -X POST https://ca.kedaya.xyz/api/content \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"source":"X","url":"https://x.com/user/status/123","summary":"...","content":"...","score":8.5}'

# 3) Agent 按日期拉取
curl "https://ca.kedaya.xyz/api/agent/content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt" -b cookies.txt

# 4) 原文抓取
curl "https://ca.kedaya.xyz/api/source?url=https%3A%2F%2Fexample.com" -b cookies.txt
```
