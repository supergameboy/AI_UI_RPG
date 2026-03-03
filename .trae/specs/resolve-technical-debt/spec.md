# 技术债务解决与日志完善 Spec

## Why
项目存在技术债务问题：类型定义分散、错误处理不统一、API响应格式不一致。同时需要完善数据流转日志记录，确保所有关键操作都有日志追踪。

## What Changes
- 统一类型定义到 `packages/shared/src/types/` 目录
- 创建统一的错误处理中间件和标准错误类型
- 创建统一的 API 响应格式
- 完善数据流转日志记录
- 更新项目规则文档

## Impact
- Affected specs: 所有 API 路由、服务层、前端服务
- Affected code: 
  - `packages/backend/src/middleware/` (新建)
  - `packages/backend/src/routes/*.ts`
  - `packages/backend/src/services/*.ts`
  - `packages/frontend/src/services/*.ts`
  - `packages/shared/src/types/`
  - `.trae/rules/project_rules.md`

## ADDED Requirements

### Requirement: 统一类型定义
系统 SHALL 将所有共享类型定义集中在 `packages/shared/src/types/` 目录下。

#### Scenario: 类型定义整理
- **WHEN** 开发者需要使用类型定义
- **THEN** 所有共享类型都可以从 `@ai-rpg/shared` 包导入

### Requirement: 统一错误处理
系统 SHALL 提供统一的错误处理机制。

#### Scenario: 错误响应格式
- **WHEN** API 发生错误
- **THEN** 返回统一格式的错误响应：
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

### Requirement: 统一 API 响应格式
系统 SHALL 使用统一的 API 响应格式。

#### Scenario: 成功响应格式
- **WHEN** API 调用成功
- **THEN** 返回统一格式的响应：
```typescript
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    total?: number,
    timestamp?: number
  }
}
```

### Requirement: 完善日志记录
系统 SHALL 在所有关键数据流转点添加日志记录。

#### Scenario: 服务层日志
- **WHEN** 服务层执行关键操作
- **THEN** 记录操作类型、输入参数、输出结果

#### Scenario: API 路由日志
- **WHEN** API 路由处理请求
- **THEN** 记录请求参数、响应结果、执行时间

### Requirement: 项目规则文档更新
系统 SHALL 更新项目规则文档，包含类型定义、错误处理、API响应格式规范。

## MODIFIED Requirements
无

## REMOVED Requirements
无
