# 自定义 Markdown 解析器实现计划

## 背景
用户要求弃用 ReactMarkdown，自己实现 Markdown 识别解析器，以更好地支持自定义协议（action:, item:, material:, tab:）和动态 UI 组件。

## 设计目标

1. **支持标准 Markdown 语法**
   - 标题（h1-h6）
   - 段落
   - 列表（有序、无序）
   - 表格
   - 代码块
   - 引用
   - 粗体、斜体

2. **支持自定义链接协议**
   - `[文本](action:xxx)` → 渲染为按钮
   - `[文本](item:xxx)` → 渲染为按钮
   - `[文本](material:xxx)` → 渲染为文本
   - `[文本](tab:xxx)` → 渲染为文本

3. **支持动态 UI 组件**
   - `:::component-name{attrs}content:::` 格式
   - 支持嵌套组件

## 架构设计

```
Markdown 内容
    ↓
Tokenizer (词法分析)
    ↓
Token[] (标记数组)
    ↓
Parser (语法分析)
    ↓
AST (抽象语法树)
    ↓
Renderer (渲染器)
    ↓
React 组件树
```

## 实现步骤

### Step 1: 定义 Token 类型
```typescript
type TokenType = 
  | 'heading' | 'paragraph' | 'list' | 'listItem'
  | 'table' | 'tableRow' | 'tableCell'
  | 'code' | 'blockquote'
  | 'bold' | 'italic' | 'text'
  | 'link' | 'actionLink' | 'itemLink'
  | 'component' | 'newline';

interface Token {
  type: TokenType;
  content?: string;
  level?: number;
  href?: string;
  protocol?: 'action' | 'item' | 'material' | 'tab' | 'http' | 'https';
  attrs?: Record<string, string>;
  children?: Token[];
}
```

### Step 2: 实现 Tokenizer
```typescript
function tokenize(markdown: string): Token[] {
  const tokens: Token[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    // 识别标题
    if (line.startsWith('#')) { ... }
    // 识别列表
    if (line.startsWith('- ') || line.startsWith('* ')) { ... }
    // 识别表格
    if (line.startsWith('|')) { ... }
    // 识别组件
    if (line.startsWith(':::')) { ... }
    // 识别链接
    // [文本](action:xxx) 或 [文本](item:xxx)
    ...
  }
  
  return tokens;
}
```

### Step 3: 实现 Parser
```typescript
function parse(tokens: Token[]): Token[] {
  // 将 tokens 转换为嵌套的 AST 结构
  // 处理多行元素（列表、表格等）
  // 处理嵌套组件
  return tokens;
}
```

### Step 4: 实现 Renderer
```typescript
function renderToken(token: Token, onAction?: Function): React.ReactNode {
  switch (token.type) {
    case 'heading':
      return <h{token.level}>{renderChildren(token.children)}</h{token.level}>;
    case 'actionLink':
      return <button onClick={() => onAction?.({ type: token.href })}>{token.content}</button>;
    case 'itemLink':
      return <button onClick={() => onAction?.({ type: 'item_click', payload: { itemId: token.href } })}>{token.content}</button>;
    // ...
  }
}
```

### Step 5: 整合到 MarkdownRenderer
```typescript
export const MarkdownRenderer: React.FC<Props> = ({ content, onAction }) => {
  const tokens = useMemo(() => parse(tokenize(content)), [content]);
  return (
    <div className={styles.container}>
      {tokens.map((token, i) => renderToken(token, onAction))}
    </div>
  );
};
```

## 文件结构

```
packages/frontend/src/components/ui/markdown/
├── index.ts              # 导出
├── types.ts              # Token 类型定义
├── tokenizer.ts          # 词法分析器
├── parser.ts             # 语法分析器
├── renderer.tsx          # 渲染器
└── styles.module.css     # 样式
```

## 修改文件
- 新建 `packages/frontend/src/components/ui/markdown/` 目录
- 修改 `packages/frontend/src/components/ui/MarkdownRenderer.tsx` 使用新解析器
- 删除 `react-markdown` 和 `remark-gfm` 依赖（可选）

## 验证标准
- 所有 10 个模板正确渲染
- `[文本](action:xxx)` 渲染为按钮
- `[文本](item:xxx)` 渲染为按钮
- 嵌套组件正确处理
