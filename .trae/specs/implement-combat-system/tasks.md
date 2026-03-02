# Tasks

## Task 1: 定义共享战斗类型
- [x] SubTask 1.1: 创建 `packages/shared/src/types/combat.ts`
  - 从 CombatAgent.ts 提取类型定义
  - CombatState 枚举
  - ActionType 枚举
  - CombatDifficulty 枚举
  - CombatUnit 接口
  - CombatAction 接口
  - CombatTurn 接口
  - CombatResult 接口
  - CombatInstance 接口
  - CombatInitParams 接口
- [x] SubTask 1.2: 在 `packages/shared/src/types/index.ts` 中导出战斗类型

## Task 2: 实现后端战斗服务
- [x] SubTask 2.1: 创建 `packages/backend/src/services/CombatService.ts`
  - 封装 CombatAgent 调用
  - initiateCombat 方法
  - startCombat 方法
  - executePlayerAction 方法
  - executeAITurn 方法
  - getCombatState 方法
  - endCombat 方法
  - endTurn 方法
  - 与 NumericalService/SkillService/InventoryService 集成
- [x] SubTask 2.2: 创建 `packages/backend/src/routes/combatRoutes.ts`
  - POST /api/combat/initiate
  - POST /api/combat/start
  - POST /api/combat/action
  - POST /api/combat/ai-turn
  - POST /api/combat/end-turn
  - POST /api/combat/end
  - GET /api/combat/:combatId
  - GET /api/combat/player/:playerId
- [x] SubTask 2.3: 在后端 index.ts 中注册路由

## Task 3: 实现前端战斗服务
- [x] SubTask 3.1: 创建 `packages/frontend/src/services/combatService.ts`
  - initiateCombat 方法
  - startCombat 方法
  - executeAction 方法
  - executeAITurn 方法
  - getCombatState 方法
  - endCombat 方法

## Task 4: 实现前端战斗UI组件
- [x] SubTask 4.1: 创建 `packages/frontend/src/components/combat/CombatUnitCard.tsx`
  - 显示单位名称、等级
  - HP/MP 进度条
  - 状态效果图标
  - 当前回合高亮
  - 死亡状态显示
- [x] SubTask 4.2: 创建 `packages/frontend/src/components/combat/ActionMenu.tsx`
  - 攻击按钮
  - 技能按钮（展开技能列表）
  - 物品按钮（展开物品列表）
  - 防御按钮
  - 逃跑按钮
  - 目标选择模式
- [x] SubTask 4.3: 创建 `packages/frontend/src/components/combat/CombatLog.tsx`
  - 滚动消息列表
  - 不同类型消息样式（伤害/治疗/系统）
  - 自动滚动到最新
- [x] SubTask 4.4: 创建 `packages/frontend/src/components/combat/TurnOrder.tsx`
  - 显示回合顺序
  - 当前回合指示
- [x] SubTask 4.5: 创建 `packages/frontend/src/components/combat/CombatPanel.tsx`
  - 整合所有战斗组件
  - 敌人区域（上方）
  - 玩家区域（下方）
  - 回合顺序条
  - 行动菜单
  - 战斗日志

## Task 5: 集成战斗状态管理
- [x] SubTask 5.1: 修改 `gameStore.ts` 添加战斗状态
  - combatState 状态
  - combatUnits 状态
  - combatLog 状态
  - currentTurn 状态
  - isPlayerTurn 计算属性
- [x] SubTask 5.2: 添加战斗 actions
  - initiateCombat action
  - executeAction action
  - endCombat action
  - addCombatLog action

## Task 6: 战斗触发集成
- [x] SubTask 6.1: 在对话系统中添加战斗触发
  - 检测对话中的战斗指令
  - 调用 initiateCombat
- [x] SubTask 6.2: 创建战斗结果处理
  - 显示战斗结果弹窗
  - 发放奖励
  - 更新角色状态

## Task 7: 类型检查与测试
- [x] SubTask 7.1: 运行前端类型检查
- [x] SubTask 7.2: 运行后端类型检查
- [x] SubTask 7.3: 测试完整战斗流程

# Task Dependencies

- Task 2 依赖 Task 1（需要类型定义）
- Task 3 依赖 Task 1（需要类型定义）
- Task 4 依赖 Task 3（需要服务层）
- Task 5 依赖 Task 3 和 Task 4
- Task 6 依赖 Task 5
- Task 7 依赖所有前置任务
