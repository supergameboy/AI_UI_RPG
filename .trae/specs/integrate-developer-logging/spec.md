# 集成开发者工具日志 Spec

## Why

开发者工具的请求监控和智能体通信面板已实现前端组件，但缺少后端日志数据的集成。当前面板显示"暂无请求记录"和"暂无消息记录"，需要将后端 LLM 请求和智能体消息实时推送到前端显示。

采用 WebSocket 实时推送方案，为后续游戏实时交互（如战斗、对话、事件）奠定基础。

## What Changes

- 添加 WebSocket 依赖（ws 库）
- 创建 WebSocket 服务实现前后端实时通信
- 在后端 LLMService 中添加请求记录并实时推送
- 在后端 AgentBase 中添加消息日志记录并实时推送
- 前端 developerStore 通过 WebSocket 接收实时日志数据

## Impact

- Affected specs: 开发者工具系统、实时通信基础设施
- Affected code:
  - `packages/backend/package.json` - 添加 ws 依赖
  - `packages/backend/src/services/WebSocketService.ts` - 新建
  - `packages/backend/src/services/llm/LLMService.ts`
  - `packages/backend/src/agents/AgentBase.ts`
  - `packages/backend/src/index.ts`
  - `packages/frontend/src/services/websocketService.ts` - 新建
  - `packages/frontend/src/stores/developerStore.ts`

## ADDED Requirements

### Requirement: WebSocket 服务基础设施

系统 SHALL 提供 WebSocket 服务，支持前后端实时双向通信。

#### Scenario: 后端启动 WebSocket 服务
- **WHEN** 后端服务启动
- **THEN** WebSocket 服务在指定端口启动
- **AND** 支持多个客户端同时连接

#### Scenario: 前端连接 WebSocket
- **WHEN** 前端应用启动
- **THEN** 自动建立 WebSocket 连接
- **AND** 连接断开时自动重连

### Requirement: LLM 请求实时记录

系统 SHALL 在每次 LLM API 调用时实时推送请求信息，包括：
- 请求 ID、时间戳
- 智能体类型、提供商、模型
- 请求状态（pending/success/error）
- 耗时、Token 使用量
- Prompt 和 Response 内容

#### Scenario: LLM 请求成功
- **WHEN** 智能体调用 LLM API
- **THEN** 系统立即推送请求开始事件（status: pending）
- **AND** 请求完成后推送更新事件（status: success）
- **AND** 包含响应内容和 Token 使用量

#### Scenario: LLM 请求失败
- **WHEN** LLM API 调用发生错误
- **THEN** 系统推送更新事件（status: error）
- **AND** 包含错误信息

### Requirement: 智能体消息实时记录

系统 SHALL 在智能体发送和接收消息时实时推送日志，包括：
- 消息 ID、时间戳
- 发送者、接收者
- 消息类型、动作
- 消息状态（sent/received/error）
- Payload 数据

#### Scenario: 智能体发送消息
- **WHEN** 智能体调用 sendMessage 方法
- **THEN** 系统实时推送消息事件（status: sent）
- **AND** 包含发送者、接收者、动作和 Payload

#### Scenario: 智能体接收消息
- **WHEN** 智能体收到消息
- **THEN** 系统实时推送消息事件（status: received）
- **AND** 包含消息详情

### Requirement: 前端实时显示

前端开发者面板 SHALL 实时显示 WebSocket 推送的日志数据。

#### Scenario: 开发者面板接收日志
- **WHEN** WebSocket 推送新的 LLM 请求或智能体消息
- **THEN** 前端 developerStore 更新状态
- **AND** 开发者面板实时显示新记录

## WebSocket 消息协议

### 消息格式

```typescript
interface WSMessage {
  type: 'llm_request' | 'llm_update' | 'agent_message' | 'log';
  payload: unknown;
  timestamp: number;
}
```

### 消息类型

| 类型 | 描述 | Payload |
|------|------|---------|
| `llm_request` | 新的 LLM 请求开始 | `LLMRequestLog` |
| `llm_update` | LLM 请求状态更新 | `{ id, status, ...updates }` |
| `agent_message` | 智能体消息 | `AgentMessageLog` |
| `log` | 系统日志 | `LogEntry` |

---

## 技术方案

### 后端实现

1. **WebSocket 服务** (`packages/backend/src/services/WebSocketService.ts`)
   - 使用 `ws` 库
   - 管理客户端连接
   - 提供广播方法

2. **日志服务** (`packages/backend/src/services/DeveloperLogService.ts`)
   - 收集 LLM 请求和智能体消息
   - 通过 WebSocket 广播

### 前端实现

1. **WebSocket 服务** (`packages/frontend/src/services/websocketService.ts`)
   - 管理 WebSocket 连接
   - 自动重连机制
   - 事件订阅模式

2. **Store 集成** (`packages/frontend/src/stores/developerStore.ts`)
   - 订阅 WebSocket 事件
   - 更新日志状态
