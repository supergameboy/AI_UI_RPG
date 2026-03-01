# 游戏模板功能完善 Spec

## Why
当前游戏模板实现与设计文档存在多处差异，缺少 `uiTheme`、`uiLayout`、`aiBehavior` 详细配置、`specialRules`、`numericalComplexity` 等关键功能，导致模板配置不完整，影响游戏体验和 AI 行为控制。

## What Changes
- 扩展 `AIConstraints` 类型，添加 `aiBehavior` 详细配置（responseStyle、detailLevel、playerAgency）
- 新增 `UITheme` 类型和 `uiTheme` 字段，支持主题定制
- 新增 `UILayout` 类型和 `uiLayout` 字段，支持界面布局配置
- 新增 `SpecialRules` 类型和 `specialRules` 字段，支持特殊游戏规则
- 新增 `NumericalComplexity` 类型和 `numericalComplexity` 字段，支持数值复杂度配置
- 更新前端编辑器组件，支持新增字段的编辑
- 更新 AI 生成服务，利用新增配置优化生成效果

## Impact
- Affected specs: 故事模板系统、AI行为控制、UI主题系统
- Affected code: 
  - `packages/shared/src/types/template.ts`
  - `packages/frontend/src/components/template/editors/RulesEditor.tsx`
  - `packages/frontend/src/components/template/editors/AIConstraintsEditor.tsx`
  - `packages/backend/src/services/AIGenerateService.ts`

## ADDED Requirements

### Requirement: AI行为详细配置
系统 SHALL 提供详细的 AI 行为配置选项，包括：
- `responseStyle`: 响应风格（narrative/mechanical/adaptive）
- `detailLevel`: 描述详细程度（brief/normal/detailed）
- `playerAgency`: 玩家自由度（guided/balanced/freeform）

#### Scenario: 配置AI响应风格
- **WHEN** 用户在 AI 约束编辑器中选择"叙事风格"
- **THEN** AI 生成内容时将采用更文学化的描述方式

#### Scenario: 配置描述详细程度
- **WHEN** 用户选择"详细"级别
- **THEN** AI 生成的场景、NPC、物品描述将更加详尽

### Requirement: UI主题配置
系统 SHALL 提供 UI 主题配置功能，包括：
- `primaryColor`: 主色调
- `fontFamily`: 字体
- `backgroundStyle`: 背景样式
- `customCSS`: 自定义CSS（可选）

#### Scenario: 自定义主题颜色
- **WHEN** 用户设置主色调为"#4a90d9"
- **THEN** 游戏界面主按钮、标题等元素将使用该颜色

### Requirement: UI布局配置
系统 SHALL 提供 UI 布局配置功能，包括：
- `showMinimap`: 是否显示小地图
- `showCombatPanel`: 是否显示战斗面板
- `showSkillBar`: 是否显示技能栏
- `showPartyPanel`: 是否显示队伍面板
- `customLayout`: 自定义布局（可选）

#### Scenario: 叙事模式隐藏战斗面板
- **WHEN** 用户选择叙事型战斗模式
- **THEN** 默认隐藏战斗面板和技能栏

### Requirement: 特殊游戏规则
系统 SHALL 提供特殊游戏规则配置，包括：
- `hasKP`: 是否有KP/GM角色
- `permadeath`: 是否永久死亡
- `saveRestriction`: 存档限制
- `customRules`: 自定义规则列表

#### Scenario: 启用KP模式
- **WHEN** 用户启用 KP 模式
- **THEN** AI 将扮演 KP 角色，引导玩家进行游戏

#### Scenario: 永久死亡模式
- **WHEN** 用户启用永久死亡
- **THEN** 角色死亡后无法复活，需要重新创建角色

### Requirement: 数值复杂度配置
系统 SHALL 提供数值系统复杂度配置：
- `simple`: 简单（少量属性，快速计算）
- `medium`: 中等（标准属性，适度计算）
- `complex`: 复杂（详细属性，深度计算）

#### Scenario: 简单数值模式
- **WHEN** 用户选择简单复杂度
- **THEN** 角色属性简化，战斗计算快速

## MODIFIED Requirements

### Requirement: StoryTemplate 类型定义
StoryTemplate 接口 SHALL 包含以下新增字段：
```typescript
interface StoryTemplate {
  // ... 现有字段 ...
  uiTheme: UITheme;
  uiLayout: UILayout;
  numericalComplexity: NumericalComplexity;
  specialRules: SpecialRules;
}

interface AIConstraints {
  // ... 现有字段 ...
  aiBehavior: AIBehavior;
}
```

## REMOVED Requirements
无移除的需求。
