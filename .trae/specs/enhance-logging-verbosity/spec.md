# 增强日志详细程度 - 完整输入输出记录 Spec

## Why

当前日志只记录摘要信息（如 `promptLength`、`messageCount`），用户需要查看完整的输入和输出内容以便调试和监控数据流转。

## What Changes

- 在 LLM 调用时记录完整的 prompt 和 response
- 在对话路由中记录完整的请求和响应内容
- 在各服务中记录详细的输入参数和输出结果
- 使用 `debug` 级别记录详细内容，`info` 级别记录摘要

## Impact

- Affected code:
  - `packages/backend/src/routes/dialogueRoutes.ts` - 记录完整请求/响应
  - `packages/backend/src/services/llm/LLMService.ts` - 记录完整 prompt/response
  - `packages/backend/src/services/CombatService.ts` - 记录详细战斗数据
  - `packages/backend/src/services/NumericalService.ts` - 记录计算详情
  - `packages/backend/src/services/InventoryService.ts` - 记录物品详情
  - `packages/backend/src/services/QuestService.ts` - 记录任务详情
  - `packages/backend/src/services/MapService.ts` - 记录位置详情

## ADDED Requirements

### Requirement: LLM 完整输入输出日志

系统 SHALL 在 LLM 调用时记录完整内容：
- **debug 级别**：记录完整的 messages 数组和 response 内容
- 截断超长内容（超过 2000 字符）并添加省略标记
- 记录格式：`{ messages: [...], response: "...", truncated: true/false }`

### Requirement: 对话路由完整日志

系统 SHALL 在对话路由中记录完整内容：
- **debug 级别**：记录完整的请求体和响应体
- 记录玩家输入的完整文本
- 记录 LLM 返回的完整内容

### Requirement: 服务层详细日志

系统 SHALL 在各服务层记录详细数据：
- **debug 级别**：记录完整的输入参数和输出结果
- 对于复杂对象，使用 JSON 序列化记录

### Requirement: 日志截断策略

系统 SHALL 对超长内容进行截断：
- 默认最大长度：2000 字符
- 截断时添加 `... [truncated, total: X chars]` 标记
- 可通过配置调整最大长度

## MODIFIED Requirements

### Requirement: 日志级别使用规范

修改日志级别使用规范：
- `debug`: 完整的输入输出内容、详细数据
- `info`: 操作摘要、关键节点
- `warn`: 可恢复异常
- `error`: 错误详情
