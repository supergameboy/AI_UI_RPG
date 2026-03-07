# Checklist

## Batch 1: 核心解析器重构

- [x] `parseDynamicUIComponents` 函数正确解析组件块
- [x] `ComponentBlock` 类型定义完整
- [x] 递归下降解析器正确处理嵌套
- [x] 返回结构化的组件块数组

## Batch 2: MarkdownRenderer 重构

- [x] 移除 `rehypeRaw` 依赖
- [x] 使用新的解析器
- [x] 组件块渲染逻辑正确
- [x] `SystemNotifyComponent` 引用正确

## Batch 3: 组件接口统一

- [x] OptionsComponent 接口统一
- [x] TabsComponent 接口统一
- [x] SystemNotifyComponent 接口统一
- [x] ConditionalComponent 接口统一
- [x] EnhancementComponent 接口统一
- [x] WarehouseComponent 接口统一

## Batch 4: 验证测试

- [x] 前端类型检查通过 (`npm run typecheck`)
- [ ] 嵌套组件测试：`:::system-notify` 包含 `:::options` 正确渲染
- [ ] 标签页组件预览正确显示标签页内容
- [ ] action 链接渲染为按钮而非普通链接
