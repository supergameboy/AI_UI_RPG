# Tasks

## Task 1: 添加 WebSocket 依赖和类型定义

- [x] Task 1.1: 在 `packages/backend/package.json` 添加 ws 依赖
  - `pnpm add ws @types/ws`

- [x] Task 1.2: 在 `packages/shared/src/types/websocket.ts` 创建 WebSocket 消息类型
  - 定义 `WSMessage` 接口
  - 定义 `LLMRequestLog` 和 `AgentMessageLog` 类型
  - 定义消息类型枚举

## Task 2: 创建后端 WebSocket 服务

- [x] Task 2.1: 创建 `packages/backend/src/services/WebSocketService.ts`
  - 使用 ws 库创建 WebSocket 服务器
  - 管理客户端连接（添加、移除、广播）
  - 提供类型安全的广播方法
  - 支持与 Express 服务器共享端口

- [x] Task 2.2: 创建 `packages/backend/src/services/DeveloperLogService.ts`
  - 收集 LLM 请求日志
  - 收集智能体消息日志
  - 通过 WebSocket 广播日志事件
  - 提供日志查询方法（用于初始化）

## Task 3: 集成 LLM 请求记录

- [x] Task 3.1: 修改 `packages/backend/src/services/llm/LLMService.ts`
  - 在 `chat` 方法中添加请求开始记录
  - 在请求成功/失败时更新记录
  - 通过 WebSocket 广播事件

- [x] Task 3.2: 在 `chatStream` 方法中添加流式请求记录
  - 记录流式请求的开始和结束
  - 累计 Token 使用量

## Task 4: 集成智能体消息记录

- [x] Task 4.1: 修改 `packages/backend/src/agents/AgentBase.ts`
  - 在 `sendMessage` 方法中记录发送的消息
  - 在消息处理时记录接收的消息
  - 通过 WebSocket 广播事件

## Task 5: 后端服务集成

- [x] Task 5.1: 修改 `packages/backend/src/index.ts`
  - 初始化 WebSocket 服务
  - 初始化 DeveloperLogService
  - 在服务关闭时清理资源

- [x] Task 5.2: 创建日志 API 路由（用于初始化加载历史日志）
  - `GET /api/logs/llm` - 获取最近的 LLM 请求日志
  - `GET /api/logs/agents` - 获取最近的智能体消息日志

## Task 6: 创建前端 WebSocket 服务

- [x] Task 6.1: 创建 `packages/frontend/src/services/websocketService.ts`
  - 管理 WebSocket 连接
  - 自动重连机制（指数退避）
  - 事件订阅/取消订阅模式
  - 连接状态管理

- [x] Task 6.2: 创建 WebSocket React Hook（可选）
  - `useWebSocket` hook 用于组件中订阅事件

## Task 7: 前端 Store 集成

- [x] Task 7.1: 修改 `packages/frontend/src/stores/developerStore.ts`
  - 添加 WebSocket 连接状态
  - 订阅 LLM 请求事件
  - 订阅智能体消息事件
  - 添加连接/断开方法

- [x] Task 7.2: 在应用启动时初始化 WebSocket 连接
  - 在 GameLayout 或 App 中初始化

## Task 8: 更新开发者面板组件

- [x] Task 8.1: 修改 `packages/frontend/src/components/developer/RequestMonitor.tsx`
  - 显示实时 LLM 请求记录
  - 显示连接状态指示器
  - 添加清空日志按钮

- [x] Task 8.2: 修改 `packages/frontend/src/components/developer/AgentCommunication.tsx`
  - 显示实时智能体消息
  - 显示连接状态指示器
  - 添加清空日志按钮

## Task 9: 类型检查和测试

- [x] Task 9.1: 运行类型检查
  - `pnpm -r run typecheck`

- [x] Task 9.2: 功能测试
  - 启动后端和前端服务
  - 验证 WebSocket 连接成功
  - 测试 LLM 请求实时显示
  - 测试智能体消息实时显示
  - 测试断线重连

---

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 2
- Task 5 依赖 Task 2, Task 3, Task 4
- Task 7 依赖 Task 6
- Task 8 依赖 Task 7
- Task 9 依赖 Task 1-8

# Parallelizable Work

- Task 3 和 Task 4 可以并行执行
- Task 6.1 和 Task 6.2 可以并行执行
- Task 8.1 和 Task 8.2 可以并行执行
