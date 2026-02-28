# 修复TypeScript类型错误 Spec

## Why
后端代码存在10个TypeScript类型错误，需要修复以确保代码质量和类型安全。这些错误主要包括：类型断言缺失、未使用的变量/导入、以及类型不匹配问题。

## What Changes
- 修复 `src/index.ts` 中LLMProviderConfig缺少provider属性的问题
- 修复 `src/services/DatabaseService.ts` 中unknown[]类型问题
- 修复 `src/services/llm/*.ts` 中response.json()返回unknown类型问题
- 清理 `src/services/llm/LLMService.ts` 中未使用的导入和变量

## Impact
- Affected code: 
  - `packages/backend/src/index.ts`
  - `packages/backend/src/services/DatabaseService.ts`
  - `packages/backend/src/services/llm/DeepSeekAdapter.ts`
  - `packages/backend/src/services/llm/GLMAdapter.ts`
  - `packages/backend/src/services/llm/KimiAdapter.ts`
  - `packages/backend/src/services/llm/LLMService.ts`

## ADDED Requirements

### Requirement: 类型安全
所有代码必须通过TypeScript严格类型检查。

#### Scenario: 后端typecheck通过
- **WHEN** 运行 `npx tsc --noEmit`
- **THEN** 没有任何错误输出

## 错误详情

### 1. index.ts:254 - LLMProviderConfig缺少provider属性
需要在registerProvider调用中添加provider字段。

### 2. DatabaseService.ts:162,172,185 - unknown[]类型问题
需要将params参数正确类型化为SqlValue[]。

### 3. LLM适配器 - response.json()返回unknown
需要添加类型断言 `as XxxResponse`。

### 4. LLMService.ts - 未使用的导入和变量
移除未使用的LLMConfig、LLMSettings导入和key变量。
