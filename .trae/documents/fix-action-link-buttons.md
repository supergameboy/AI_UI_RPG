# 修复 action/item 链接渲染为按钮

## 问题分析

### 问题 1: href 被清空
从用户选择的 HTML 可以看到：
```html
<a href="" target="_blank" rel="noopener noreferrer">开始冒险</a>
```

**根本原因**: ReactMarkdown 的 URL 解析器不支持 `action:`、`item:` 等自定义协议，将其视为无效 URL 并清空 `href`。

### 问题 2: CSS 类名不匹配
- 代码中使用 `styles.actionButton` 和 `styles.itemButton`
- CSS 文件只定义了 `.actionLink`，没有 `.actionButton` 和 `.itemButton`

## 解决方案

### 方案 A: 使用 remark 插件处理自定义协议
创建自定义 remark 插件，在解析阶段识别 `action:`、`item:` 等协议，将其转换为特殊节点。

### 方案 B: 使用正则表达式预处理
在传递给 ReactMarkdown 之前，将 `[文本](action:xxx)` 转换为特殊标记，然后在渲染时处理。

### 方案 C: 使用自定义 URL 转换器
ReactMarkdown 支持 `urlTransform` 选项，可以自定义 URL 处理逻辑。

**推荐方案**: 方案 C - 使用 `urlTransform` 保留自定义协议

## 实现步骤

### Step 1: 添加 CSS 样式
在 `MarkdownRenderer.module.css` 中添加：
```css
.actionButton {
  display: inline-block;
  padding: 4px 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.actionButton:hover {
  background: var(--color-primary-dark);
}

.itemButton {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
}

.itemButton:hover {
  background: var(--color-background-secondary);
}
```

### Step 2: 添加 urlTransform 保留自定义协议
```typescript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  urlTransform={(url) => {
    // 保留 action:, item:, material:, tab: 协议
    if (/^(action|item|material|tab):/.test(url)) {
      return url;
    }
    return url;
  }}
  components={{
    a: ({ href, children }) => {
      // 处理 action 链接
      if (href?.startsWith('action:')) {
        // ...渲染为按钮
      }
      // ...
    }
  }}
>
```

### Step 3: 验证修复
- 欢迎界面模板：`[开始冒险](action:start_game)` 渲染为按钮
- 商店界面模板：`[购买](action:buy_iron_sword)` 渲染为按钮
- 徽章示例模板：`[铁剑](item:iron-sword)` 渲染为按钮

## 修改文件
- `packages/frontend/src/components/ui/MarkdownRenderer.module.css`
- `packages/frontend/src/components/ui/MarkdownRenderer.tsx`
