# 战斗系统 (Combat System) Spec

## Why

战斗系统是RPG游戏的核心玩法之一。CombatAgent 已经实现了核心战斗逻辑，但缺少服务层、API路由和前端UI。需要完成这些部分才能让玩家实际体验战斗。

## What Changes

- 将 CombatAgent 中的类型定义移至 shared 包
- 创建 CombatService 服务层
- 创建 combatRoutes API 路由
- 创建前端战斗UI组件（CombatPanel、CombatUnitCard、ActionMenu等）
- 集成战斗系统到游戏流程

## Impact

- Affected specs: 数值系统、技能系统、背包系统、NPC系统
- Affected code:
  - `packages/shared/src/types/combat.ts` (新建)
  - `packages/backend/src/services/CombatService.ts` (新建)
  - `packages/backend/src/routes/combatRoutes.ts` (新建)
  - `packages/frontend/src/components/combat/CombatPanel.tsx` (新建)
  - `packages/frontend/src/components/combat/CombatUnitCard.tsx` (新建)
  - `packages/frontend/src/components/combat/ActionMenu.tsx` (新建)
  - `packages/frontend/src/components/combat/CombatLog.tsx` (新建)
  - `packages/frontend/src/stores/gameStore.ts` (修改)

## ADDED Requirements

### Requirement: 共享战斗类型

系统 SHALL 在 shared 包中定义所有战斗相关类型：

- CombatState（战斗状态枚举）
- ActionType（行动类型枚举）
- CombatUnit（战斗单位）
- CombatAction（战斗行动）
- CombatResult（战斗结果）
- CombatInstance（战斗实例）

### Requirement: 战斗服务层

系统 SHALL 提供 CombatService 封装 CombatAgent 功能：

- initiateCombat：初始化战斗
- startCombat：开始战斗
- executeAction：执行玩家行动
- executeAITurn：执行AI回合
- getCombatState：获取战斗状态
- endCombat：结束战斗

### Requirement: 战斗API路由

系统 SHALL 提供以下API端点：

- POST /api/combat/initiate - 初始化战斗
- POST /api/combat/start - 开始战斗
- POST /api/combat/action - 执行行动
- POST /api/combat/ai-turn - 执行AI回合
- POST /api/combat/end - 结束战斗
- GET /api/combat/:combatId - 获取战斗状态
- GET /api/combat/player/:playerId - 获取玩家当前战斗

### Requirement: 战斗UI组件

系统 SHALL 提供以下UI组件：

#### CombatPanel（战斗主面板）
- 显示所有战斗单位
- 显示回合顺序
- 显示当前回合信息
- 显示战斗日志

#### CombatUnitCard（战斗单位卡片）
- 显示单位名称、头像
- 显示HP/MP条
- 显示状态效果图标
- 高亮当前行动单位

#### ActionMenu（行动菜单）
- 攻击按钮
- 技能按钮（展开技能列表）
- 物品按钮（展开物品列表）
- 防御按钮
- 逃跑按钮

#### CombatLog（战斗日志）
- 滚动显示战斗消息
- 不同类型消息不同样式

### Requirement: 战斗流程集成

系统 SHALL 支持以下战斗触发方式：

- 对话中触发战斗（NPC敌对或任务相关）
- 探索时遭遇敌人
- 主动攻击NPC

#### Scenario: 正常战斗流程

- **WHEN** 玩家触发战斗
- **THEN** 系统初始化战斗实例
- **AND** 显示战斗UI
- **AND** 按速度决定回合顺序
- **AND** 玩家和AI交替行动
- **AND** 战斗结束后显示结果

#### Scenario: 玩家回合

- **WHEN** 轮到玩家行动
- **THEN** 显示行动菜单
- **AND** 玩家选择行动类型
- **AND** 选择目标（如需要）
- **AND** 执行行动并显示结果

#### Scenario: AI回合

- **WHEN** 轮到敌人行动
- **THEN** 系统自动执行AI决策
- **AND** 显示AI行动动画
- **AND** 显示行动结果

### Requirement: 战斗奖励

系统 SHALL 在战斗胜利后发放奖励：

- 经验值（基于敌人等级）
- 金币（基于敌人等级）
- 物品掉落（随机）
- 技能点（大量经验时）

## MODIFIED Requirements

### Requirement: gameStore 状态管理

修改 gameStore 添加战斗状态：

- combatState: 当前战斗状态
- combatUnits: 战斗单位列表
- combatLog: 战斗日志
- currentTurn: 当前回合信息

## REMOVED Requirements

无
