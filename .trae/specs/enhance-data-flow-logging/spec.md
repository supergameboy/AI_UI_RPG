# 增强数据流转日志输出 Spec

## Why

当前日志面板显示"暂无日志记录"，因为：
1. 对话路由和其他关键服务没有调用 `GameLogService` 记录日志
2. 数据流转过程（请求/响应）没有被记录
3. AI 调用虽然有 DeveloperLogService 记录，但没有同时记录到 GameLogService

## What Changes

- 在对话路由中添加详细日志记录
- 在 LLMService 中添加日志记录到 GameLogService
- 在各服务层添加数据流转日志
- 确保日志通过 WebSocket 广播到前端

## Impact

- Affected code:
  - `packages/backend/src/routes/dialogueRoutes.ts` - 添加日志
  - `packages/backend/src/services/llm/LLMService.ts` - 添加日志
  - `packages/backend/src/services/CombatService.ts` - 添加日志
  - `packages/backend/src/services/NumericalService.ts` - 添加日志
  - `packages/backend/src/services/InventoryService.ts` - 添加日志
  - `packages/backend/src/services/SkillService.ts` - 添加日志
  - `packages/backend/src/services/QuestService.ts` - 添加日志
  - `packages/backend/src/services/MapService.ts` - 添加日志
  - `packages/backend/src/services/NPCService.ts` - 添加日志

## ADDED Requirements

### Requirement: 对话路由日志

系统 SHALL 在对话路由中记录以下日志：
- 请求接收时：记录请求参数
- LLM 调用前：记录提示词摘要
- LLM 响应后：记录响应摘要和 Token 使用
- 战斗触发：记录战斗触发信息
- 错误发生：记录错误详情

### Requirement: LLM 服务日志

系统 SHALL 在 LLM 服务中记录：
- 调用开始：提供商、模型、消息数量
- 调用成功：Token 使用、耗时
- 调用失败：错误信息

### Requirement: 数据流转日志

系统 SHALL 在各服务层记录数据流转：
- 服务调用开始：服务名、方法名、参数摘要
- 服务调用结束：结果摘要、耗时
- 数据变更：变更类型、变更内容摘要

### Requirement: 日志级别规范

系统 SHALL 使用以下日志级别：
- `debug`: 详细的数据内容、内部状态
- `info`: 正常的操作流程、服务调用
- `warn`: 可恢复的异常、降级处理
- `error`: 错误、异常、失败

### Requirement: 日志来源规范

系统 SHALL 使用以下日志来源：
- `backend`: 后端通用日志
- `llm`: LLM 调用相关
- `agent`: 智能体相关
- `dialogue`: 对话系统
- `combat`: 战斗系统
- `system`: 系统级日志

## MODIFIED Requirements

无

## REMOVED Requirements

无
