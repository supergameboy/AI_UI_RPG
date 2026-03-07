# Tasks

## Batch 1: 核心解析问题修复

- [x] Task 1: 修复 utils.ts 正则表达式支持连字符
  - [x] SubTask 1.1: 修复 parseOptions 正则表达式，支持 `action:xxx-xxx` 格式
  - [x] SubTask 1.2: 修复 EnhancementComponent 材料解析正则表达式
  - [x] SubTask 1.3: 修复 WarehouseComponent 物品解析正则表达式
  - [x] SubTask 1.4: 修复 WarehouseComponent 标签解析正则表达式
  - [x] SubTask 1.5: 添加 HTML 实体解码函数 decodeHTMLEntities
  - [x] SubTask 1.6: 修复 parseAttrs 解码 HTML 编码的属性值

## Batch 2: Markdown 递归渲染修复

- [x] Task 2: 修复 SystemNotifyComponent 递归渲染 Markdown
  - [x] SubTask 2.1: 导入 MarkdownRenderer 组件
  - [x] SubTask 2.2: 修改 message 渲染使用 MarkdownRenderer
  - [x] SubTask 2.3: 传递 onAction 回调

- [x] Task 3: 修复 ConditionalComponent 递归渲染 Markdown
  - [x] SubTask 3.1: 导入 MarkdownRenderer 组件
  - [x] SubTask 3.2: 修改内容渲染使用 MarkdownRenderer
  - [x] SubTask 3.3: 传递 context 和 onAction

- [x] Task 4: 修复 TabsComponent 内容渲染
  - [x] SubTask 4.1: 导入 MarkdownRenderer 组件
  - [x] SubTask 4.2: 修改标签页内容渲染使用 MarkdownRenderer
  - [x] SubTask 4.3: 传递 onAction 回调

## Batch 3: MarkdownRenderer children 处理

- [x] Task 5: 修复 MarkdownRenderer children 类型处理
  - [x] SubTask 5.1: 添加 extractTextFromChildren 辅助函数
  - [x] SubTask 5.2: 处理 React 元素数组和字符串混合情况
  - [x] SubTask 5.3: 确保正确提取内容传递给动态 UI 组件

## Batch 4: 验证测试

- [x] Task 6: 运行类型检查验证修复
  - [x] SubTask 6.1: 运行 frontend 类型检查
  - [x] SubTask 6.2: 修复任何类型错误

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 2, Task 3, Task 4]
- [Task 6] depends on [Task 5]
