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

---

## 统一类型定义规范

### 类型定义位置
所有共享类型定义必须放在 `packages/shared/src/types/` 目录下。

### 类型文件结构
```
packages/shared/src/types/
├── api.ts          # API 响应类型
├── error.ts        # 错误类型
├── character.ts    # 角色类型
├── item.ts         # 物品类型
├── ...             # 其他类型
└── index.ts        # 统一导出
```

### API 响应类型
使用统一的 `APIResponse<T>` 类型：

```typescript
// 成功响应
interface APIResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    total?: number;
    timestamp?: number;
  };
}

// 错误响应
interface APIResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### 错误码定义
使用 `ErrorCodes` 常量定义标准错误码：

```typescript
const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  LLM_ERROR: 'LLM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;
```

---

## 错误处理规范

### 后端错误处理

#### 使用错误处理中间件
```typescript
import { errorHandler, asyncHandler } from './middleware/errorHandler';

// 在路由后添加
app.use(errorHandler);
```

#### 使用自定义错误类
```typescript
import { ValidationError, NotFoundError, LLMError } from '@ai-rpg/shared';

// 验证错误
throw new ValidationError('参数无效', { field: 'name' });

// 资源不存在
throw new NotFoundError('存档', saveId);

// LLM 调用错误
throw new LLMError('模型响应超时', { provider: 'deepseek' });
```

#### 异步路由处理
```typescript
// 使用 asyncHandler 包装异步路由
app.get('/api/resource', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json({ success: true, data });
}));
```

### 前端错误处理

#### 统一错误处理
```typescript
// 在服务层统一处理 API 响应
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  const result = await response.json() as APIResponse<Data>;
  
  if (!result.success) {
    throw new Error(result.error.message);
  }
  
  return result.data;
}
```

---

## API 响应格式规范

### 成功响应
```typescript
import { sendSuccess, sendCreated, sendPaginated } from './utils/response';

// 单个资源
sendSuccess(res, data);

// 创建资源
sendCreated(res, newResource);

// 分页数据
sendPaginated(res, items, total, page, limit);
```

### 错误响应
```typescript
import { sendError } from './utils/response';

sendError(res, 'NOT_FOUND', '资源不存在', 404);
sendError(res, 'VALIDATION_ERROR', '参数无效', 400, { field: 'name' });
```

---

## 日志记录规范

### 日志级别
| 级别 | 用途 |
|------|------|
| `debug` | 完整的输入输出内容、详细数据 |
| `info` | 操作摘要、关键节点 |
| `warn` | 可恢复异常、降级处理 |
| `error` | 错误、异常、失败 |

### 日志来源
| 来源 | 用途 |
|------|------|
| `dialogue` | 对话系统相关日志 |
| `llm` | LLM 调用相关日志 |
| `combat` | 战斗系统相关日志 |
| `backend` | 后端通用服务日志 |
| `agent` | 智能体相关日志 |
| `system` | 系统级日志 |
| `frontend` | 前端日志 |

### 日志使用示例
```typescript
import { gameLog } from './services/GameLogService';

// 调试日志 - 详细数据
gameLog.debug('backend', '处理请求', { requestId, params });

// 信息日志 - 操作摘要
gameLog.info('backend', '用户登录成功', { userId });

// 警告日志 - 可恢复异常
gameLog.warn('backend', '缓存未命中，使用默认值', { key });

// 错误日志 - 异常
gameLog.error('backend', '数据库连接失败', { error: error.message });
```

### 日志内容截断
超长内容必须截断，默认最大 2000 字符：

```typescript
const MAX_LOG_LENGTH = 2000;
function truncateContent(content: string): string {
  if (content.length <= MAX_LOG_LENGTH) return content;
  return content.substring(0, MAX_LOG_LENGTH) + `... [truncated, total: ${content.length} chars]`;
}
```

---

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
