# 字段修复脚本

自动修复 Content Analyzer 数据库中缺失的标题和摘要字段。

## 功能

- 自动为缺少标题的内容生成标题
- 自动为缺少摘要的内容生成摘要
- 支持 dry-run 模式（预览而不修改）
- 支持只修复特定字段
- 显示修复前后的统计信息

## 使用方法

### 基本用法

修复所有缺失的字段（标题和摘要）：

```bash
node scripts/fix-missing-fields.js
```

### 高级选项

只修复标题：

```bash
node scripts/fix-missing-fields.js --title-only
```

只修复摘要：

```bash
node scripts/fix-missing-fields.js --summary-only
```

预览模式（不修改数据库）：

```bash
node scripts/fix-missing-fields.js --dry-run
```

## 提取规则

### 标题提取

优先级顺序：

1. **从 summary 中提取**
   - 移除项目名称前缀（如 "bounty-hunter - "）
   - 取第一句话（以句号、问号、感叹号结尾）
   - 如果没有句子，取前 50 个字符
   - 限制最大长度 100 字符

2. **从 content 中提取**
   - 取第一行非空内容
   - 应用相同的提取规则

3. **使用 URL**
   - 如果以上都失败，使用原始 URL

### 摘要提取

优先级顺序：

1. **从 content 中提取**
   - 移除 Markdown 标记（标题、粗体、斜体、链接、代码块）
   - 取前 3 句话
   - 限制最大长度 200 字符

2. **使用 title**
   - 如果 content 为空，使用标题

3. **使用 URL**
   - 如果以上都失败，使用 "来源: URL"

## 输出示例

```
╔════════════════════════════════════════════════════════════╗
║     Content Analyzer - 字段修复脚本                        ║
╚════════════════════════════════════════════════════════════╝

=== 数据统计 ===

总内容数: 185
缺少标题: 23 (12.43%)
缺少摘要: 5 (2.70%)

=== 修复缺失的标题 ===

找到 23 条没有标题的内容
[1/23] 已生成标题: OpenClaw 2026.
[2/23] 已生成标题: 推荐越狱版本地模型 huihui-ai/Huihui-Qwen3.
...
✓ 成功修复 23 条内容的标题

=== 修复缺失的摘要 ===

找到 5 条没有摘要的内容
[1/5] 已生成摘要: 这是一个关于 AI 技术的深度分析文章...
...
✓ 成功修复 5 条内容的摘要

=== 数据统计 ===

总内容数: 185
缺少标题: 0 (0.00%)
缺少摘要: 0 (0.00%)

╔════════════════════════════════════════════════════════════╗
║  ✓ 修复完成！共修复 28  条记录                        ║
╚════════════════════════════════════════════════════════════╝
```

## 注意事项

1. **备份数据**：运行脚本前建议备份数据库
2. **测试环境**：建议先在测试环境运行 `--dry-run` 模式
3. **数据质量**：自动生成的标题和摘要可能不如人工编写的准确
4. **重复运行**：脚本可以安全地重复运行，只会处理缺失的字段

## 集成到 package.json

可以将脚本添加到 `package.json` 的 scripts 中：

```json
{
  "scripts": {
    "fix:fields": "node scripts/fix-missing-fields.js",
    "fix:titles": "node scripts/fix-missing-fields.js --title-only",
    "fix:summaries": "node scripts/fix-missing-fields.js --summary-only",
    "fix:check": "node scripts/fix-missing-fields.js --dry-run"
  }
}
```

然后可以使用：

```bash
npm run fix:fields
npm run fix:titles
npm run fix:summaries
npm run fix:check
```

## 定期维护

建议定期运行此脚本（例如每周一次），以确保所有内容都有完整的标题和摘要。

可以通过 cron job 或 CI/CD 流程自动化：

```bash
# 每周日凌晨 2 点运行
0 2 * * 0 cd /path/to/content-analyzer && node scripts/fix-missing-fields.js
```
