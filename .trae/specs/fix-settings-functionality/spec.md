# 完善前端设置功能 Spec

## Why
当前设置界面存在三个主要问题：
1. AI设置的LLM配置按钮无效，点击后无任何响应
2. 游戏设置（自动存档、文本速度）更改后无法保存
3. 开发者选项（开发者模式）更改后无法保存

这导致用户无法配置AI模型、API密钥，也无法持久化游戏偏好设置。

## What Changes
- 创建前端 `settingsStore` 用于管理所有设置状态
- 创建 LLM 配置弹窗组件，支持配置多个AI提供商
- 创建后端设置API路由，支持保存/读取设置
- 修改 Settings 组件，使用受控组件模式绑定设置状态
- 设置持久化到localStorage和后端数据库

## Impact
- Affected specs: 设置系统
- Affected code:
  - `packages/frontend/src/stores/` - 新增 settingsStore
  - `packages/frontend/src/components/menu/Settings.tsx` - 重构设置组件
  - `packages/frontend/src/components/settings/` - 新增 LLMConfigModal 组件
  - `packages/backend/src/routes/` - 新增 settingsRoutes
  - `packages/backend/src/services/` - 新增 SettingsService

## ADDED Requirements

### Requirement: 设置状态管理
系统 SHALL 提供统一的设置状态管理，支持以下设置类型：
- AI设置：默认提供商、API密钥、模型选择
- 游戏设置：自动存档开关、文本速度
- 开发者设置：开发者模式开关

#### Scenario: 设置初始化
- **WHEN** 应用启动时
- **THEN** 从localStorage加载已保存的设置
- **AND** 如果localStorage无设置，使用默认值

#### Scenario: 设置保存
- **WHEN** 用户修改设置并点击保存
- **THEN** 设置保存到localStorage
- **AND** 设置同步到后端（如果已登录）
- **AND** 显示保存成功提示

### Requirement: LLM配置功能
系统 SHALL 提供LLM配置界面，支持：
- 配置多个AI提供商（DeepSeek、GLM、Kimi）
- 为每个提供商设置API密钥和自定义URL
- 选择默认提供商和模型
- 测试API连接是否有效

#### Scenario: 打开LLM配置
- **WHEN** 用户点击"LLM配置"按钮
- **THEN** 显示LLM配置弹窗
- **AND** 显示当前已配置的提供商列表

#### Scenario: 配置AI提供商
- **WHEN** 用户输入API密钥并保存
- **THEN** API密钥加密存储到本地
- **AND** 显示"配置成功"提示

#### Scenario: 测试API连接
- **WHEN** 用户点击"测试连接"按钮
- **THEN** 发送测试请求到AI服务
- **AND** 显示连接成功或失败结果

### Requirement: 游戏设置持久化
系统 SHALL 持久化游戏设置，包括：
- 自动存档开关状态
- 文本速度选择

#### Scenario: 切换自动存档
- **WHEN** 用户切换自动存档开关
- **THEN** 设置立即保存到localStorage
- **AND** gameStore的autoSaveEnabled同步更新

#### Scenario: 修改文本速度
- **WHEN** 用户选择文本速度
- **THEN** 设置立即保存到localStorage
- **AND** 文字显示系统使用新速度

### Requirement: 开发者设置持久化
系统 SHALL 持久化开发者设置

#### Scenario: 切换开发者模式
- **WHEN** 用户切换开发者模式开关
- **THEN** 设置立即保存到localStorage
- **AND** 开发者面板显示/隐藏状态更新

## MODIFIED Requirements
无

## REMOVED Requirements
无
