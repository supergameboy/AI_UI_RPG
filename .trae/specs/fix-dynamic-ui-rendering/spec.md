# fix-dynamic-ui-rendering Spec

## Why
动态 UI 组件存在严重的渲染问题，导致预览区和动态界面窗口无法正确显示 Markdown 编辑器的内容。具体表现为：
- 系统通知组件消息内容为空
- 标签页组件预览为空
- 装备强化材料列表为空
- 仓库物品列表为空
- 条件渲染组件未解析 Markdown

## What Changes
- **修复正则表达式**：支持带连字符的 ID（如 `iron-sword`、`enhance-stone`）
- **修复 Markdown 递归渲染**：动态 UI 组件需要递归解析 Markdown 内容
- **修复 TabsComponent**：处理 children 类型问题
- **修复属性解析**：正确处理 HTML 编码的属性值

## Impact
- Affected code:
  - `packages/frontend/src/components/ui/dynamic-ui/utils.ts`
  - `packages/frontend/src/components/ui/dynamic-ui/EnhancementComponent.tsx`
  - `packages/frontend/src/components/ui/dynamic-ui/WarehouseComponent.tsx`
  - `packages/frontend/src/components/ui/dynamic-ui/TabsComponent.tsx`
  - `packages/frontend/src/components/ui/dynamic-ui/SystemNotifyComponent.tsx`
  - `packages/frontend/src/components/ui/dynamic-ui/ConditionalComponent.tsx`
  - `packages/frontend/src/components/ui/MarkdownRenderer.tsx`

## ADDED Requirements

### Requirement: 正则表达式支持连字符
动态 UI 组件的正则表达式 SHALL 支持带连字符的 ID 格式。

#### Scenario: 材料解析
- **GIVEN** Markdown 内容包含 `[强化石](material:enhance-stone required=3 owned=5)`
- **WHEN** EnhancementComponent 解析材料
- **THEN** 应正确解析出 `name="强化石"`, `id="enhance-stone"`, `required=3`, `owned=5`

#### Scenario: 物品解析
- **GIVEN** Markdown 内容包含 `[铁剑](item:iron-sword qty=1 rarity=common)`
- **WHEN** WarehouseComponent 解析物品
- **THEN** 应正确解析出 `name="铁剑"`, `id="iron-sword"`, `qty=1`, `rarity="common"`

### Requirement: 动态 UI 组件递归渲染 Markdown
动态 UI 组件 SHALL 使用 MarkdownRenderer 递归渲染其内容，而不是直接显示纯文本。

#### Scenario: 系统通知渲染
- **GIVEN** Markdown 内容包含标题和链接 `## 欢迎\n[开始冒险](action:start_game)`
- **WHEN** SystemNotifyComponent 渲染消息
- **THEN** 标题应渲染为 h2 元素，链接应渲染为可点击按钮

#### Scenario: 条件渲染组件
- **GIVEN** 条件内容包含 Markdown 格式 `[领取奖励](action:claim_reward)`
- **WHEN** ConditionalComponent 渲染内容
- **THEN** 链接应渲染为可点击按钮

#### Scenario: 标签页内容渲染
- **GIVEN** 标签页内容包含 Markdown 格式
- **WHEN** TabsComponent 渲染标签页内容
- **THEN** 内容应正确渲染 Markdown 格式

### Requirement: TabsComponent 正确解析内容
TabsComponent SHALL 正确解析标签页内容，处理 React 元素和字符串两种情况。

#### Scenario: 字符串内容解析
- **GIVEN** content 是字符串类型
- **WHEN** parseTabs 解析内容
- **THEN** 应正确解析出所有标签页

#### Scenario: React 元素处理
- **GIVEN** children 是 React 元素数组
- **WHEN** MarkdownRenderer 处理 div
- **THEN** 应正确提取文本内容传递给 TabsComponent

## MODIFIED Requirements

### Requirement: 属性解析正确处理编码
`parseAttrs` 函数 SHALL 正确处理 HTML 编码的属性值。

#### Scenario: 引号编码处理
- **GIVEN** 属性字符串 `name=&quot;铁剑&quot; currentLevel=5`
- **WHEN** parseAttrs 解析属性
- **THEN** 应返回 `{ name: "铁剑", currentLevel: "5" }`

## Root Cause Analysis

### 问题 1: 正则表达式不支持连字符
**位置**: `utils.ts` 中的多个正则表达式
```typescript
// 当前代码
const regex = /\[([^\]]+)\]\(material:(\w+)\s+required=(\d+)\s+owned=(\d+)\)/g;
// \w+ 只匹配 [a-zA-Z0-9_]，不匹配连字符

// 模板中的 ID
[强化石](material:enhance-stone required=3 owned=5)  // enhance-stone 不匹配
```

### 问题 2: 动态 UI 组件未递归渲染 Markdown
**位置**: `SystemNotifyComponent.tsx`, `ConditionalComponent.tsx`, `TabsComponent.tsx`
```tsx
// 当前代码 - 直接显示纯文本
<div className={styles.message}>{content.trim()}</div>

// 应该使用 MarkdownRenderer
<div className={styles.message}>
  <MarkdownRenderer content={content} onAction={onAction} />
</div>
```

### 问题 3: MarkdownRenderer children 类型处理
**位置**: `MarkdownRenderer.tsx`
```tsx
// 当前代码 - 只处理字符串
const contentString = typeof children === 'string' ? children : '';

// 需要处理 React 元素数组
// 当 rehypeRaw 处理后，children 可能是 React 元素
```

### 问题 4: 属性值 HTML 编码未解码
**位置**: `utils.ts` 中的 `parseAttrs`
```typescript
// 当前代码 - 没有解码 HTML 实体
let value = match[2];
if (value.startsWith('"') && value.endsWith('"')) {
  value = value.slice(1, -1);
}
// 没有处理 &quot; 等 HTML 实体
```
