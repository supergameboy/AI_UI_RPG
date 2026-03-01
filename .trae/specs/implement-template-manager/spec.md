# 模板管理功能 Spec

## Why

根据设计文档 3.1 故事模板系统，模板是游戏的核心配置，定义了世界观、种族、职业、背景、规则等。当前系统已有基础的模板选择功能，但缺少：
1. 主菜单的模板管理入口
2. 完整的可视化模板编辑器
3. 模板的创建、编辑、复制、删除功能

## What Changes

- 在主菜单添加「模板管理」入口按钮
- 创建独立的模板管理界面（TemplateManager）
- 创建完整的可视化模板编辑器，包含以下模块：
  - 基础信息编辑（名称、描述、版本、作者、标签）
  - 世界观构建器
  - 种族编辑器
  - 职业编辑器
  - 背景编辑器
  - 规则配置器（战斗、技能、背包、任务规则）
  - AI约束设置
  - 初始场景设计
- 实现模板的 CRUD 操作
- 内置模板只读保护（可查看、复制，不可编辑、删除）

## Impact

- Affected specs: 角色创建流程（依赖模板数据）
- Affected code:
  - `packages/frontend/src/components/menu/MainMenu.tsx` (修改)
  - `packages/frontend/src/components/template/TemplateManager.tsx` (新建)
  - `packages/frontend/src/components/template/TemplateEditor.tsx` (新建)
  - `packages/frontend/src/components/template/editors/*` (新建多个子编辑器)
  - `packages/frontend/src/stores/templateStore.ts` (修改)
  - `packages/frontend/src/services/templateService.ts` (修改)
  - `packages/frontend/src/stores/gameStore.ts` (修改，添加新屏幕)

## ADDED Requirements

### Requirement: 主菜单模板管理入口

The system SHALL provide a template management entry in the main menu.

#### Scenario: 显示模板管理按钮
- **WHEN** 用户在主菜单界面
- **THEN** 显示「模板管理」按钮，位于「设置」按钮上方

#### Scenario: 进入模板管理
- **WHEN** 用户点击「模板管理」按钮
- **THEN** 系统切换到模板管理界面

### Requirement: 模板管理界面

The system SHALL provide a template management interface for browsing and managing templates.

#### Scenario: 显示模板列表
- **WHEN** 用户进入模板管理界面
- **THEN** 显示所有模板卡片，包含名称、描述、游戏模式、标签、作者信息

#### Scenario: 区分内置和自定义模板
- **WHEN** 显示模板列表
- **THEN** 内置模板显示「内置」标记，自定义模板显示「自定义」标记

#### Scenario: 创建新模板
- **WHEN** 用户点击「新建模板」按钮
- **THEN** 进入模板编辑器，创建空白模板

#### Scenario: 编辑自定义模板
- **WHEN** 用户点击自定义模板的「编辑」按钮
- **THEN** 进入模板编辑器，加载该模板数据

#### Scenario: 查看内置模板
- **WHEN** 用户点击内置模板的「查看」按钮
- **THEN** 进入模板查看模式（只读）

#### Scenario: 复制模板
- **WHEN** 用户点击模板的「复制」按钮
- **THEN** 创建该模板的副本，自动命名为「[原模板名] 副本」

#### Scenario: 删除自定义模板
- **WHEN** 用户点击自定义模板的「删除」按钮
- **THEN** 显示确认对话框，确认后删除模板

#### Scenario: 禁止删除内置模板
- **WHEN** 用户查看内置模板
- **THEN** 不显示删除按钮

### Requirement: 模板编辑器基础信息模块

The system SHALL provide a basic information editor for templates.

#### Scenario: 编辑基础信息
- **WHEN** 用户在模板编辑器的基础信息模块
- **THEN** 可以编辑：模板名称、描述、版本号、作者、标签

#### Scenario: 选择游戏模式
- **WHEN** 用户编辑游戏模式
- **THEN** 可以从下拉菜单选择：文字冒险、回合制RPG、视觉小说、动态战斗

### Requirement: 世界观构建器

The system SHALL provide a world setting builder for templates.

#### Scenario: 编辑世界观基础信息
- **WHEN** 用户在世界观构建器中
- **THEN** 可以编辑：世界名称、世界描述、时代背景、魔法系统（可选）、科技水平

#### Scenario: 添加自定义字段
- **WHEN** 用户点击「添加自定义字段」
- **THEN** 可以添加键值对形式的自定义世界观设定

### Requirement: 种族编辑器

The system SHALL provide a race editor for templates.

#### Scenario: 显示种族列表
- **WHEN** 用户进入种族编辑器
- **THEN** 显示当前模板的所有种族定义

#### Scenario: 添加新种族
- **WHEN** 用户点击「添加种族」
- **THEN** 创建新的种族定义，包含：ID、名称、描述、属性加成/惩罚、特殊能力、可用职业

