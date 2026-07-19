# Snapvid 媒体协议漂移报告

## 1. 任务摘要

- Target：`https://snapvid.net/en`、`POST /api/userverify`、`POST /api/ajaxSearch`
- Objective：确认 Content Analyzer 中旧 Snapvid 两步媒体协议的 403 原因，并判断能否可靠重放
- Requirements：standard；保留请求头、载荷样本、Token 流程证据
- Boundaries：仅对用户给出的单条 X URL 执行两次正常表单请求；不绕过 Cloudflare Challenge

## 2. 核心发现

1. 旧协议路径仍存在于当前网页脚本中，但两个 POST 接口现在都受 Cloudflare Managed Challenge 保护。
2. 403 发生在 Token 签发前；不存在可供 Content Analyzer “更新”的 Snapvid Token。
3. Snapvid 自己的真实网页点击流同样失败，因此补齐普通请求头或 Cookie 不能形成稳定的服务端方案。
4. 官方 X API v2 的 `attachments.media_keys` + `media.fields=variants` 能返回该推文的直接 MP4/HLS 地址。

## 3. 证据表

| 证据 | 结果 |
| --- | --- |
| 页面 URL | `https://snapvid.net/en` |
| 当前 DOM SHA-256 | `1112974e2daa875062ca0454249730be7052156a22118fa5b499a92b00869d32` |
| `main.min.js?v=5` SHA-256 | `b169ceec06e636ae56852ede2e5ada4336fed096121be127a14cacd3ffc89064` |
| Bundle 定级 | T0，仅压缩；101074 字符；无 WASM、无 `eval(` |
| 浏览器 `POST /api/userverify` | 403，`cf-mitigated: challenge`，响应为 `Just a moment...` |
| 浏览器 `POST /api/ajaxSearch` | 403，`cf-mitigated: challenge`，响应为 `Just a moment...` |
| 无浏览器 Cookie 的协议重放 | `/api/userverify` 仍为 Challenge 403；后续接口即使返回 HTTP 200，也没有有效 Token 或媒体 |
| Vercel 服务端旧实现 | 同样在 `/api/userverify` 得到 403 |

## 4. 调用链

`提交 X URL → /api/userverify → Cloudflare Managed Challenge (403) → 无 Token → /api/ajaxSearch → Cloudflare Managed Challenge (403)`

## 5. 风险与影响

- Snapvid 不是稳定的服务端依赖；Challenge 策略可继续变化。
- 旧接口把提取失败包装成 HTTP 200 并允许 CDN 陈旧缓存，会把暂时故障放大为跨设备持续空结果。
- 官方 X API 需要服务端凭据与相应 API 额度，但能直接返回媒体 variants，并可在首次请求后写入数据库/R2，避免重复调用。

## 6. FACTS / INFERENCES / UNKNOWNS

### FACTS

- 两条 Snapvid API 在真实浏览器与服务端重放中均为 Managed Challenge 403。
- 官方 X API 对目标推文返回 4 个 MP4 variants 和一个 HLS variant。

### INFERENCES

- 当前 403 是 Snapvid 边缘防护策略导致，而不是 Content Analyzer 生成了过期 Token。
- 基于官方 variants 的一次提取、持久化、R2 归档链路更适合本项目。

### UNKNOWNS

- Snapvid 是否会在未来撤销对应 Challenge，无法由客户端保证。
- X API 的实际费用和限额取决于用户开发者账户方案。

## 7. 下一步行动

1. 使用服务端 `X_API_BEARER_TOKEN` 调用官方媒体展开。
2. 成功结果写入 `MediaCache` 和内容记录的 `mediaUrls`。
3. 所有 preview 响应设置 `no-store`；提取失败返回 502，不再伪装为成功。
4. 书签导入时携带 `media.fields=variants`，直接保存移动端兼容 MP4。

## 8. 交付物

- `scripts/web_replay.js`
- `lib/media-extractor-x-api.ts`
- `docs/Reverse_Report_CN.md`

## 9. 复现

```powershell
node scripts/web_replay.js "https://x.com/budingPu/status/2078006193696772377"
```

预期输出：Token 请求显示 `status: 403`、`cloudflareMitigation: challenge`；后续请求没有有效 Token 或媒体结果。
