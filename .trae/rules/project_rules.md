# AI-RPG Engine 项目规则

## TypeScript 类型检查规则

### 提交前必须执行类型检查
每次提交代码前，必须运行以下命令确保无类型错误：

```bash
# 前端
cd packages/frontend ;; npm run typecheck

# 后端
cd packages/backend ;; npm run typecheck

# 或者同时检查
pnpm -r run typecheck
```

### CI 集成要求
- 所有 PR 必须通过类型检查才能合并
- CI 流程中必须包含 `tsc --noEmit` 步骤

### 严格模式
- 所有 `tsconfig.json` 必须保持 `strict: true`
- 不允许使用 `any` 类型，必须使用具体类型或 `unknown`

### 开发时增量检查
推荐在开发时运行 `tsc --watch` 实时检查类型错误：

```bash
cd packages/frontend && tsc --watch
# 或
cd packages/backend && tsc --watch
```

## 常见类型错误及解决方案

### 1. API 响应类型断言
```typescript
// ❌ 错误：Type 'unknown' is not assignable to type 'XxxResponse'
const data: XxxResponse = await response.json();

// ✅ 正确：使用类型断言
const data = await response.json() as XxxResponse;
```

### 2. 动态参数类型化
```typescript
// ❌ 错误：unknown[] 不能赋值给具体类型
fn(params);

// ✅ 正确：使用 Parameters 工具类型
fn(params as Parameters<typeof fn>[0]);
```

### 3. 接口必需属性
```typescript
// ❌ 错误：缺少必需属性
registerProvider(name, { apiKey, baseURL });

// ✅ 正确：确保所有必需属性都提供
registerProvider(name, { provider: name, apiKey, baseURL });
```

### 4. 清理未使用代码
- 移除未使用的导入
- 移除未使用的变量
- 使用 `_` 前缀标记有意忽略的变量

## 代码风格

### 导入顺序
1. 外部库导入
2. 内部模块导入
3. 类型导入（使用 `import type`）

### 命名约定
- 组件：PascalCase (如 `SaveManager`)
- 函数/变量：camelCase (如 `fetchSaves`)
- 常量：UPPER_SNAKE_CASE (如 `API_BASE`)
- 类型/接口：PascalCase (如 `SaveState`)

## 文件结构

### 前端组件结构
```
components/
├── ComponentName/
│   ├── index.ts          # 导出
│   ├── ComponentName.tsx # 组件
│   └── ComponentName.module.css # 样式
```

### 后端服务结构
```
services/
├── ServiceName.ts        # 服务实现
└── types.ts              # 类型定义（如需要）
```

## 文档管理规则

### 已实现功能记录
- 已实现的功能和实现方法必须记录到 `docs/development.md` 中
- 记录内容包括：功能名称、实现概述、相关文件路径、关键代码片段

### 待办事项管理
- 待后续集成的任务必须记录到 `docs/todo.md` 中
- 已规划但未完成的功能必须记录到 `docs/todo.md` 中
- 任务记录需包含：任务描述、优先级、依赖关系、相关文件
