# Checklist

## Batch 1: 核心解析问题修复

- [x] utils.ts 中 parseOptions 正则表达式支持连字符
- [x] EnhancementComponent 材料解析正则表达式支持 `enhance-stone` 格式
- [x] WarehouseComponent 物品解析正则表达式支持 `iron-sword` 格式
- [x] WarehouseComponent 标签解析正则表达式支持连字符
- [x] parseAttrs 正确解码 HTML 实体（如 `&quot;` -> `"`）

## Batch 2: Markdown 递归渲染修复

- [x] SystemNotifyComponent 使用 MarkdownRenderer 渲染消息内容
- [x] ConditionalComponent 使用 MarkdownRenderer 渲染条件内容
- [x] TabsComponent 使用 MarkdownRenderer 渲染标签页内容
- [x] 所有动态 UI 组件正确传递 onAction 回调

## Batch 3: MarkdownRenderer children 处理

- [x] MarkdownRenderer 正确处理 React 元素数组类型的 children
- [x] extractTextFromChildren 辅助函数正确提取文本内容
- [x] 混合类型 children（字符串 + React 元素）正确处理

## Batch 4: 验证测试

- [x] 前端类型检查通过 (`npm run typecheck`)
- [x] preprocessMarkdown 支持嵌套组件（如 :::options 嵌套在 :::system-notify 内）
- [ ] 欢迎界面模板预览正确显示标题和按钮
- [ ] 系统通知模板预览正确显示成就解锁内容
- [ ] 对话界面模板预览正确显示选项按钮
- [ ] 装备强化模板预览正确显示材料列表
- [ ] 仓库/银行模板预览正确显示物品列表
- [ ] 进度条模板预览正确显示三个进度条
- [ ] 标签页模板预览正确显示标签页内容
- [ ] 徽章模板预览正确显示徽章
- [ ] 条件渲染模板预览正确显示条件内容
