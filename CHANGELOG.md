# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - 2026-03-05

### Added

#### Tool Layer Architecture
- **ToolBase**: Base class for all tools with unified interface
- **ToolRegistry**: Central registry for tool management
- **11 Tool Implementations**:
  - InventoryDataTool: Inventory data management
  - SkillDataTool: Skill data management
  - MapDataTool: Map data management
  - QuestDataTool: Quest data management
  - NPCPartyDataTool: NPC and party management
  - EventDataTool: Event management
  - StoryDataTool: Story data management
  - UIDataTool: UI instruction management
  - DialogueDataTool: Dialogue data management
  - CombatDataTool: Combat data management
  - NumericalTool: Numerical calculations

#### Core Services
- **AgentRegistry**: Agent registration and management
- **ToolSchemaGenerator**: Automatic Tool schema generation
- **ContextInjectionService**: Intelligent context injection
- **AgentOutputParser**: Agent output parser
- **ToolCallExecutor**: Tool call executor
- **WriteOperationReviewService**: Write operation review service
- **EventService**: Event management service
- **StoryService**: Story management service
- **UIService**: UI instruction service
- **DecisionLogService**: Decision logging service

#### Binding Router System
- **BindingRouter**: Declarative routing system
- **10 Default Bindings**: Pre-configured routing rules
- Support for message type matching
- Support for context condition matching
- Priority-based routing

#### Frontend Components
- **ToolStatusPanel**: Tool status monitoring panel
- **BindingConfigPanel**: Binding configuration panel
- **DecisionLogViewer**: Decision log viewer
- **ContextDiffViewer**: Context diff viewer

#### Developer Tools
- **DeveloperPanel**: New tabs (tools, bindings, decisions)
- **AgentCommunication**: New message types (tool_call, tool_response, context_change, conflict_detected)
- **StateInspector**: New state types (GlobalContext, AgentContext, ToolState)
- **LogViewer**: New log types (decision, context, conflict)

#### Settings
- **Settings.tsx**: New configuration panels (Agent, Binding, Tool, Decision Log)
- **LLMConfigModal.tsx**: Per-Agent model selection, parameter configuration, failover configuration

#### API Routes
- `/api/bindings`: Binding configuration management
- `/api/tools`: Tool status query
- `/api/game`: Game initialization

### Changed

#### Agent Refactoring
- All 12 agents refactored to focus on AI decision-making
- Agents now use Tool layer for data operations
- Improved separation of concerns

#### Type Definitions
- Added `ToolType` enum
- Added `Binding` interface
- Added `ToolResult` type
- Added `ToolCallContext` type
- Updated `AgentType` enum
- Updated message types for WebSocket

### Fixed

- Tool initialization on server startup
- Type definitions for frontend components

### Technical Details

- **TypeScript**: All code passes strict type checking
- **Build**: All packages build successfully
- **Tests**: Functional tests pass for all components

---

## [0.9.0] - 2026-03-03

### Added

- Combat system (turn-based combat, AI decision, combat UI)
- Developer tools enhancement (Token billing, detailed logs)
- NPC system (NPC data, relationship system, interaction)
- Dialogue system (initial scene generation, player input, quick options)

### Changed

- Improved agent communication
- Enhanced context management

---

## [0.8.0] - 2026-03-02

### Added

- World system (world/region/location hierarchy, movement, exploration)
- Map system API routes
- NPC system foundation

---

## [0.7.0] - 2026-03-01

### Added

- Equipment system (slot management, equip/unequip, attribute bonuses)
- Quest system (quest tracking, reward distribution, quest chains)
- Frontend panels (CharacterPanel, InventoryPanel, SkillsPanel, EquipmentPanel, QuestPanel)

---

## [0.6.0] - 2026-02-28

### Added

- Numerical system (attribute calculation, derived attributes, damage formulas)
- Inventory system (item management, stacking, usage, trading)
- Skill system (skill learning, upgrading, cooldown, effects)

---

## [0.5.0] - 2026-02-25

### Added

- Project foundation (Monorepo + pnpm workspace)
- SQLite database (sql.js)
- LLM adapter system (DeepSeek/GLM/Kimi/OpenAI)
- Frontend UI framework (React 18 + Zustand + CSS Modules)
- Save system
- Context management (four-layer compression)
- Agent system (12 agent frameworks)
- Settings system
- Developer tools system
- Prompt engineering system
- Story template system (4 preset templates)
- Character creation system

---

*Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)*
