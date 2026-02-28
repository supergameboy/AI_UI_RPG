# UI改进修复 Spec

## Why
用户测试发现了多个UI问题需要修复，包括设置弹窗显示不全、返回确认缺失、设置按钮行为错误、布局优化、面板缺失和按钮功能缺失等问题。

## What Changes
- 设置弹窗添加滚动条，确保所有设置项完整显示
- 游戏界面返回按钮添加确认弹窗
- 修复设置按钮行为，在游戏界面点击设置应保留游戏界面背景
- 将底部信息栏（小地图、队伍状态、快捷栏）移至游戏左侧
- TabBar添加NPC面板和记录面板
- 世界地图按钮添加打开地图面板功能

## Impact
- Affected specs: implement-ui-framework
- Affected code: 
  - `packages/frontend/src/components/menu/Settings.tsx` - 添加滚动条
  - `packages/frontend/src/components/layout/Header.tsx` - 返回确认弹窗
  - `packages/frontend/src/stores/gameStore.ts` - 设置状态管理
  - `packages/frontend/src/components/layout/GameLayout.tsx` - 布局调整
  - `packages/frontend/src/components/layout/Footer.tsx` - 移除信息栏
  - `packages/frontend/src/components/layout/TabBar.tsx` - 添加新面板
  - `packages/frontend/src/components/layout/MiniMap.tsx` - 世界地图按钮功能

## ADDED Requirements

### Requirement: 设置弹窗滚动
设置弹窗内容区域应支持滚动，确保所有设置项完整显示。

#### Scenario: 设置项过多时
- **WHEN** 设置内容超出弹窗高度
- **THEN** 显示滚动条，用户可以滚动查看所有设置

### Requirement: 返回确认弹窗
从游戏界面返回主菜单时应显示确认弹窗，防止误操作。

#### Scenario: 点击返回按钮
- **WHEN** 用户在游戏界面点击返回按钮
- **THEN** 显示确认弹窗询问"确定要返回主菜单吗？"
- **AND** 用户确认后才执行返回操作

### Requirement: 游戏中设置行为
在游戏界面点击设置按钮时，应保留游戏界面作为背景。

#### Scenario: 游戏中打开设置
- **WHEN** 用户在游戏界面点击设置按钮
- **THEN** 显示设置弹窗，游戏界面作为背景可见
- **AND** 关闭设置后返回游戏界面

### Requirement: 信息栏左侧布局
底部信息栏（小地图、队伍状态、快捷栏）应移至游戏左侧，与右侧面板对称。

#### Scenario: 左侧信息栏显示
- **WHEN** 用户进入游戏界面
- **THEN** 左侧显示信息栏（小地图、队伍状态、快捷栏）
- **AND** 右侧显示面板容器（角色、技能等）

### Requirement: NPC和记录面板
TabBar应包含NPC面板和记录面板。

#### Scenario: NPC面板
- **WHEN** 用户点击NPC标签
- **THEN** 显示遇到的NPC列表

#### Scenario: 记录面板
- **WHEN** 用户点击记录标签
- **THEN** 显示故事记录/对话历史

### Requirement: 世界地图按钮功能
世界地图按钮应能打开地图面板。

#### Scenario: 点击世界地图
- **WHEN** 用户点击世界地图按钮
- **THEN** 打开地图面板

## MODIFIED Requirements
无

## REMOVED Requirements
无
