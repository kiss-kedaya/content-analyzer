【中文化】\n# Content Analyzer 改进计划

## 1. API 文档规范化

### 问题
- 创建成人内容接口缺少必填/可选标注
- 后端是否自动补充标题未说明

### 任务
- [ ] 更新 API 文档，标注所有字段的必填/可选状态
- [ ] 说明后端自动补充标题的逻辑
- [ ] 统一技术内容和成人内容的字段说明

## 2. 合并技术内容和成人内容接口

### 当前状态
```
POST /api/content          # 技术内容
POST /api/adult-content    # 成人内容
GET  /api/content          # 技术内容列表
GET  /api/adult-content    # 成人内容列表
```

### 目标状态
```
POST /api/content?type=tech    # 技术内容
POST /api/content?type=adult   # 成人内容
GET  /api/content?type=tech    # 技术内容列表
GET  /api/content?type=adult   # 成人内容列表
```

### 任务
- [ ] 修改 `/api/content/route.ts`，添加 type 参数处理
- [ ] 修改 `/api/content/[id]/route.ts`，添加 type 参数处理
- [ ] 修改 `/api/content/batch/route.ts`，添加 type 参数处理
- [ ] 修改 `/api/content/paginated/route.ts`，添加 type 参数处理
- [ ] 修改 `/api/content/[id]/favorite/route.ts`，添加 type 参数处理
- [ ] 保留旧接口作为兼容性别名（重定向到新接口）
- [ ] 更新 API 文档
- [ ] 更新前端调用代码

## 3. Source 字段规范化

### 当前问题
- twitter / Twitter → 应统一为 X
- linuxdo → 应统一为 Linuxdo
- 大小写不统一

### 规范
```javascript
const SOURCE_MAPPING = {
  'twitter': 'X',
  'Twitter': 'X',
  'x': 'X',
  'X': 'X',
  'linuxdo': 'Linuxdo',
  'LinuxDo': 'Linuxdo',
  'LINUXDO': 'Linuxdo',
  'xiaohongshu': 'Xiaohongshu',
  'XiaoHongShu': 'Xiaohongshu',
  // ... 其他来源
}
```

### 任务
- [ ] 创建 source 规范化工具函数
- [ ] 在所有创建/更新接口中应用规范化
- [ ] 创建数据库迁移脚本，更新现有数据
- [ ] 更新 API 文档，说明 source 规范

## 实施顺序

1. **Source 规范化**（最简单，影响最小）
   - 创建工具函数
   - 应用到所有接口
   - 迁移现有数据

2. **API 文档规范化**（文档更新）
   - 更新字段说明
   - 添加自动补充标题的说明

3. **合并接口**（最复杂，需要兼容性处理）
   - 实现新接口
   - 保留旧接口作为别名
   - 更新文档和前端代码

## 注意事项

- 保持向后兼容性
- 所有修改需要测试
- 更新 API 文档
- 考虑数据迁移的影响

