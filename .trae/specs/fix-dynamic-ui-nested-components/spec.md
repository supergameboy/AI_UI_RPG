# fix-dynamic-ui-nested-components Spec

## Why
动态 UI 组件的嵌套处理存在严重缺陷，导致：
1. `:::options` 嵌套在 `:::system-notify` 内部时无法正确渲染
2. 标签页组件预览为空
3. action 链接渲染为普通 `<a>` 标签而非可点击按钮

## What Changes
- **重写 `balanceProcessComponents` 函数**：修复正则表达式匹配顺序问题
- **修复 TabsComponent 渲染**：确保标签页内容正确显示
- **修复 action 链接渲染**：确保 `[文本](action:xxx)` 渲染为按钮

## Impact
- Affected code:
  - `packages/frontend/src/components/ui/dynamic-ui/utils.ts`
  - `packages/frontend/src/components/ui/MarkdownRenderer.tsx`

## Root Cause Analysis

### 问题 1: 正则表达式匹配顺序错误

当前代码使用两个独立的正则表达式：
```typescript
const openRegex = /:::(\w+(?:-\w+)*)\s*(?:\{([^}]*)\})?/g;
const closeRegex = /:::(?!\w)/g;
```

问题：两个正则表达式独立执行，导致匹配顺序错误。

**示例输入**:
```
:::system-notify{type=welcome}
内容
:::options
[选项](action:xxx)
:::
:::
```

**期望匹配顺序**:
1. `:::system-notify{type=welcome}` (open)
2. `:::options` (open)
3. `:::` (close for options)
4. `:::` (close for system-notify)

**实际匹配顺序**（当前代码）:
- openRegex 先执行，找到 1, 2
- closeRegex 后执行，找到 3, 4
- 合并后按位置排序，但栈匹配逻辑有问题

### 问题 2: 栈匹配逻辑缺陷

当前代码在匹配结束标记时，没有正确处理嵌套关系。

### 问题 3: action 链接未正确渲染

`rehypeRaw` 处理后，`href="action:xxx"` 的链接可能被转换为普通 `<a>` 标签。

## ADDED Requirements

### Requirement: 统一的正则表达式匹配
`preprocessMarkdown` 函数 SHALL 使用单一正则表达式同时匹配开始和结束标记。

#### Scenario: 嵌套组件处理
- **GIVEN** Markdown 内容包含嵌套组件
- **WHEN** preprocessMarkdown 处理内容
- **THEN** 应正确识别所有嵌套层级并转换为 HTML

### Requirement: 正确的栈匹配算法
`balanceProcessComponents` 函数 SHALL 使用正确的栈匹配算法处理嵌套。

#### Scenario: 多层嵌套
- **GIVEN** 三层嵌套组件
- **WHEN** 处理组件
- **THEN** 应从内到外正确转换

### Requirement: action 链接渲染为按钮
`[文本](action:xxx)` SHALL 渲染为可点击的按钮元素。

#### Scenario: action 链接点击
- **GIVEN** Markdown 包含 `[开始冒险](action:start_game)`
- **WHEN** 渲染完成
- **THEN** 应显示为按钮，点击时触发 `onAction({ type: 'start_game' })`