#### Scenario: 编辑种族
- **WHEN** 用户选择一个种族进行编辑
- **THEN** 可以修改种族的所有属性

#### Scenario: 删除种族
- **WHEN** 用户点击删除种族
- **THEN** 从模板中移除该种族定义

### Requirement: 职业编辑器

The system SHALL provide a class editor for templates.

#### Scenario: 显示职业列表
- **WHEN** 用户进入职业编辑器
- **THEN** 显示当前模板的所有职业定义

#### Scenario: 添加新职业
- **WHEN** 用户点击「添加职业」
- **THEN** 创建新的职业定义，包含：ID、名称、描述、主属性、生命骰、技能熟练、初始装备

#### Scenario: 编辑职业
- **WHEN** 用户选择一个职业进行编辑
- **THEN** 可以修改职业的所有属性

#### Scenario: 删除职业
- **WHEN** 用户点击删除职业
- **THEN** 从模板中移除该职业定义

### Requirement: 背景编辑器

The system SHALL provide a background editor for templates.

#### Scenario: 显示背景列表
- **WHEN** 用户进入背景编辑器
- **THEN** 显示当前模板的所有背景定义

#### Scenario: 添加新背景
- **WHEN** 用户点击「添加背景」
- **THEN** 创建新的背景定义，包含：ID、名称、描述、技能熟练、语言、装备、特性

#### Scenario: 编辑背景
- **WHEN** 用户选择一个背景进行编辑
- **THEN** 可以修改背景的所有属性

#### Scenario: 删除背景
- **WHEN** 用户点击删除背景
- **THEN** 从模板中移除该背景定义

### Requirement: 规则配置器

The system SHALL provide a rules configurator for templates.

#### Scenario: 配置战斗规则
- **WHEN** 用户在战斗规则配置中
- **THEN** 可以设置：战斗类型（回合制/实时/混合）、先攻类型、行动点数、暴击阈值和倍率

#### Scenario: 配置技能规则
- **WHEN** 用户在技能规则配置中
- **THEN** 可以设置：最大等级、升级消耗、冷却系统

#### Scenario: 配置背包规则
- **WHEN** 用户在背包规则配置中
- **THEN** 可以设置：最大槽位、堆叠大小、重量系统开关

#### Scenario: 配置任务规则
- **WHEN** 用户在任务规则配置中
- **THEN** 可以设置：最大同时任务数、失败条件、时间系统开关

### Requirement: AI约束设置

The system SHALL provide AI constraints settings for templates.

#### Scenario: 设置AI基调
- **WHEN** 用户在AI约束设置中
- **THEN** 可以选择：严肃、幽默、黑暗、浪漫、自定义

#### Scenario: 设置内容分级
- **WHEN** 用户编辑内容分级
- **THEN** 可以选择：全年龄、青少年、成人

#### Scenario: 设置禁止话题
- **WHEN** 用户编辑禁止话题
- **THEN** 可以添加/删除禁止AI生成的话题列表

#### Scenario: 设置必需元素
- **WHEN** 用户编辑必需元素
- **THEN** 可以添加/删除AI必须包含的故事元素

### Requirement: 初始场景设计

The system SHALL provide a starting scene designer for templates.

#### Scenario: 设置初始场景
- **WHEN** 用户在初始场景设计中
- **THEN** 可以设置：起始地点、场景描述、初始NPC列表、初始物品列表、初始任务列表

### Requirement: 模板保存与验证

The system SHALL validate and save templates.

#### Scenario: 保存模板
- **WHEN** 用户点击保存模板
- **THEN** 系统验证必填字段，保存到数据库

#### Scenario: 验证失败提示
- **WHEN** 模板缺少必填字段
- **THEN** 显示具体缺失字段，阻止保存

#### Scenario: 取消编辑
- **WHEN** 用户点击取消
- **THEN** 如果有未保存更改，显示确认对话框

### Requirement: 模板复制功能

The system SHALL support template duplication.

#### Scenario: 复制内置模板
- **WHEN** 用户复制内置模板
- **THEN** 创建新的自定义模板，内容与原模板相同，名称添加「副本」后缀

#### Scenario: 复制自定义模板
- **WHEN** 用户复制自定义模板
- **THEN** 创建新的自定义模板，内容与原模板相同

## MODIFIED Requirements

### Requirement: 扩展 GameScreen 类型

The GameScreen type SHALL include 'template-manager' screen.

### Requirement: 扩展 TemplateStore

The templateStore SHALL include:
- `createTemplate`: 创建新模板
- `updateTemplate`: 更新模板
- `duplicateTemplate`: 复制模板
- `deleteTemplate`: 删除模板
- `editingTemplate`: 当前编辑中的模板
- `isEditing`: 是否处于编辑模式

## REMOVED Requirements

None.
