# 故事模板系统 Spec

## Why

故事模板是角色创建流程的前置依赖。模板定义了游戏的世界观、种族、职业、背景等核心规则，玩家在创建角色时需要基于选定的模板进行选择。当前系统已有数据库表和类型定义，但缺少完整的服务层和前端界面。

## What Changes

- 创建后端 TemplateRepository 和 TemplateService
- 创建模板 API 路由
- 创建前端 templateService 和 templateStore
- 创建模板选择界面组件
- 初始化 4 个预设模板（中世纪奇幻、现代都市恋爱、克苏鲁恐怖、赛博朋克佣兵）

## Impact

- Affected specs: 角色创建流程（依赖此功能）
- Affected code:
  - `packages/backend/src/models/TemplateRepository.ts` (新建)
  - `packages/backend/src/services/TemplateService.ts` (新建)
  - `packages/backend/src/routes/templateRoutes.ts` (新建)
  - `packages/backend/src/index.ts` (修改)
  - `packages/frontend/src/services/templateService.ts` (新建)
  - `packages/frontend/src/stores/templateStore.ts` (新建)
  - `packages/frontend/src/components/template/TemplateSelect.tsx` (新建)

## ADDED Requirements

### Requirement: Template Repository

The system SHALL provide a TemplateRepository for database operations.

#### Scenario: Create template
- **WHEN** the system creates a new template
- **THEN** the template is stored in the database with all fields

#### Scenario: Get template by ID
- **WHEN** the system requests a template by ID
- **THEN** the template data is returned from the database

#### Scenario: List templates
- **WHEN** the system requests a list of templates
- **THEN** all templates are returned with pagination support

### Requirement: Template Service

The system SHALL provide a TemplateService for business logic.

#### Scenario: Get template with parsed JSON fields
- **WHEN** the service retrieves a template
- **THEN** JSON fields (worldSetting, characterCreation, etc.) are parsed into objects

#### Scenario: Create template with validation
- **WHEN** creating a template
- **THEN** required fields are validated before saving

### Requirement: Template API Routes

The system SHALL provide REST API endpoints for template operations.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/templates` | GET | 获取模板列表 |
| `/api/templates/:id` | GET | 获取单个模板详情 |
| `/api/templates` | POST | 创建新模板 |
| `/api/templates/:id` | PUT | 更新模板 |
| `/api/templates/:id` | DELETE | 删除模板 |

### Requirement: Frontend Template Service

The system SHALL provide a frontend service for template API calls.

#### Scenario: Fetch templates
- **WHEN** the frontend requests templates
- **THEN** the API response is properly typed and returned

### Requirement: Template Selection UI

The system SHALL provide a template selection interface for starting new games.

#### Scenario: Display template list
- **WHEN** user starts a new game
- **THEN** available templates are displayed with name, description, and game mode

#### Scenario: Select template
- **WHEN** user selects a template
- **THEN** the template is stored in game state and user proceeds to character creation

### Requirement: Preset Templates

The system SHALL include 4 preset templates on first launch.

| Template | Game Mode | Description |
|----------|-----------|-------------|
| 中世纪奇幻冒险 | turn_based_rpg | 种族：人类/精灵/矮人/兽人/龙裔，职业：战士/法师/盗贼/牧师/游侠 |
| 现代都市恋爱 | visual_novel | 职业：学生/上班族/自由职业者，好感度系统 |
| 克苏鲁恐怖调查 | text_adventure | 职业：侦探/记者/医生/学者，SAN值系统 |
| 赛博朋克佣兵 | dynamic_combat | 种族：自然人/改造人/仿生人，职业：黑客/佣兵/医生/商人 |

## MODIFIED Requirements

### Requirement: Backend Index Route

The backend index.ts SHALL include template routes.

## REMOVED Requirements

None.
