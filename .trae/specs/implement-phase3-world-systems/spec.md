# Phase 3: 世界系统实现规格

## Why
Phase 1和Phase 2已完成核心玩法系统，现在需要实现世界系统（地图系统和NPC系统），为游戏提供完整的世界探索和角色互动功能。这两个系统是游戏世界构建的基础，支持玩家在游戏世界中移动、探索和与NPC互动。

## What Changes
- **地图系统**: 实现世界/区域/地点层级管理、场景切换、移动系统、场景事件
- **NPC系统**: 实现NPC数据模型、关系系统、NPC行为、队伍管理
- **前端面板**: 创建MapPanel组件

## Impact
- Affected specs: 任务系统(地点相关任务)、对话系统(NPC对话)
- Affected code: 
  - `packages/backend/src/services/MapService.ts` (新建)
  - `packages/backend/src/services/NPCService.ts` (新建)
  - `packages/backend/src/models/MapRepository.ts` (新建)
  - `packages/backend/src/models/NPCRepository.ts` (新建)
  - `packages/backend/src/routes/mapRoutes.ts` (新建)
  - `packages/backend/src/routes/npcRoutes.ts` (新建)
  - `packages/frontend/src/components/panels/MapPanel.tsx` (新建)

## ADDED Requirements

### Requirement: 地图系统 (Map System)

#### Scenario: 地图数据模型
- **WHEN** 创建游戏世界
- **THEN** 系统支持三层地图结构：World(世界) → Region(区域) → Location(地点)
- **AND** 每个地点包含：id、name、description、type、features、npcs、items、events
- **AND** 地点类型：city(城市)、village(村庄)、dungeon(地下城)、wilderness(荒野)、building(建筑)

#### Scenario: 场景管理
- **WHEN** 玩家进入游戏
- **THEN** 系统记录当前位置(worldId, regionId, locationId)
- **AND** 维护已探索区域列表
- **AND** 管理地点之间的连接关系

#### Scenario: 移动系统
- **WHEN** 玩家移动到新地点
- **THEN** 系统检查移动条件(requirements)
- **AND** 计算移动时间(travelTime)
- **AND** 触发离开事件(旧地点)
- **AND** 触发进入事件(新地点)
- **AND** 更新当前位置

#### Scenario: 场景事件
- **WHEN** 玩家进入/离开地点
- **THEN** 系统触发相应事件
- **AND** 事件可以：更新任务进度、生成NPC、改变环境状态

### Requirement: NPC系统 (NPC System)

#### Scenario: NPC数据模型
- **WHEN** 创建NPC
- **THEN** NPC包含：id、name、race、occupation、appearance、personality
- **AND** 关系数据：type、level(-100到100)、trustLevel、interactionCount
- **AND** 状态数据：health、mood、currentLocation、isAvailable
- **AND** 特殊标记：isCompanion、isMerchant、isQuestGiver、isRomanceable

#### Scenario: 关系系统
- **WHEN** 玩家与NPC互动
- **THEN** 系统更新关系等级
- **AND** 更新信任度
- **AND** 记录互动次数和时间
- **AND** 关系类型：neutral、friendly、hostile、romantic

#### Scenario: NPC行为
- **WHEN** 游戏时间推进
- **THEN** NPC按日程(schedule)行动
- **AND** NPC可以在地点间移动
- **AND** NPC状态随时间变化

#### Scenario: 队伍系统
- **WHEN** NPC加入队伍
- **THEN** 设置isCompanion标记
- **AND** NPC跟随玩家移动
- **AND** NPC参与战斗
- **AND** 可以管理队伍成员

## API Endpoints

### 地图系统 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/map/:characterId` | GET | 获取当前地图状态 |
| `/api/map/:characterId/location` | GET | 获取当前位置详情 |
| `/api/map/:characterId/move` | POST | 移动到新地点 |
| `/api/map/:characterId/explore` | POST | 探索当前区域 |
| `/api/map/:characterId/connections` | GET | 获取可移动地点列表 |
| `/api/map/locations/:locationId` | GET | 获取地点详情 |

### NPC系统 API
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/npc/:characterId` | GET | 获取角色相关的NPC列表 |
| `/api/npc/:characterId/:npcId` | GET | 获取NPC详情 |
| `/api/npc/:characterId/:npcId/relationship` | GET | 获取关系状态 |
| `/api/npc/:characterId/:npcId/interact` | POST | 与NPC互动 |
| `/api/npc/:characterId/party` | GET | 获取队伍成员 |
| `/api/npc/:characterId/party/add` | POST | 添加队员 |
| `/api/npc/:characterId/party/remove` | POST | 移除队员 |
