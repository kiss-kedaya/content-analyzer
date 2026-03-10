# 字段修复脚本

自动修复 Content Analyzer 数据库中缺失的标题和摘要字段。

提供两个版本：
- **基础版本**：使用简单的文本提取规则
- **AI 版本**：使用 Cloudflare Workers AI (GLM-4.7-flash) 智能生成

## 功能

- 自动为缺少标题的内容生成标题
- 自动为缺少摘要的内容生成摘要
- 支持 dry-run 模式（预览而不修改）
- 支持只修复特定字段
- 显示修复前后的统计信息

## AI 版本特性

- 使用 Cloudflare Workers AI (GLM-4.7-flash) 生成高质量标题和摘要
- 优先使用 SourceCache 中的原文（避免重复请求）
- 如果没有缓存，自动调用 jina.ai 获取原文
- 自动保存原文到 SourceCache
- 支持重试机制和错误处理

## 使用方法

### AI 版本（推荐）

修复所有缺失的字段（使用 AI）：

```bash
npm run fix:ai
```

只修复标题（使用 AI）：

```bash
npm run fix:ai:titles
```

只修复摘要（使用 AI）：

```bash
npm run fix:ai:summaries
```

预览模式（不修改数据库）：

```bash
npm run fix:ai:check
```

### 基础版本

修复所有缺失的字段（简单提取）：

```bash
npm run fix:fields
```

其他选项：

```bash
npm run fix:titles      # 只修复标题
npm run fix:summaries   # 只修复摘要
npm run fix:check       # 预览模式
```

## AI 版本工作流程

1. **检测缺失字段**：扫描数据库中缺少标题或摘要的内容
2. **获取原文**：
   - 优先从 SourceCache 获取（避免重复请求）
   - 如果没有缓存，调用 jina.ai 获取
   - 自动保存到 SourceCache
3. **AI 生成**：
   - 使用 Cloudflare Workers AI (GLM-4.7-flash)
   - 生成简洁准确的标题（不超过50字）
   - 生成概括性摘要（100-200字）
4. **更新数据库**：保存生成的标题和摘要

## 提取规则

### AI 版本

**标题生成**：
- 使用 AI 分析原文内容
- 生成简洁、准确的中文标题
- 限制最大长度 100 字符
- Fallback：如果 AI 失败，使用简单提取

**摘要生成**：
- 使用 AI 概括主要内容和关键信息
- 生成 100-200 字的中文摘要
- 限制最大长度 300 字符
- Fallback：如果 AI 失败，使用简单提取

### 基础版本

**标题提取（优先级顺序）**：
1. 从 `summary` 中提取
   - 移除项目名称前缀（如 "bounty-hunter - "）
   - 取第一句话（以句号、问号、感叹号结尾）
   - 如果没有句子，取前 50 个字符
   - 限制最大长度 100 字符
2. 从 `content` 中提取（取第一行非空内容）
3. 使用 `url`（最后的 fallback）

**摘要提取（优先级顺序）**：
1. 从 `content` 中提取
   - 移除 Markdown 标记（标题、粗体、斜体、链接、代码块）
   - 取前 3 句话
   - 限制最大长度 200 字符
2. 使用 `title`
3. 使用 "来源: URL"（最后的 fallback）

## 输出示例

### AI 版本

```
╔════════════════════════════════════════════════════════════╗
║     Content Analyzer - AI 字段修复脚本                     ║
║     Powered by Cloudflare Workers AI (GLM-4.7-flash)      ║
╚════════════════════════════════════════════════════════════╝

=== 数据统计 ===

总内容数: 185
缺少标题: 5 (2.70%)
缺少摘要: 3 (1.62%)

=== 修复缺失的标题（使用 AI） ===

找到 5 条没有标题的内容

[1/5] 处理: https://x.com/example/status/123
  ✓ 使用缓存的原文 (2345 字符)
  → 使用 AI 生成标题...
  ✓ 标题: OpenClaw Agent 系统架构详解

[2/5] 处理: https://x.com/example/status/456
  → 从 jina.ai 获取原文...
  ✓ 获取成功 (1890 字符)
  → 使用 AI 生成标题...
  ✓ 标题: 如何使用 AI 提升开发效率

✓ 成功修复 5 条内容的标题

=== 数据统计 ===

总内容数: 185
缺少标题: 0 (0.00%)
缺少摘要: 0 (0.00%)

╔════════════════════════════════════════════════════════════╗
║  ✓ 修复完成！共修复 8   条记录                        ║
╚════════════════════════════════════════════════════════════╝
```

## 配置

### Cloudflare Workers AI

AI 版本使用 Cloudflare Workers AI API，配置信息在脚本中：

```javascript
const CF_ACCOUNT_ID = '554575d3a47f5fd86b1f60fbbe8d9967';
const CF_API_TOKEN = 'dJDdE5EF8Q8aATIJxoRqZPQngMpx4G1PWWRsbtiF';
const CF_MODEL = '@cf/zai-org/glm-4.7-flash';
```

如需修改，请编辑 `scripts/fix-missing-fields-ai.js`。

## 注意事项

1. **备份数据**：运行脚本前建议备份数据库
2. **测试环境**：建议先在测试环境运行 `--dry-run` 模式
3. **API 配额**：AI 版本会调用 Cloudflare Workers AI，注意 API 配额
4. **网络请求**：AI 版本可能需要调用 jina.ai，确保网络连接正常
5. **数据质量**：AI 生成的内容通常比简单提取更准确
6. **重复运行**：脚本可以安全地重复运行，只会处理缺失的字段

## 性能对比

| 特性 | 基础版本 | AI 版本 |
|------|---------|---------|
| 速度 | 快 | 较慢（需要 AI 推理） |
| 质量 | 一般 | 高 |
| 网络请求 | 无 | 可能需要（jina.ai + Cloudflare AI） |
| 适用场景 | 快速修复、批量处理 | 高质量内容、重要文章 |

## 定期维护

建议定期运行此脚本（例如每周一次），以确保所有内容都有完整的标题和摘要。

可以通过 cron job 或 CI/CD 流程自动化：

```bash
# 每周日凌晨 2 点运行（使用 AI 版本）
0 2 * * 0 cd /path/to/content-analyzer && npm run fix:ai
```

## 故障排除

### AI 生成失败

如果 AI 生成失败，脚本会自动 fallback 到简单提取：

```
✕ AI 生成标题失败: Cloudflare AI API error: 429 Too Many Requests
→ 使用 fallback 方法生成标题
```

### jina.ai 请求失败

如果 jina.ai 请求失败，脚本会尝试使用现有的 content 或 summary：

```
✕ Jina.ai 请求失败: Network error
→ 使用现有内容生成
```

### 缓存问题

如果 SourceCache 中的数据有问题，可以手动清理：

```sql
DELETE FROM "SourceCache" WHERE status = 'failed';
```

