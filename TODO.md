# Content Analyzer 开发 TODO

## 当前进度

### 已完成 ✓
- [x] Source 字段规范化
- [x] API 文档更新
- [x] 测试套件（含重试机制）
- [x] Toast 通知组件
- [x] 错误边界组件
- [x] 骨架屏组件

---

## 立即开始（2026-03-11）

### 阶段 1: 集成现有组件（30分钟）
- [x] 在 layout.tsx 中添加 ErrorBoundary
- [x] 在 layout.tsx 中添加 ToastContainer
- [x] 在 ContentList 中使用 Toast 通知
- [x] 在数据加载时使用 Skeleton

### 阶段 2: 确认对话框（30分钟）
- [x] 创建 ConfirmDialog 组件
- [x] 集成到删除操作
- [x] 添加动画效果

### 阶段 3: 图片懒加载（1小时）
- [x] 创建 LazyImage 组件
- [x] 使用 Intersection Observer
- [x] 添加占位符和加载动画
- [x] 替换所有图片标签（MediaThumbnail）

### 阶段 4: 移动端优化（1小时）
- [x] 优化触摸手势
- [x] 改进移动端布局
- [x] 添加下拉刷新
- [x] 优化表格在移动端的显示（卡片布局）

---

## 本周计划（P1）

### 性能优化
- [x] 代码分割（动态导入 VideoPreview）
- [ ] 实现 SWR 或 React Query
- [ ] 优化图片格式（WebP）
- [ ] 添加 Service Worker（PWA）

### 用户体验
- [x] 添加加载进度条
- [ ] 优化错误提示
- [x] 添加快捷键支持
- [ ] 改进分页体验

### 功能增强
- [x] 全文搜索功能
- [ ] 多条件筛选
- [ ] 批量选择
- [ ] 批量删除
- [ ] 批量收藏

---

## 本月计划（P2）

### 高级功能
- [ ] 虚拟滚动（react-window）
- [ ] 数据可视化（Chart.js）
- [ ] 导出功能（Markdown, PDF, JSON）
- [ ] 标签系统
- [ ] 评论功能

### 代码质量
- [ ] 拆分大型组件
- [ ] 移除所有 any 类型
- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 代码覆盖率 > 80%

### 性能指标
- [ ] 建立性能基准
- [ ] 设置 Lighthouse CI
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] TTI < 3.5s

---

## 长期计划（P3）

### 高级特性
- [ ] 实时协作（WebSocket）
- [ ] AI 智能推荐
- [ ] 自动分类
- [ ] 插件系统
- [ ] API 限流和配额

### 可访问性
- [ ] 完整键盘导航
- [ ] ARIA 标签
- [ ] 屏幕阅读器支持
- [ ] 深色模式
- [ ] 高对比度模式

### 国际化
- [ ] 多语言支持（i18n）
- [ ] 英文版
- [ ] 日文版
- [ ] 时区处理

---

## 技术债务

### 需要重构
- [ ] ContentList 组件（过于复杂）
- [ ] VideoPreview 组件（过于复杂）
- [ ] API 路由（重复代码）
- [ ] 样式系统（统一 Tailwind 配置）

### 需要优化
- [ ] 数据库查询（添加索引）
- [ ] API 响应时间
- [ ] 图片存储（CDN）
- [ ] 缓存策略

### 需要文档
- [ ] 组件使用文档
- [ ] API 集成指南
- [ ] 部署文档
- [ ] 贡献指南

---

## 当前任务优先级

### 🔴 高优先级（今天完成）
1. 集成 ErrorBoundary 和 Toast
2. 创建 ConfirmDialog
3. 实现图片懒加载
4. 移动端优化

### 🟡 中优先级（本周完成）
5. 代码分割
6. 搜索功能
7. 批量操作
8. 性能优化

### 🟢 低优先级（本月完成）
9. 虚拟滚动
10. 数据可视化
11. 导出功能
12. 测试覆盖

---

## 开发规范

### 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

### 代码规范
- 使用 TypeScript 严格模式
- 组件文件名使用 PascalCase
- Hook 文件名使用 camelCase
- 每个组件单独文件
- 提取可复用逻辑到 hooks

### 测试规范
- 每个组件都要有测试
- 关键功能要有集成测试
- API 要有端到端测试
- 测试覆盖率 > 80%

---

## 性能目标

### Core Web Vitals
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.5s

### 资源大小
- 初始 JS bundle: < 200KB
- 初始 CSS: < 50KB
- 图片优化: WebP + 懒加载
- 字体优化: 子集化 + preload

---

## 下一步行动

### 立即开始（现在）
1. 在 layout.tsx 中集成 ErrorBoundary
2. 在 layout.tsx 中添加 ToastContainer
3. 创建 ConfirmDialog 组件
4. 在删除操作中使用 ConfirmDialog

### 今天完成
5. 创建 LazyImage 组件
6. 替换所有图片为懒加载
7. 优化移动端布局
8. 测试所有新功能

### 本周完成
9. 实现搜索功能
10. 添加批量操作
11. 代码分割优化
12. 性能测试和优化
