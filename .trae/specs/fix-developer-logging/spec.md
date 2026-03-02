# 开发者工具日志修复与Token计费功能 Spec

## Why

日志面板始终为空的原因是 `LogViewer` 组件使用的是本地 `logService`，而 WebSocket 接收的后端日志存储在 `developerStore.logs`。这两个数据源没有同步。同时需要添加 Token 计费功能帮助追踪 API 成本。

## What Changes

- 修复 LogViewer 使用正确的数据源 (`developerStore.logs`)
- 添加 Token 统计标签页到开发者工具
- 创建 Token 计费服务和 API

## Impact

- Affected code:
  - `packages/frontend/src/components/developer/LogViewer.tsx` - 修复数据源
  - `packages/frontend/src/components/developer/DeveloperPanel.tsx` - 添加 Token 标签页
  - `packages/frontend/src/stores/developerStore.ts` - 添加 Token 状态和类型
  - `packages/backend/src/services/TokenUsageService.ts` - 新建
  - `packages/backend/src/routes/tokenRoutes.ts` - 新建
  - `packages/shared/src/types/developer.ts` - 新建 Token 类型

## ADDED Requirements

### Requirement: Token 计费服务

系统 SHALL 提供 Token 使用统计服务：
- 记录每次 LLM 调用的 Token 使用量
- 计算预估费用
- 按智能体和提供商分类统计

### Requirement: Token 统计面板

系统 SHALL 在开发者工具中显示 Token 统计：
- 总 Token 使用量
- 预估费用
- 按智能体分类的统计表格
- 最近请求列表

## MODIFIED Requirements

### Requirement: LogViewer 数据源

修改 LogViewer 组件使用 `developerStore.logs` 作为数据源：
- 移除对本地 `logService.subscribe()` 的调用
- 直接使用 `useDeveloperStore((state) => state.logs)`
- 清空日志功能调用 `clearLogs()` action

### Requirement: 开发者工具标签页

添加 Token 统计标签页：
- 请求、智能体、日志、状态、提示词、**Token**
