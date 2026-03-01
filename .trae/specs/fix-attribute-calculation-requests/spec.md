# 修复角色创建属性计算和请求防抖问题 Spec

## Why

角色创建流程中存在两个问题：
1. `/api/character/calculate-attributes` 端点有时返回 "Cannot GET" 错误（请求方法错误或路由问题）
2. 前端 `CharacterConfirmStep` 组件的 `useEffect` 导致短时间大批量发送请求

## What Changes

- 修复前端 `CharacterConfirmStep` 的 useEffect 依赖和防抖逻辑
- 修复 `characterCreationStore` 中 `calculateAttributes` 的请求状态锁
- 确保后端路由正确处理 POST 请求

## Impact

- Affected specs: 角色创建系统
- Affected code:
  - `packages/frontend/src/components/character/CharacterConfirmStep.tsx`
  - `packages/frontend/src/stores/characterCreationStore.ts`
  - `packages/backend/src/routes/characterRoutes.ts`

## ADDED Requirements

### Requirement: 属性计算请求防抖

系统应防止属性计算的重复请求。

#### Scenario: 防止重复计算
- **GIVEN** 用户进入角色确认界面
- **WHEN** 组件渲染或状态变化
- **THEN** 只发送一次属性计算请求
- **AND** 如果已有计算结果，不重复请求

### Requirement: 请求状态锁

属性计算函数应检查加载状态，防止并发请求。

#### Scenario: 加载中不发送新请求
- **GIVEN** 属性计算请求正在进行中
- **WHEN** 触发新的计算请求
- **THEN** 忽略新请求
- **AND** 等待当前请求完成

## MODIFIED Requirements

无修改的需求。

## REMOVED Requirements

无移除的需求。
