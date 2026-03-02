# 集成装备面板和任务面板 Spec

## Why
装备面板（EquipmentPanel）和任务面板（QuestPanel）组件已经实现完成，但 PanelContainer.tsx 没有导入和使用它们，导致用户看到的是占位符文本而不是实际的面板内容。

## What Changes
- 在 PanelContainer.tsx 中导入 EquipmentPanel 和 QuestPanel 组件
- 替换 equipment 和 quests case 中的占位符为实际组件
- 组件目前使用模拟数据，后续可连接后端API

## Impact
- Affected specs: 无
- Affected code: `packages/frontend/src/components/layout/PanelContainer.tsx`

## ADDED Requirements

### Requirement: 装备面板集成
系统应当在用户点击"装备"按钮时显示 EquipmentPanel 组件，而不是占位符文本。

#### Scenario: 用户查看装备面板
- **WHEN** 用户点击侧边栏的"装备"按钮
- **THEN** 系统显示 EquipmentPanel 组件，包含装备槽位、已装备物品和属性加成

### Requirement: 任务面板集成
系统应当在用户点击"任务"按钮时显示 QuestPanel 组件，而不是占位符文本。

#### Scenario: 用户查看任务面板
- **WHEN** 用户点击侧边栏的"任务"按钮
- **THEN** 系统显示 QuestPanel 组件，包含任务列表、筛选器和任务详情

## MODIFIED Requirements
无

## REMOVED Requirements
无
