# 游戏初始化流程重构规范

## Why

当前游戏初始化流程存在多个严重问题：
1. 现代都市恋爱模板出现"新手村"、"与村长对话"等与模板无关的默认信息
2. 初始化服务使用硬编码的默认值，未正确使用模板配置
3. 初始化数据未正确同步到前端状态管理
4. NPC面板、记录面板、地图面板仅为占位符
5. 存在重复的初始场景生成（初始化服务 + dialogueRoutes）

## What Changes

- **修复初始化服务**：正确使用模板的 `startingScene`、`initialQuests`、`initialNPCs` 配置
- **修复默认模板**：移除硬编码的"新手村"相关内容，改为从模板配置读取
- **实现数据同步**：确保初始化数据正确同步到前端状态管理
- **实现缺失面板**：完成 NPC 面板、记录面板、地图面板的实际功能
- **消除重复场景生成**：统一场景生成逻辑

## Impact

- Affected specs: 游戏初始化系统、面板组件系统
- Affected code:
  - `packages/backend/src/services/InitializationService.ts`
  - `packages/backend/src/routes/initializationRoutes.ts`
  - `packages/frontend/src/components/layout/PanelContainer.tsx`
  - `packages/frontend/src/components/panels/NPCPanel.tsx` (新建)
  - `packages/frontend/src/components/panels/JournalPanel.tsx` (新建)
  - `packages/frontend/src/components/panels/MapPanel.tsx` (新建)
  - `packages/frontend/src/stores/gameStore.ts`

## ADDED Requirements

### Requirement: 模板数据正确传递

系统应当正确使用模板配置中的初始化数据，而非硬编码默认值。

#### Scenario: 现代都市恋爱模板初始化
- **WHEN** 用户使用"现代都市恋爱"模板创建角色
- **THEN** 初始化任务应为"新的开始"（点咖啡、与人交谈）
- **AND** 初始NPC应为林小樱、苏雨晴、陈晓阳
- **AND** 初始地点应为"星城市 - 樱花咖啡馆"
- **AND** 不应出现"新手村"、"村长"等奇幻模板内容

#### Scenario: 中世纪奇幻模板初始化
- **WHEN** 用户使用"中世纪奇幻冒险"模板创建角色
- **THEN** 初始化任务应为"消失的村民"
- **AND** 初始NPC应为托马斯村长、加雷斯、玛莎大妈
- **AND** 初始地点应为"橡木村 - 村口广场"

### Requirement: 初始化数据同步到前端

系统应当将初始化服务生成的数据正确同步到前端状态管理。

#### Scenario: 技能初始化同步
- **WHEN** 初始化服务完成技能初始化
- **THEN** 前端 `gameStore.skills` 应包含正确的技能数据

#### Scenario: 背包初始化同步
- **WHEN** 初始化服务完成背包初始化
- **THEN** 前端 `gameStore.inventory` 应包含正确的物品数据

#### Scenario: 任务初始化同步
- **WHEN** 初始化服务完成任务初始化
- **THEN** 前端 `gameStore.quests` 应包含正确的任务数据

### Requirement: NPC面板功能实现

系统应当提供完整的NPC面板功能。

#### Scenario: 显示NPC列表
- **WHEN** 用户打开NPC面板
- **THEN** 应显示已遇到的NPC列表
- **AND** 每个NPC应显示名称、角色、好感度（如适用）
- **AND** 点击NPC应显示详细信息

### Requirement: 记录面板功能实现

系统应当提供完整的记录面板功能。

#### Scenario: 显示故事记录
- **WHEN** 用户打开记录面板
- **THEN** 应显示对话历史和重要事件
- **AND** 支持按时间或类型筛选

### Requirement: 地图面板功能实现

系统应当提供完整的地图面板功能。

#### Scenario: 显示世界地图
- **WHEN** 用户打开地图面板
- **THEN** 应显示世界地图和已探索区域
- **AND** 应标记当前位置
- **AND** 支持地点导航

## MODIFIED Requirements

### Requirement: 初始化服务步骤执行

初始化服务应当正确使用模板配置，而非硬编码默认值。

**修改前**：
```typescript
const startingLocation = template.startingLocation || {
  name: template.startingScene?.location || '新手村',
  description: template.startingScene?.description || '一个宁静的小村庄...',
};
```

**修改后**：
```typescript
const startingLocation = {
  name: template.startingScene?.location || template.worldSetting?.name || '未知地点',
  description: template.startingScene?.description || '',
};
```

### Requirement: 初始化路由默认模板

移除硬编码的"新手村"相关内容。

**修改前**：`createDefaultTemplate()` 包含硬编码的"新手村"、"村长"等内容

**修改后**：`createDefaultTemplate()` 使用通用配置，不包含特定世界观内容

## REMOVED Requirements

### Requirement: 重复的初始场景生成

**Reason**：初始化服务和 dialogueRoutes 都会生成初始场景，造成重复

**Migration**：统一由 dialogueRoutes 的 `/api/dialogue/initial` 端点生成初始场景，初始化服务不再生成场景描述

## Technical Details

### 问题根因分析

1. **初始化服务默认值问题**：
   - `executeSceneStep` 使用 `template.startingLocation` 或回退到"新手村"
   - `initialQuests` 和 `initialNPCs` 在默认模板中定义了"新手村"内容
   - 模板的 `startingScene` 字段未被正确使用

2. **数据同步缺失**：
   - 初始化服务生成数据后，未将数据写入前端可访问的状态
   - 前端面板组件使用 `useGameStore`，但数据未正确填充

3. **面板实现不完整**：
   - NPC、记录、地图面板仅为占位符
   - 缺少实际的数据获取和渲染逻辑

### 解决方案架构

```
┌─────────────────────────────────────────────────────────────┐
│                      初始化流程                              │
├─────────────────────────────────────────────────────────────┤
│  1. 前端调用 POST /api/initialization/start                  │
│     ↓                                                        │
│  2. 初始化服务读取模板配置                                    │
│     - startingScene → 场景数据                               │
│     - initialQuests → 任务数据                               │
│     - initialNPCs → NPC数据                                  │
│     - initialData → 技能/物品/装备数据                       │
│     ↓                                                        │
│  3. 初始化服务执行各步骤                                      │
│     - 数值初始化                                             │
│     - 技能初始化                                             │
│     - 背包初始化                                             │
│     - 装备初始化                                             │
│     - 任务初始化 (使用模板的 initialQuests)                   │
│     - 地图初始化                                             │
│     - NPC初始化 (使用模板的 initialNPCs)                      │
│     ↓                                                        │
│  4. 返回初始化结果给前端                                      │
│     ↓                                                        │
│  5. 前端更新 gameStore                                       │
│     - setCharacter()                                         │
│     - setSkills()                                            │
│     - setInventory()                                         │
│     - setQuests()                                            │
│     - setNPCs()                                              │
│     ↓                                                        │
│  6. 调用 POST /api/dialogue/initial 生成开场叙事              │
│     (使用模板的 startingScene)                                │
└─────────────────────────────────────────────────────────────┘
```
