# 项目初始化 Spec

## Why
项目需要一个清晰的基础架构来支持后续开发。采用Monorepo结构可以统一管理前端(React)和后端(Node.js)代码，简化依赖管理和构建流程。

## What Changes
- 创建Monorepo项目结构
- 配置前端React + TypeScript项目
- 配置后端Node.js + Express项目
- 设置共享类型定义包
- 配置开发工具（ESLint、Prettier、TypeScript）
- 创建基础目录结构

## Impact
- Affected specs: 无（这是第一个spec）
- Affected code: 整个项目根目录

## ADDED Requirements

### Requirement: Monorepo项目结构
系统 SHALL 使用pnpm workspace管理Monorepo项目结构。

#### Scenario: 项目结构创建
- **WHEN** 开发者克隆项目仓库
- **THEN** 应看到清晰的Monorepo结构：
  - `packages/frontend` - React前端项目
  - `packages/backend` - Node.js后端项目
  - `packages/shared` - 共享类型定义和工具
  - `pnpm-workspace.yaml` - workspace配置

### Requirement: 前端项目配置
系统 SHALL 提供完整的React前端项目配置。

#### Scenario: 前端项目初始化
- **WHEN** 开发者进入packages/frontend目录
- **THEN** 应包含：
  - Vite构建工具配置
  - React 18 + TypeScript
  - 基础目录结构（components、pages、stores、services、utils、styles）
  - ESLint + Prettier配置

### Requirement: 后端项目配置
系统 SHALL 提供完整的Node.js后端项目配置。

#### Scenario: 后端项目初始化
- **WHEN** 开发者进入packages/backend目录
- **THEN** 应包含：
  - Express框架配置
  - TypeScript支持
  - 基础目录结构（routes、services、models、utils、middleware）
  - 开发热重载配置

### Requirement: 共享类型包
系统 SHALL 提供共享类型定义包。

#### Scenario: 类型共享
- **WHEN** 前端或后端需要使用共享类型
- **THEN** 可以从`@ai-rpg/shared`包导入
- **AND** 类型定义与设计文档一致

### Requirement: 开发工具配置
系统 SHALL 提供统一的开发工具配置。

#### Scenario: 代码规范
- **WHEN** 开发者编写代码
- **THEN** ESLint和Prettier自动检查和格式化
- **AND** TypeScript严格模式启用

#### Scenario: 开发命令
- **WHEN** 开发者运行`pnpm dev`
- **THEN** 前端和后端同时启动开发服务器
- **AND** 前端支持热重载
- **AND** 后端支持热重载

### Requirement: 基础配置文件
系统 SHALL 提供项目基础配置文件。

#### Scenario: 配置文件存在
- **WHEN** 查看项目根目录
- **THEN** 应存在以下配置文件：
  - `package.json` - 根项目配置
  - `pnpm-workspace.yaml` - workspace配置
  - `tsconfig.json` - TypeScript基础配置
  - `.eslintrc.js` - ESLint配置
  - `.prettierrc` - Prettier配置
  - `.gitignore` - Git忽略配置
  - `README.md` - 项目说明
