# Phase 3 实现检查清单

## 地图系统 (Map System)

### 类型定义
- [ ] LocationType 类型定义正确 ('city' | 'village' | 'dungeon' | 'wilderness' | 'building' | 'custom')
- [ ] ConnectionType 类型定义正确 ('road' | 'portal' | 'hidden')
- [ ] Location 接口包含所有必需字段
- [ ] Region 接口支持多个地点
- [ ] World 接口支持多个区域
- [ ] MapState 接口完整定义

### 数据访问层
- [ ] MapRepository 实现所有CRUD操作
- [ ] 支持世界/区域/地点层级查询
- [ ] 数据库查询正确处理JSON字段

### 服务层
- [ ] getMapState 正确返回地图状态
- [ ] moveToLocation 正确检查移动条件
- [ ] moveToLocation 正确触发事件
- [ ] exploreArea 正确发现新区域

### API路由
- [ ] GET /api/map/:characterId 返回正确格式
- [ ] POST /api/map/:characterId/move 正确处理移动
- [ ] 错误处理返回正确的HTTP状态码

## NPC系统 (NPC System)

### 类型定义
- [ ] RelationshipType 类型定义正确
- [ ] NPCPersonality 接口包含性格特征
- [ ] NPCRelationship 接口支持好感度系统
- [ ] NPC 接口完整定义
- [ ] PartyMember 接口支持队伍管理

### 数据访问层
- [ ] NPCRepository 实现所有CRUD操作
- [ ] 支持按地点查询NPC
- [ ] 支持关系数据管理
- [ ] 支持队伍成员管理

### 服务层
- [ ] interact 正确更新关系
- [ ] updateRelationship 正确计算好感度变化
- [ ] addPartyMember 正确添加队员
- [ ] removePartyMember 正确移除队员

### API路由
- [ ] GET /api/npc/:characterId 返回NPC列表
- [ ] POST /api/npc/:characterId/:npcId/interact 正确处理互动
- [ ] GET /api/npc/:characterId/party 返回队伍成员
- [ ] 错误处理返回正确的HTTP状态码

## 前端组件

### MapPanel
- [ ] 正确显示当前位置信息
- [ ] 显示可移动地点列表
- [ ] 移动按钮功能正常
- [ ] 显示已探索区域

## 集成测试

### 地图系统
- [ ] 创建世界/区域/地点成功
- [ ] 移动角色成功
- [ ] 探索区域成功
- [ ] 场景事件触发正常

### NPC系统
- [ ] 创建NPC成功
- [ ] 与NPC互动成功
- [ ] 关系更新正确
- [ ] 队伍管理正常

## 代码质量
- [ ] TypeScript 类型检查通过 (npm run typecheck)
- [ ] 无 ESLint 错误
- [ ] 代码风格一致
