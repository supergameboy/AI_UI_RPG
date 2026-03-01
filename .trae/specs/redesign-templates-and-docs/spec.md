# 游戏模板重设计与文档更新 Spec

## Why
当前预设模板需要根据新增的功能（AI行为配置、UI主题、UI布局、特殊规则、数值复杂度、属性系统）进行完善，同时需要创建用户友好的功能使用说明书，帮助用户理解和使用模板编辑器。

## What Changes
- 重新设计 4 个预设模板，充分利用新增功能
- 创建游戏模板功能使用说明书文档
- 更新 `project_design.md` 中的模板系统文档

## Impact
- Affected specs: 故事模板系统
- Affected code: 
  - `packages/backend/src/services/TemplateService.ts`
  - `docs/project_design.md`
  - `docs/template_guide.md` (新建)

## ADDED Requirements

### Requirement: 预设模板完善
预设模板 SHALL 包含完整的配置，展示所有新功能：

#### Scenario: 中世纪奇幻冒险模板
- **WHEN** 用户选择中世纪奇幻冒险模板
- **THEN** 模板包含完整的种族、职业、背景、属性、AI行为配置、UI主题、特殊规则

#### Scenario: 现代都市恋爱模板
- **WHEN** 用户选择现代都市恋爱模板
- **THEN** 模板配置适合视觉小说风格（叙事型战斗、详细描述、引导式体验）

#### Scenario: 克苏鲁恐怖调查模板
- **WHEN** 用户选择克苏鲁恐怖调查模板
- **THEN** 模板启用 KP 模式、永久死亡、SAN 值系统等特殊规则

#### Scenario: 赛博朋克佣兵模板
- **WHEN** 用户选择赛博朋克佣兵模板
- **THEN** 模板包含义体系统、黑客战斗等特色配置

### Requirement: 功能使用说明书
系统 SHALL 提供完整的模板编辑器使用说明书：

#### Scenario: 新用户查阅说明书
- **WHEN** 新用户打开功能使用说明书
- **THEN** 用户可以了解每个编辑器模块的功能和使用方法

### Requirement: 设计文档更新
`project_design.md` SHALL 更新以反映当前实现的功能：

#### Scenario: 开发者查阅设计文档
- **WHEN** 开发者查阅设计文档
- **THEN** 文档准确描述当前模板系统的所有功能

## MODIFIED Requirements

### Requirement: 预设模板数据结构
预设模板 SHALL 包含以下完整字段：
- `characterCreation.attributes` - 属性定义
- `aiConstraints.aiBehavior` - AI 行为配置
- `uiTheme` - UI 主题配置
- `uiLayout` - UI 布局配置
- `numericalComplexity` - 数值复杂度
- `specialRules` - 特殊规则

## REMOVED Requirements
无移除的需求。
