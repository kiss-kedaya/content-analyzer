# Content Analyzer 来源统一与 Vercel 优化设计

日期：2026-03-10

## 目标
1. 历史与新增数据中的 `twitter/Twitter` 全部统一为 `X`。
2. 修复统计卡片和来源标签计数错误。
3. 结合 Vercel 场景继续减少重复请求，提高缓存命中率。

## 方案
- 数据库执行一次性迁移：`twitter/Twitter -> X`。
- 创建/更新内容时统一归一化 source 值。
- 前端来源标签与统计全部按 `X` 处理。
- `/api/preview-media` 命中缓存时返回短期公共缓存头，外部提取成功结果也返回缓存头。

## 验证
- 数据库中不再存在 `twitter` / `Twitter`。
- 首页统计卡片显示 `X` 且计数正确。
- 新上传 twitter 内容入库后 source 为 `X`。
- `npm run build` 通过。
