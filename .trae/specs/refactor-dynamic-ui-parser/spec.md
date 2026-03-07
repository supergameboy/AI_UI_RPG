# refactor-dynamic-ui-parser Spec

## Why
当前动态 UI 系统存在严重的架构问题：
1. 使用 `rehypeRaw` 将 Markdown 转换为 HTML 再解析，导致嵌套组件处理困难
2. `extractMarkdownFromChildren` 无法正确提取嵌套的 Markdown 内容
3. 组件引用不一致（如 `SystemNotifyComponent` vs `SystemNotifyComponent`）
4. 正则表达式匹配顺序问题导致嵌套组件解析失败

## What Changes
- **完全重构解析架构**：直接解析 Markdown，不经过 HTML 转换
- **简化组件接口**：统一使用 `content` 和 `attrs` 参数
- **修复嵌套处理**：使用递归下降解析器正确处理嵌套
- **统一组件命名**：修复组件引用不一致问题

## Impact
- Affected code:
  - `packages/frontend/src/components/ui/MarkdownRenderer.tsx`
  - `packages/frontend/src/components/ui/dynamic-ui/utils.ts`
  - `packages/frontend/src/components/ui/dynamic-ui/*.tsx` (所有组件)

## ADDED Requirements

### Requirement: 直接 Markdown 解析
系统 SHALL 直接解析 Markdown 格式的动态 UI 组件，不经过 HTML 转换。

#### Scenario: 嵌套组件解析
- **GIVEN** Markdown 内容包含嵌套组件
- **WHEN** 解析器处理内容
- **THEN** 应正确识别所有层级并保留原始 Markdown 格式

### Requirement: 递归渲染
动态 UI 组件 SHALL 支持递归渲染嵌套的 Markdown 内容。

#### Scenario: 递归渲染
- **GIVEN** 组件内容包含 Markdown 格式
- **WHEN** 组件渲染
- **THEN** 应使用 MarkdownRenderer 递归渲染内容

## MODIFIED Requirements

### Requirement: 统一组件接口
所有动态 UI 组件 SHALL 使用统一的接口：
```typescript
interface DynamicUIComponentProps {
  content: string;      // 原始 Markdown 内容
  attrs: Record<string, string>;  // 解析后的属性
  onAction?: (action: DynamicUIAction) => void;
  context?: Record<string, unknown>;
}
```

## REMOVED Requirements

### Requirement: HTML 转换层
**Reason**: 增加复杂度且不可靠
**Migration**: 直接解析 Markdown 格式

## 新架构设计

### 解析流程
```
原始 Markdown
    ↓
parseDynamicUIComponents() - 解析 ::: 组件块
    ↓
[ComponentBlock { name, attrs, content }]
    ↓
MarkdownRenderer - 渲染每个组件块
    ↓
React 组件树
```

### 关键改进
1. **分离解析和渲染**：先解析组件结构，再渲染
2. **保留原始内容**：不转换内容格式，保留 Markdown
3. **递归处理**：组件内容可以包含嵌套组件
