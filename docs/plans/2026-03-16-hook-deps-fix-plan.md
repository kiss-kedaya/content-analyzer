【中文化】
# 2026-03-16 Hook 依赖修复计划

## 目标
- 解决 ContentList 与 MediaThumbnail 的 React Hook 依赖警告
- 保持现有功能行为不变
- 通过本地构建验证

## 范围
- components/ContentList.tsx
- components/MediaThumbnail.tsx

## 方案
1. ContentList
   - useEffect(切换 tab 拉取) 依赖补全 state.techContents 与 state.adultContents
   - useEffect(排序变化拉取) 依赖补全 actions
2. MediaThumbnail
   - useEffect 依赖补全 persist?.id 与 persist?.kind

## 执行步骤
- [ ] 更新 Hook 依赖数组
- [ ] npm run build 验证无新增告警
- [ ] 提交代码并推送

## 风险与回退
- 风险: 依赖增加导致 effect 触发更频繁
- 回退: git reset --hard 到上一检查点
