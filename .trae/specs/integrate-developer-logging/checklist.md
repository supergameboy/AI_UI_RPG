# Checklist

## WebSocket 基础设施

- [x] ws 依赖已添加到 backend package.json
- [x] WebSocket 消息类型在 shared 包中定义
- [x] WebSocketService.ts 创建完成，支持客户端管理和广播
- [x] DeveloperLogService.ts 创建完成，支持日志收集和广播

## 后端 LLM 请求记录

- [x] LLMService.chat 方法记录请求并广播
- [x] LLMService.chatStream 方法记录流式请求
- [x] 请求记录包含完整的 Prompt 和 Response
- [x] Token 使用量正确记录
- [x] WebSocket 实时推送请求事件

## 后端智能体消息记录

- [x] AgentBase.sendMessage 记录发送的消息并广播
- [x] AgentBase 消息处理记录接收的消息
- [x] 消息状态正确记录（sent/received/error）
- [x] WebSocket 实时推送消息事件

## 后端服务集成

- [x] index.ts 初始化 WebSocket 服务
- [x] index.ts 初始化 DeveloperLogService
- [x] 服务关闭时正确清理资源
- [x] 日志 API 路由创建完成

## 前端 WebSocket 服务

- [x] websocketService.ts 创建完成
- [x] 支持自动重连（指数退避）
- [x] 支持事件订阅/取消订阅
- [x] 连接状态管理正确

## 前端 Store 集成

- [x] developerStore.ts 订阅 WebSocket 事件
- [x] LLM 请求事件正确更新 store
- [x] 智能体消息事件正确更新 store
- [x] 应用启动时初始化 WebSocket 连接

## 开发者面板组件

- [x] RequestMonitor.tsx 显示实时 LLM 请求记录
- [x] RequestMonitor.tsx 显示连接状态指示器
- [x] AgentCommunication.tsx 显示实时智能体消息
- [x] AgentCommunication.tsx 显示连接状态指示器
- [x] 清空日志功能正常工作

## 类型检查

- [x] 所有包通过 `pnpm -r run typecheck`
- [x] 无 TypeScript 类型错误

## 功能测试

- [x] WebSocket 连接成功建立
- [x] 断线后自动重连
- [x] 发起 LLM 请求后，开发者面板实时显示请求记录
- [x] 智能体发送消息后，开发者面板实时显示消息记录
- [x] 日志详情正确显示 Prompt、Response、Token 信息
- [x] 多个客户端可同时连接
