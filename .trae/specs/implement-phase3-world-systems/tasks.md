# Tasks

## Task 1: 创建地图系统类型定义
- [ ] Task 1.1: 在 `packages/shared/src/types/map.ts` 中定义地图类型接口
  - LocationType: 'city' | 'village' | 'dungeon' | 'wilderness' | 'building' | 'custom'
  - ConnectionType: 'road' | 'portal' | 'hidden'
  - Location: id, name, description, type, features, npcs, items, events, environment
  - Region: id, name, description, locations[]
  - World: id, name, description, regions[]
  - MapState: currentLocation, exploredAreas, connections
  - MoveResult: success, newLocation, travelTime, triggeredEvents

## Task 2: 实现MapRepository数据访问层
- [ ] Task 2.1: 创建 `packages/backend/src/models/MapRepository.ts`
  - createWorld: 创建世界
  - createRegion: 创建区域
  - createLocation: 创建地点
  - getWorld: 获取世界数据
  - getRegion: 获取区域数据
  - getLocation: 获取地点数据
  - getCurrentLocation: 获取角色当前位置
  - setCurrentLocation: 设置角色当前位置
  - addExploredArea: 添加已探索区域
  - getConnections: 获取地点连接
  - addConnection: 添加地点连接

## Task 3: 实现MapService服务层
- [ ] Task 3.1: 创建 `packages/backend/src/services/MapService.ts`
  - getMapState: 获取地图状态
  - getCurrentLocation: 获取当前位置详情
  - moveToLocation: 移动到新地点（检查条件、计算时间、触发事件）
  - exploreArea: 探索当前区域
  - getAvailableConnections: 获取可移动地点
  - triggerLocationEvent: 触发地点事件
  - initializeWorld: 初始化游戏世界

## Task 4: 实现地图系统API路由
- [ ] Task 4.1: 创建 `packages/backend/src/routes/mapRoutes.ts`
  - GET /api/map/:characterId - 获取地图状态
  - GET /api/map/:characterId/location - 获取当前位置
  - POST /api/map/:characterId/move - 移动到新地点
  - POST /api/map/:characterId/explore - 探索区域
  - GET /api/map/:characterId/connections - 获取可移动地点
  - GET /api/map/locations/:locationId - 获取地点详情
- [ ] Task 4.2: 在 `packages/backend/src/index.ts` 中注册路由

## Task 5: 创建NPC系统类型定义
- [ ] Task 5.1: 在 `packages/shared/src/types/npc.ts` 中定义NPC类型接口
  - RelationshipType: 'neutral' | 'friendly' | 'hostile' | 'romantic' | 'custom'
  - NPCPersonality: traits, values, fears, desires
  - NPCRelationship: type, level, trustLevel, interactionCount, lastInteraction
  - NPCStatus: health, mood, currentLocation, isAvailable, schedule
  - NPCFlags: isCompanion, isMerchant, isQuestGiver, isRomanceable
  - NPC: 完整NPC数据结构
  - PartyMember: 队伍成员数据

## Task 6: 实现NPCRepository数据访问层
- [ ] Task 6.1: 创建 `packages/backend/src/models/NPCRepository.ts`
  - createNPC: 创建NPC
  - getNPC: 获取NPC数据
  - getNPCsByLocation: 获取地点内的NPC
  - getNPCsByCharacter: 获取角色相关的NPC
  - updateNPCStatus: 更新NPC状态
  - updateRelationship: 更新关系
  - getRelationship: 获取关系数据
  - addToParty: 添加到队伍
  - removeFromParty: 移除出队伍
  - getPartyMembers: 获取队伍成员

## Task 7: 实现NPCService服务层
- [ ] Task 7.1: 创建 `packages/backend/src/services/NPCService.ts`
  - getNPC: 获取NPC详情
  - getNPCsByLocation: 获取地点NPC列表
  - interact: 与NPC互动（更新关系、记录历史）
  - updateRelationship: 更新关系等级
  - getPartyMembers: 获取队伍成员
  - addPartyMember: 添加队员
  - removePartyMember: 移除队员
  - updateNPCSchedule: 更新NPC日程
  - moveNPC: 移动NPC到新地点

## Task 8: 实现NPC系统API路由
- [ ] Task 8.1: 创建 `packages/backend/src/routes/npcRoutes.ts`
  - GET /api/npc/:characterId - 获取NPC列表
  - GET /api/npc/:characterId/:npcId - 获取NPC详情
  - GET /api/npc/:characterId/:npcId/relationship - 获取关系状态
  - POST /api/npc/:characterId/:npcId/interact - 与NPC互动
  - GET /api/npc/:characterId/party - 获取队伍
  - POST /api/npc/:characterId/party/add - 添加队员
  - POST /api/npc/:characterId/party/remove - 移除队员
- [ ] Task 8.2: 在 `packages/backend/src/index.ts` 中注册路由

## Task 9: 创建前端MapPanel组件
- [ ] Task 9.1: 创建 `packages/frontend/src/components/panels/MapPanel.tsx`
  - 显示当前位置信息（名称、描述、类型）
  - 显示可移动地点列表
  - 移动按钮（显示移动时间）
  - 已探索区域列表
  - 当前地点NPC列表
  - 当前地点可交互对象

## Task 10: 数据库迁移
- [ ] Task 10.1: 更新 `packages/backend/src/database/schema.sql`
  - worlds表：id, name, description, created_at
  - regions表：id, world_id, name, description
  - locations表：id, region_id, name, description, type, features, npcs, items, events, environment
  - location_connections表：from_location, to_location, type, travel_time, requirements
  - character_locations表：character_id, world_id, region_id, location_id
  - explored_areas表：character_id, location_id, explored_at
  - npcs表：id, name, race, occupation, appearance, personality, status, flags
  - npc_relationships表：character_id, npc_id, type, level, trust_level, interaction_count
  - party_members表：character_id, npc_id, joined_at
- [ ] Task 10.2: 在 `packages/backend/src/database/initializer.ts` 中添加迁移逻辑

## Task 11: 测试与验证
- [ ] Task 11.1: 测试地图系统API
  - 创建世界/区域/地点
  - 移动角色
  - 探索区域
- [ ] Task 11.2: 测试NPC系统API
  - 创建NPC
  - 与NPC互动
  - 管理队伍
- [ ] Task 11.3: 运行TypeScript类型检查

# Task Dependencies
- Task 2 依赖 Task 1 (类型定义)
- Task 3 依赖 Task 2 (Repository)
- Task 4 依赖 Task 3 (Service)
- Task 6 依赖 Task 5 (类型定义)
- Task 7 依赖 Task 6 (Repository)
- Task 8 依赖 Task 7 (Service)
- Task 9 依赖 Task 4 (API)
- Task 10 依赖 Task 1, Task 5
- Task 11 依赖所有前置任务

# Parallelizable Work
- Task 1 和 Task 5 可以并行（类型定义）
- Task 2-4 (地图系统) 和 Task 6-8 (NPC系统) 可以并行
- Task 10 可以在类型定义完成后并行
