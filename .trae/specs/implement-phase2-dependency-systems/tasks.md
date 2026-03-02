# Tasks

## Task 1: 创建任务系统类型定义
- [x] Task 1.1: 在 `packages/shared/src/types/quest.ts` 中定义Quest类型接口
  - QuestType: 'main' | 'side' | 'hidden' | 'daily' | 'chain'
  - QuestStatus: 'locked' | 'available' | 'in_progress' | 'completed' | 'failed'
  - QuestObjective: id, description, type, target, current, required, isCompleted
  - QuestRewards: experience, currency, items, reputation
  - Quest: 完整任务数据结构

## Task 2: 实现QuestRepository数据访问层
- [x] Task 2.1: 创建 `packages/backend/src/models/QuestRepository.ts`
  - createQuest: 创建任务
  - getQuest: 获取单个任务
  - getCharacterQuests: 获取角色所有任务
  - getAvailableQuests: 获取可接取任务
  - updateQuestStatus: 更新任务状态
  - updateObjectiveProgress: 更新目标进度
  - deleteQuest: 删除任务

## Task 3: 实现QuestService服务层
- [x] Task 3.1: 创建 `packages/backend/src/services/QuestService.ts`
  - acceptQuest: 接取任务（检查前置条件）
  - completeQuest: 完成任务（发放奖励、解锁后续任务）
  - updateProgress: 更新任务进度
  - abandonQuest: 放弃任务
  - checkPrerequisites: 检查前置任务
  - grantRewards: 发放奖励

## Task 4: 实现任务系统API路由
- [ ] Task 4.1: 创建 `packages/backend/src/routes/questRoutes.ts`
  - GET /api/quests/:characterId - 获取任务列表
  - GET /api/quests/:characterId/:questId - 获取任务详情
  - GET /api/quests/:characterId/available - 获取可接取任务
  - POST /api/quests/:characterId/accept - 接取任务
  - POST /api/quests/:characterId/complete - 完成任务
  - POST /api/quests/:characterId/progress - 更新进度
  - POST /api/quests/:characterId/abandon - 放弃任务
- [ ] Task 4.2: 在 `packages/backend/src/index.ts` 中注册路由

## Task 5: 完善装备系统类型定义
- [x] Task 5.1: 在 `packages/shared/src/types/item.ts` 中确认EquipmentSlotType定义
- [x] Task 5.2: 在 `packages/shared/src/types/item.ts` 中添加EquipResult接口

## Task 6: 实现EquipmentService服务层
- [x] Task 6.1: 创建 `packages/backend/src/services/EquipmentService.ts`
  - getEquipment: 获取角色装备信息
  - equipItem: 穿戴装备（检查需求、处理替换）
  - unequipItem: 卸下装备（检查背包空间）
  - checkRequirements: 检查装备需求
  - calculateEquipmentStats: 计算装备属性加成

## Task 7: 实现装备系统API路由
- [x] Task 7.1: 创建 `packages/backend/src/routes/equipmentRoutes.ts`
  - GET /api/equipment/:characterId - 获取装备信息
  - POST /api/equipment/:characterId/equip - 穿戴装备
  - POST /api/equipment/:characterId/unequip - 卸下装备
  - GET /api/equipment/:characterId/check/:itemId - 检查装备需求
- [x] Task 7.2: 在 `packages/backend/src/index.ts` 中注册路由

## Task 8: 创建前端EquipmentPanel组件
- [x] Task 8.1: 创建 `packages/frontend/src/components/panels/EquipmentPanel.tsx`
  - 显示装备槽位（武器、头部、身体、脚部、饰品）
  - 显示已装备物品信息
  - 支持点击卸下装备
  - 显示装备属性加成

## Task 9: 完善前端QuestPanel组件
- [x] Task 9.1: 完善 `packages/frontend/src/components/panels/QuestPanel.tsx`
  - 显示任务列表（按类型分类）
  - 显示任务详情（目标、奖励、描述）
  - 显示任务进度
  - 支持接取/放弃/完成任务

## Task 10: 数据库迁移
- [x] Task 10.1: 更新 `packages/backend/src/database/schema.sql`
  - 确认quests表结构完整
  - 添加quest_objectives表（如需要）
- [x] Task 10.2: 在 `packages/backend/src/database/initializer.ts` 中添加迁移逻辑

## Task 11: 测试与验证
- [x] Task 11.1: 测试任务系统API
  - 创建测试任务
  - 接取任务
  - 更新进度
  - 完成任务
- [x] Task 11.2: 测试装备系统API
  - 穿戴装备
  - 卸下装备
  - 检查属性加成
- [x] Task 11.3: 运行TypeScript类型检查

# Task Dependencies
- Task 2 依赖 Task 1 (类型定义)
- Task 3 依赖 Task 2 (Repository)
- Task 4 依赖 Task 3 (Service)
- Task 6 依赖 Task 5 (类型定义)
- Task 7 依赖 Task 6 (Service)
- Task 8 依赖 Task 7 (API)
- Task 9 依赖 Task 4 (API)
- Task 10 依赖 Task 1, Task 5
- Task 11 依赖所有前置任务

# Parallelizable Work
- Task 1 和 Task 5 可以并行（类型定义）
- Task 2-4 (任务系统) 和 Task 6-7 (装备系统) 可以并行
- Task 8 和 Task 9 可以并行（前端组件）
