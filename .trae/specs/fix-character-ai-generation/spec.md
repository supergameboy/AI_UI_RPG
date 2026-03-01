# 修复角色创建 AI 生成请求问题 Spec

## Why

角色创建时 AI 生成种族选项出现两个问题：
1. 前端可能短时间发送大批量重复请求
2. 后端 LLM 适配器未正确初始化，导致 "Adapter not found: deepseek" 错误

## What Changes

- 修复前端请求防抖和重复请求防护
- 修复后端 LLM 服务初始化时加载已保存的配置
- 改进错误处理和用户提示

## Impact

- Affected specs: 角色创建系统
- Affected code:
  - `packages/frontend/src/stores/characterCreationStore.ts`
  - `packages/frontend/src/components/character/RaceSelectionStep.tsx`
  - `packages/backend/src/services/llm/LLMService.ts`
  - `packages/backend/src/index.ts`

## ADDED Requirements

### Requirement: 请求防抖和去重

系统应防止短时间发送重复的 AI 生成请求。

#### Scenario: 防止重复请求
- **GIVEN** 用户进入种族选择界面
- **WHEN** 组件多次渲染或快速切换
- **THEN** 只发送一次 AI 生成请求
- **AND** 后续请求在正在加载时被忽略

### Requirement: LLM 配置持久化加载

系统应在启动时自动加载已保存的 LLM 配置。

#### Scenario: 加载已保存配置
- **GIVEN** 用户之前在设置中配置了 LLM API Key
- **WHEN** 后端服务启动
- **THEN** 自动从设置文件加载配置
- **AND** 注册对应的 LLM 适配器

#### Scenario: 配置不存在时的提示
- **GIVEN** 用户未配置 LLM API Key
- **WHEN** 请求 AI 生成功能
- **THEN** 返回友好的错误提示
- **AND** 指引用户前往设置页面配置

### Requirement: 错误状态显示

系统应在 AI 生成失败时显示友好的错误信息。

#### Scenario: 显示错误信息
- **GIVEN** AI 生成请求失败
- **WHEN** 收到错误响应
- **THEN** 在界面上显示错误信息
- **AND** 提供重试按钮

## MODIFIED Requirements

无修改的需求。

## REMOVED Requirements

无移除的需求。
