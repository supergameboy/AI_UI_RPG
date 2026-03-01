# 模板编辑器增强功能 Spec

## Why
当前模板编辑器缺少预览测试功能、属性编辑器和 AI 辅助生成扩展，导致用户无法实时预览模板效果、无法自定义属性系统、以及需要手动填写大量内容。

## What Changes
- 新增预览测试功能，支持实时预览模板效果
- 新增属性编辑器，支持自定义角色属性系统
- 扩展 AI 生成功能到种族、职业、背景编辑器
- 新增世界观 AI 生成功能

## Impact
- Affected specs: 故事模板系统、AI生成服务
- Affected code: 
  - `packages/shared/src/types/template.ts`
  - `packages/frontend/src/components/template/TemplateEditor.tsx`
  - `packages/frontend/src/components/template/editors/RaceEditor.tsx`
  - `packages/frontend/src/components/template/editors/ClassEditor.tsx`
  - `packages/frontend/src/components/template/editors/BackgroundEditor.tsx`
  - `packages/frontend/src/components/template/editors/WorldSettingEditor.tsx`
  - `packages/backend/src/services/AIGenerateService.ts`
  - `packages/backend/src/routes/templateRoutes.ts`

## ADDED Requirements

### Requirement: 预览测试功能
系统 SHALL 提供模板预览测试功能，允许用户在不保存模板的情况下预览效果。

#### Scenario: 预览角色创建流程
- **WHEN** 用户点击"预览测试"按钮
- **THEN** 系统显示角色创建预览界面，展示种族、职业、背景选项

#### Scenario: 预览初始场景
- **WHEN** 用户在预览界面查看初始场景
- **THEN** 系统显示初始场景的地点、描述、NPC、物品、任务信息

### Requirement: 属性编辑器
系统 SHALL 提供属性编辑器，支持自定义角色属性系统。

#### Scenario: 添加自定义属性
- **WHEN** 用户在属性编辑器中添加新属性"魅力"
- **THEN** 系统保存属性定义，包含名称、缩写、描述、默认值、最小值、最大值

#### Scenario: 删除属性
- **WHEN** 用户删除某个属性
- **THEN** 系统从属性列表中移除该属性

### Requirement: 种族 AI 生成
系统 SHALL 支持根据世界观自动生成种族选项。

#### Scenario: 自动生成种族
- **WHEN** 用户点击"AI 生成种族"按钮
- **THEN** AI 根据世界观背景生成 1-3 个种族选项，包含名称、描述、属性加成、特殊能力

### Requirement: 职业 AI 生成
系统 SHALL 支持根据种族和世界观自动生成职业选项。

#### Scenario: 自动生成职业
- **WHEN** 用户点击"AI 生成职业"按钮
- **THEN** AI 根据世界观和已有种族生成 1-3 个职业选项，包含名称、描述、主属性、技能

### Requirement: 背景 AI 生成
系统 SHALL 支持根据种族和职业自动生成背景选项。

#### Scenario: 自动生成背景
- **WHEN** 用户点击"AI 生成背景"按钮
- **THEN** AI 根据世界观、种族、职业生成 1-3 个背景选项，包含名称、描述、技能熟练度、初始装备

### Requirement: 世界观 AI 生成
系统 SHALL 支持根据模板基础信息自动生成世界观设定。

#### Scenario: 自动生成世界观
- **WHEN** 用户点击"AI 生成世界观"按钮
- **THEN** AI 根据模板名称和描述生成完整的世界观设定，包含世界名称、描述、时代、魔法系统、科技水平

## MODIFIED Requirements

### Requirement: CharacterCreationRules 类型
CharacterCreationRules 接口 SHALL 包含 `attributes` 字段用于存储属性定义。

### Requirement: AIGenerateService
AIGenerateService SHALL 新增以下方法：
- `generateRace()` - 生成种族
- `generateClass()` - 生成职业
- `generateBackground()` - 生成背景
- `generateWorldSetting()` - 生成世界观

## REMOVED Requirements
无移除的需求。
