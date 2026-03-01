# 对话系统集成与初始场景生成 Spec

## Why

角色创建完成后进入游戏时，当前界面显示硬编码的示例内容，没有与后端对话系统集成。需要实现：
1. 角色创建完成后自动生成初始场景（故事背景、欢迎信息、操作指引）
2. 前端对话组件与后端 DialogueAgent 集成
3. 动态生成 2-5 个快速选项引导玩家

## What Changes

### 前端改动
- 重构 `StoryDisplay.tsx` - 从 gameStore 读取对话历史并渲染
- 重构 `QuickOptions.tsx` - 从后端获取动态选项
- 重构 `ChatInput.tsx` - 发送玩家输入到后端
- 新增 `dialogueService.ts` - 对话 API 服务
- 新增 `dialogueStore.ts` - 对话状态管理
- 修改 `gameStore.ts` - 添加初始场景生成触发逻辑

### 后端改动
- 新增 `POST /api/dialogue/initial` - 生成初始场景对话
- 新增 `POST /api/dialogue/send` - 发送玩家输入并获取响应
- 新增 `POST /api/dialogue/options` - 获取当前对话选项

### 共享类型
- 新增 `DialogueMessage` 类型定义
- 新增 `DialogueOption` 类型定义
- 新增 `InitialSceneRequest` 和 `InitialSceneResponse` 类型

## Impact

- Affected specs: 对话系统、游戏主界面、角色创建流程
- Affected code:
  - `packages/frontend/src/components/game/` - 游戏界面组件
  - `packages/frontend/src/services/` - API 服务
  - `packages/frontend/src/stores/` - 状态管理
  - `packages/backend/src/routes/` - API 路由
  - `packages/shared/src/types/` - 共享类型

## ADDED Requirements

### Requirement: 初始场景生成

系统 SHALL 在角色创建完成后自动生成初始场景对话。

#### Scenario: 角色创建完成进入游戏
- **WHEN** 玩家完成角色创建并确认
- **THEN** 系统调用 `POST /api/dialogue/initial` 生成初始场景
- **AND** 返回包含故事背景、欢迎信息、操作指引的对话内容
- **AND** 返回 2-5 个快速选项引导玩家第一步操作

#### Scenario: 初始场景内容结构
- **GIVEN** 模板的世界观设定和角色信息
- **WHEN** 生成初始场景
- **THEN** 内容包含：
  - 世界背景介绍（1-2段）
  - 角色登场描述（1段）
  - 当前处境说明（1段）
  - 可执行的操作提示

### Requirement: 对话历史显示

系统 SHALL 在主游戏界面显示对话历史。

#### Scenario: 显示对话历史
- **GIVEN** 对话历史数据
- **WHEN** 渲染 StoryDisplay 组件
- **THEN** 按时间顺序显示所有对话消息
- **AND** 区分系统叙述、NPC对话、玩家输入
- **AND** 支持自动滚动到最新消息

#### Scenario: 消息类型样式
- **GIVEN** 不同类型的消息
- **WHEN** 渲染消息
- **THEN** 应用不同的样式：
  - 系统叙述：普通文本，无前缀
  - NPC对话：显示说话者名称，引用样式
  - 玩家输入：右对齐，不同背景色

### Requirement: 快速选项交互

系统 SHALL 提供动态快速选项供玩家选择。

#### Scenario: 显示快速选项
- **GIVEN** 当前对话上下文
- **WHEN** 渲染 QuickOptions 组件
- **THEN** 显示 2-5 个选项按钮
- **AND** 选项内容与当前情境相关
- **AND** 包含"自定义输入"选项

#### Scenario: 选择快速选项
- **WHEN** 玩家点击某个选项
- **THEN** 发送选项内容到后端
- **AND** 获取新的对话响应
- **AND** 更新对话历史和选项列表

### Requirement: 自由输入交互

系统 SHALL 允许玩家自由输入行动。

#### Scenario: 发送自由输入
- **GIVEN** 玩家在输入框输入内容
- **WHEN** 点击发送或按回车
- **THEN** 发送内容到后端 `POST /api/dialogue/send`
- **AND** 清空输入框
- **AND** 显示加载状态
- **AND** 更新对话历史

## MODIFIED Requirements

### Requirement: 游戏状态管理

原：gameStore 管理基础游戏状态
改：gameStore 集成对话状态，支持初始场景生成触发

#### Scenario: 角色创建完成触发
- **WHEN** `onCharacterCreated` 被调用
- **THEN** 设置 screen 为 'game'
- **AND** 调用初始场景生成 API
- **AND** 将返回的对话添加到 messages

## REMOVED Requirements

无移除的需求。
