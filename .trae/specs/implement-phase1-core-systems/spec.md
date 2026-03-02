# Phase 1 基础系统实现 Spec

## Why
根据 todo.md 中的开发计划，Phase 1 包含三个无依赖的基础系统（数值系统、背包系统、技能系统），它们是后续装备系统和游戏初始化的前置依赖。这三个系统可以并行开发，完成后将为角色创建后的初始化流程提供核心支持。

## What Changes
- 实现数值系统（Numerical System）：属性计算引擎、派生属性、等级成长、伤害公式
- 实现背包系统（Inventory System）：物品数据模型、背包存储、物品操作
- 实现技能系统（Skill System）：技能数据模型、技能学习、技能冷却、技能效果
- 创建相应的后端服务和 API 路由
- 完善前端面板组件

## Impact
- Affected specs: 角色创建系统（需要集成）、装备系统（依赖背包+数值）、游戏初始化流程
- Affected code:
  - `packages/backend/src/agents/NumericalAgent.ts`
  - `packages/backend/src/agents/InventoryAgent.ts`
  - `packages/backend/src/agents/SkillAgent.ts`
  - `packages/backend/src/services/` (新增服务)
  - `packages/backend/src/routes/` (新增路由)
  - `packages/frontend/src/components/panels/` (面板组件)
  - `packages/shared/src/types/` (共享类型)

## ADDED Requirements

### Requirement: 数值系统 (Numerical System)

#### Scenario: 属性计算
- **WHEN** 角色创建完成或装备变更
- **THEN** 系统应计算基础属性 + 种族加成 + 职业加成 + 装备加成

#### Scenario: 派生属性计算
- **WHEN** 基础属性确定
- **THEN** 系统应计算 HP/MP/攻击/防御/速度/暴击等派生属性

#### Scenario: 等级成长
- **WHEN** 角色获得经验值并升级
- **THEN** 系统应更新属性、发放升级奖励

#### Scenario: 伤害计算
- **WHEN** 战斗中发生攻击
- **THEN** 系统应根据伤害公式计算物理/魔法伤害

### Requirement: 背包系统 (Inventory System)

#### Scenario: 物品获取
- **WHEN** 玩家获得物品
- **THEN** 系统应将物品添加到背包，处理堆叠逻辑

#### Scenario: 物品使用
- **WHEN** 玩家使用消耗品
- **THEN** 系统应消耗物品、应用效果、更新数量

#### Scenario: 物品丢弃
- **WHEN** 玩家丢弃物品
- **THEN** 系统应从背包移除物品

#### Scenario: 背包容量
- **WHEN** 背包已满
- **THEN** 系统应阻止添加新物品并提示

### Requirement: 技能系统 (Skill System)

#### Scenario: 技能学习
- **WHEN** 角色满足学习条件并消耗技能点
- **THEN** 系统应添加技能到角色技能列表

#### Scenario: 技能冷却
- **WHEN** 使用主动技能
- **THEN** 系统应进入冷却状态，冷却结束后可用

#### Scenario: 技能效果
- **WHEN** 技能生效
- **THEN** 系统应计算效果数值、应用状态变化

## MODIFIED Requirements
无修改需求

## REMOVED Requirements
无移除需求
