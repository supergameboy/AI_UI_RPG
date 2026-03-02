# 游戏初始化流程 Spec

## Why

角色创建完成后，需要自动初始化所有游戏系统（数值、技能、背包、装备、任务、地图、NPC），确保玩家能够正常开始游戏。目前初始场景对话已实现，但其他初始化步骤尚未完成。

## What Changes

- 实现完整的角色初始化流程，按依赖顺序执行各系统初始化
- 创建统一的初始化服务 `InitializationService`
- 添加初始化状态管理和进度显示
- 确保初始化失败时的错误处理和回滚机制

## Impact

- Affected specs: 数值系统、背包系统、技能系统、装备系统、任务系统、地图系统、NPC系统
- Affected code:
  - `packages/backend/src/services/InitializationService.ts` (新建)
  - `packages/backend/src/routes/initializationRoutes.ts` (新建)
  - `packages/frontend/src/stores/gameStore.ts` (修改)
  - `packages/frontend/src/components/game/InitializationProgress.tsx` (新建)

## ADDED Requirements

### Requirement: 初始化服务

系统 SHALL 提供统一的初始化服务，在角色创建后自动执行以下步骤：

1. **数值初始化** - 计算初始属性、HP/MP、派生属性
2. **技能初始化** - 根据职业添加初始技能
3. **背包初始化** - 添加初始物品、金币
4. **装备初始化** - 自动装备初始装备
5. **任务初始化** - 创建隐藏主线任务
6. **地图初始化** - 设置初始场景位置
7. **NPC初始化** - 加载场景NPC

#### Scenario: 正常初始化流程

- **WHEN** 玩家完成角色创建并确认
- **THEN** 系统按顺序执行所有初始化步骤
- **AND** 每个步骤完成后更新进度状态
- **AND** 所有步骤完成后进入游戏主界面

#### Scenario: 初始化失败

- **WHEN** 某个初始化步骤失败
- **THEN** 系统显示错误信息
- **AND** 提供重试选项
- **AND** 记录失败日志

### Requirement: 初始化进度显示

系统 SHALL 在初始化过程中显示进度：

- 显示当前正在执行的步骤
- 显示总体进度百分比
- 显示每个步骤的完成状态

### Requirement: 初始数据配置

系统 SHALL 支持从模板配置读取初始数据：

- 初始技能列表（按职业）
- 初始物品列表（按背景）
- 初始装备列表（按职业）
- 初始金币数量（按背景）
- 初始位置（按模板设定）

## MODIFIED Requirements

### Requirement: 角色创建流程

修改现有的角色创建流程，在确认角色后触发完整初始化：

- 原流程：创建角色 → 显示角色卡 → 生成初始场景
- 新流程：创建角色 → 显示角色卡 → 执行初始化 → 生成初始场景

## REMOVED Requirements

无
