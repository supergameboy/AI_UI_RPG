# 增强日志消息内容输出 Spec

## Why

之前的日志实现只记录了摘要信息（如消息数量、响应长度），但调试时需要查看完整的输入消息和输出消息内容。

## What Changes

- 在 LLMService 中记录完整的输入消息数组
- 在 LLMService 中记录完整的输出消息内容
- 在对话路由中记录完整的请求和响应内容
- 使用 debug 级别记录详细内容，避免正常使用时日志过多

## Impact

- Affected code:
  - `packages/backend/src/services/llm/LLMService.ts` - 增强日志内容
  - `packages/backend/src/routes/dialogueRoutes.ts` - 增强日志内容

## ADDED Requirements

### Requirement: LLM 输入消息日志

系统 SHALL 在 LLM 调用时记录完整的输入消息：
- 使用 `debug` 级别记录
- 记录完整的 `messages` 数组
- 包含每条消息的 role 和 content

### Requirement: LLM 输出消息日志

系统 SHALL 在 LLM 响应时记录完整的输出消息：
- 使用 `debug` 级别记录
- 记录完整的响应内容
- 记录 Token 使用详情

### Requirement: 对话请求响应日志

系统 SHALL 在对话路由中记录完整内容：
- 记录完整的玩家输入
- 记录完整的 AI 响应
- 记录生成的对话选项

## MODIFIED Requirements

无

## REMOVED Requirements

无
