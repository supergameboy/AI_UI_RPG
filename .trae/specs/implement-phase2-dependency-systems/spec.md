# Phase 2: 依赖系统实现规格

## Why
Phase 1已完成数值、背包、技能三个基础系统，现在需要实现装备系统和任务系统，为游戏提供完整的角色成长和目标追踪功能。这两个系统依赖于Phase 1的基础系统，是游戏核心玩法的重要组成部分。

## What Changes
- **装备系统**: 实现装备槽位管理、穿戴/卸下装备、属性加成计算
- **任务系统**: 实现任务数据模型、任务追踪、奖励发放、任务链管理
- **前端面板**: 创建EquipmentPanel和QuestPanel组件

## Impact
- Affected specs: 背包系统(装备功能扩展)、数值系统(属性加成)
- Affected code: 
  - `packages/backend/src/services/EquipmentService.ts` (新建)
  - `packages/backend/src/services/QuestService.ts` (新建)
  - `packages/backend/src/models/QuestRepository.ts` (新建)
  - `packages/backend/src/routes/equipmentRoutes.ts` (新建)
  - `packages/backend/src/routes/questRoutes.ts` (新建)
  - `packages/frontend/src/components/panels/EquipmentPanel.tsx` (新建)
  - `packages/frontend/src/components/panels/QuestPanel.tsx` (完善)

## ADDED Requirements

### Requirement: 装备系统 (Equipment System)

#### Scenario: 装备槽位管理
- **WHEN** 角色创建完成
- **THEN** 系统初始化装备槽位：weapon(武器)、head(头部)、body(身体)、feet(脚部)、accessory(饰品，支持多个)

#### Scenario: 装备穿戴
- **WHEN** 玩家穿戴一件装备
- **THEN** 系统检查装备需求(等级、属性、职业)
- **AND** 检查槽位是否为空或需要替换
- **AND** 将装备放入对应槽位
- **AND** 计算并应用属性加成
- **AND** 从背包移除该物品

#### Scenario: 装备卸下
- **WHEN** 玩家卸下装备
- **THEN** 系统检查背包是否有空位
- **AND** 将装备返回背包
- **AND** 移除属性加成

#### Scenario: 装备替换
- **WHEN** 玩家在已有装备的槽位穿戴新装备
- **THEN** 系统自动卸下旧装备返回背包
- **AND** 穿戴新装备

### Requirement: 任务系统 (Quest System)

#### Scenario: 任务数据模型
- **WHEN** 创建任务
- **THEN** 任务包含：id、name、description、type(main/side/hidden/daily/chain)、status(locked/available/in_progress/completed/failed)
- **AND** 任务目标(objectives)：类型(kill/collect/talk/explore/custom)、目标、当前进度、所需数量
- **AND** 任务奖励(rewards)：经验、金币、物品、声望
- **AND** 前置任务(prerequisites)列表

#### Scenario: 任务追踪
- **WHEN** 玩家进行游戏活动
- **THEN** 系统自动更新相关任务目标进度
- **AND** 当所有目标完成时，标记任务为可完成状态

#### Scenario: 任务完成
- **WHEN** 玩家完成任务
- **THEN** 系统发放奖励(经验、金币、物品)
- **AND** 解锁后续任务(如果有)
- **AND** 更新任务状态为completed

#### Scenario: 任务链
- **WHEN** 完成前置任务
- **THEN** 系统自动解锁后续任务
- **AND** 后续任务状态从locked变为available

## MODIFIED Requirements

### Requirement: 背包系统扩展
- 原有背包系统已支持装备类型物品
- 扩展：添加装备穿戴/卸下API端点
- 扩展：装备槽位与背包物品关联

### Requirement: 数值系统集成
- 原有数值系统已支持属性计算
- 扩展：集成装备属性加成到角色属性计算

## API Endpoints

### 装备系统 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/equipment/:characterId` | GET | 获取角色装备信息 |
| `/api/equipment/:characterId/equip` | POST | 穿戴装备 |
| `/api/equipment/:characterId/unequip` | POST | 卸下装备 |
| `/api/equipment/:characterId/check/:itemId` | GET | 检查装备需求 |

### 任务系统 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/quests/:characterId` | GET | 获取角色任务列表 |
| `/api/quests/:characterId/:questId` | GET | 获取任务详情 |
| `/api/quests/:characterId/available` | GET | 获取可接取任务 |
| `/api/quests/:characterId/accept` | POST | 接取任务 |
| `/api/quests/:characterId/complete` | POST | 完成任务 |
| `/api/quests/:characterId/progress` | POST | 更新任务进度 |
| `/api/quests/:characterId/abandon` | POST | 放弃任务 |
