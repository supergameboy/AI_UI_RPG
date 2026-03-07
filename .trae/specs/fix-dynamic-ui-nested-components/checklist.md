# Checklist

## Batch 1: 核心解析问题修复

- [x] `preprocessMarkdown` 使用单一正则匹配开始和结束标记
- [x] 栈匹配算法正确处理嵌套组件
- [x] 嵌套组件从内到外正确转换
- [x] 保留原始 Markdown 格式

## Batch 2: MarkdownRenderer 修复

- [x] `href="action:xxx"` 正确识别并渲染为按钮
- [x] action 链接点击时触发 `onAction` 回调
- [x] `extractMarkdownFromChildren` 正确提取 Markdown 内容

## Batch 3: 验证测试

- [x] 前端类型检查通过 (`npm run typecheck`)
- [ ] 嵌套组件测试：`:::system-notify` 包含 `:::options` 正确渲染
- [ ] 标签页组件预览正确显示标签页内容
- [ ] action 链接渲染为按钮而非普通链接
