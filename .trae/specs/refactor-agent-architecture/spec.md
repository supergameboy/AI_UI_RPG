# 智能体架构重构 Spec

## Why

当前智能体系统存在以下技术债：
1. **职责混乱**：智能体同时承担 AI 决策和数据操作，违反单一职责原则
2. **调用耦合**：智能体间调用通过硬编码的 `canCallAgents` 实现，缺乏灵活的路由机制
3. **能力不均**：部分智能体有 AI 能力但未充分利用，部分纯数据操作的智能体却继承了完整的 LLM 调用能力
4. **缺乏工具抽象**：没有独立的工具层，导致可复用的数据操作逻辑散落在各智能体中

参考 OpenClaw 的多智能体架构，我们需要将智能体拆分为 **Agent（AI 决策与内容生成）** 和 **Tool（数据操作）** 两个独立层次。

## What Changes

### 核心架构变更

1. **新增 Tool 层**
   - 创建 `ToolBase` 基类，定义纯数据操作接口
   - 将现有智能体中的数据操作逻辑提取为独立工具
   - 工具无 AI 能力，只负责数据 CRUD 和计算

2. **重构 Agent 层**
   - Agent 专注于 AI 决策和内容生成
   - Agent 通过声明式 Binding 调用 Tool 或其他 Agent
   - 每个 Agent 可配置独立的模型和参数

3. **新增 Binding 路由系统**
   - 声明式配置消息路由规则
   - 支持按消息类型、上下文条件路由
   - 支持优先级和回退机制

4. **新增 Agent Registry**
   - 统一管理 Agent 和 Tool 的注册
   - 提供依赖注入和能力查询

5. **新增 Per-Agent 上下文系统**
   - 每个 Agent 拥有独立的工作上下文
   - 上下文包含 Agent 关心的数据副本
   - 支持上下文合并和冲突检测

6. **新增 Tool 读写分离机制**
   - Tool 方法分为 read/write 两类
   - read 操作可被多个 Agent 直接调用
   - write 操作通过 CoordinatorAgent 统一调度

7. **新增决策日志系统**
   - 记录每次请求的完整决策过程
   - 支持问题回溯和调试
   - 持久化存储决策历史

### **BREAKING** 变更

- `AgentBase` 拆分为 `AgentBase` 和 `ToolBase`
- `canCallAgents` 废弃，改用 Binding 配置
- `dataAccess` 废弃，改用 Tool 依赖注入
- 消息格式调整，增加 `toolCall` 类型
- 新增 `AgentContext` 上下文对象
- Tool 方法需要标注 `@Read` 或 `@Write` 装饰器

## Impact

- Affected specs: 
  - `implement-agent-system` - 需要更新智能体基类
  - `implement-llm-adapter` - 需要支持 Per-Agent 模型配置
  - `implement-dialogue-system` - 需要拆分为 DialogueAgent + DialogueDataTool

- Affected code:
  - `packages/backend/src/agents/` - 所有智能体需要重构
  - `packages/backend/src/services/MessageQueue.ts` - 增加 Binding 路由
  - `packages/backend/src/services/AgentService.ts` - 改为 Registry 模式
  - `packages/shared/src/types/agent.ts` - 类型定义更新

---

## 智能体与工具分类

### Agent（有 AI 能力）- 11 个

| Agent | AI 职责 | 调用的 Tool |
|-------|---------|-------------|
| **CoordinatorAgent** | 意图分析、结果整合、初始化调度 | 所有 Tool |
| **DialogueAgent** | 对话生成、选项生成、情绪分析 | DialogueDataTool |
| **StoryContextAgent** | 剧情生成、上下文压缩、分支管理 | StoryDataTool |
| **CombatAgent** | 战斗 AI 决策（困难模式）、战斗叙事 | CombatDataTool, NumericalTool |
| **QuestAgent** | 任务生成、目标设计、奖励设计 | QuestDataTool |
| **InventoryAgent** | 物品生成（AI 生成属性、效果、描述） | InventoryDataTool |
| **SkillAgent** | 技能生成（AI 生成效果、消耗、描述） | SkillDataTool |
| **MapAgent** | 地图生成（AI 生成区域描述、事件、连接） | MapDataTool |
| **NPCAgent** | NPC 行为生成、对话风格、关系变化 | NPCDataTool |
| **EventAgent** | 事件生成、条件设计、触发逻辑 | EventDataTool |
| **UIAgent** | UI 指令生成、文本格式化、通知生成 | UIDataTool |

### Tool（纯数据操作）- 11 个

| Tool | 职责 | 无 AI |
|------|------|-------|
| **NumericalTool** | 属性计算、伤害公式、经验曲线、等级成长 | ✓ |
| **InventoryDataTool** | 物品 CRUD、堆叠逻辑、装备穿戴、耐久度管理 | ✓ |
| **SkillDataTool** | 技能 CRUD、冷却管理、前置检查 | ✓ |
| **MapDataTool** | 位置查询、移动验证、区域管理、连接关系 | ✓ |
| **NPCDataTool** | NPC CRUD、关系管理、队伍管理、日程调度 | ✓ |
| **QuestDataTool** | 任务 CRUD、进度追踪、前置检查、奖励发放 | ✓ |
| **EventDataTool** | 事件 CRUD、条件检查、触发记录、事件链 | ✓ |
| **DialogueDataTool** | 对话历史管理、上下文构建、情绪记录 | ✓ |
| **CombatDataTool** | 战斗状态管理、回合处理、效果结算 | ✓ |
| **StoryDataTool** | 剧情节点管理、选择记录、摘要存储 | ✓ |
| **UIDataTool** | UI 状态管理、组件缓存、指令队列 | ✓ |

---

## ADDED Requirements

### Requirement: Tool Layer Architecture

系统应提供独立的工具层，用于封装纯数据操作逻辑。

#### Scenario: Tool Registration
- **WHEN** 系统启动时
- **THEN** 所有工具自动注册到 ToolRegistry
- **AND** 工具不包含任何 LLM 调用逻辑

#### Scenario: Tool Invocation
- **WHEN** Agent 调用工具
- **THEN** 工具执行并返回纯数据结果
- **AND** 工具不能调用其他 Agent 或 Tool

#### Scenario: Tool Definition
- **GIVEN** 一个数据操作需求
- **WHEN** 创建工具
- **THEN** 工具继承 `ToolBase` 基类
- **AND** 定义明确的输入输出类型
- **AND** 实现幂等性（相同输入产生相同输出）

### Requirement: Agent AI Capability

Agent 应专注于 AI 决策和内容生成能力。

#### Scenario: Agent with AI - Content Generation
- **WHEN** Agent 需要生成内容（物品、技能、地图、对话等）
- **THEN** Agent 调用 LLM 服务生成结构化数据
- **AND** 将生成结果存储通过 Tool 完成

#### Scenario: Agent with AI - Decision Making
- **WHEN** Agent 需要做决策（战斗 AI、事件触发等）
- **THEN** Agent 调用 LLM 服务分析情况
- **AND** 返回决策结果

#### Scenario: Per-Agent Model Config
- **GIVEN** 多个 Agent 实例
- **WHEN** 配置 Agent
- **THEN** 每个 Agent 可指定不同的模型
- **AND** 可配置独立的 temperature、maxTokens 等参数

### Requirement: Binding Router System

系统应提供声明式的消息路由机制。

#### Scenario: Binding Configuration
- **GIVEN** 一个消息路由需求
- **WHEN** 配置 Binding
- **THEN** 指定匹配条件和目标 Agent/Tool
- **AND** 支持优先级排序

#### Scenario: Message Routing
- **WHEN** 收到消息
- **THEN** BindingRouter 按规则匹配
- **AND** 最具体的匹配优先
- **AND** 路由到正确的处理者

#### Scenario: Fallback Routing
- **WHEN** 没有匹配的 Binding
- **THEN** 路由到默认处理者（CoordinatorAgent）
- **AND** 记录路由日志

### Requirement: Agent Registry

系统应提供统一的 Agent 和 Tool 注册中心。

#### Scenario: Registry Initialization
- **WHEN** 系统启动
- **THEN** Registry 加载所有 Agent 和 Tool
- **AND** 验证依赖关系
- **AND** 构建调用图

#### Scenario: Capability Query
- **WHEN** 查询某个能力
- **THEN** Registry 返回可用的 Agent 或 Tool
- **AND** 包含其配置和状态

#### Scenario: Dependency Injection
- **WHEN** Agent 需要使用 Tool
- **THEN** 通过 Registry 获取 Tool 实例
- **AND** 不直接实例化

### Requirement: Game Initialization Flow

游戏初始化应由 CoordinatorAgent 统一调度，基于游戏模板进行。

#### Scenario: Template Loading
- **WHEN** 玩家选择游戏模板
- **THEN** CoordinatorAgent 加载模板数据
- **AND** 模板包含：世界观、种族、职业、背景、规则、AI约束、起始场景、UI主题
- **AND** 模板数据存储到 Global Context

#### Scenario: Character Creation
- **WHEN** 玩家创建角色
- **THEN** 前端显示模板定义的种族、职业、背景选项
- **AND** 玩家选择种族、职业、背景
- **AND** 玩家输入角色名称
- **AND** CoordinatorAgent 验证选择合法性
- **AND** NumericalTool 计算初始属性（基础值 + 种族加成）

#### Scenario: World Initialization
- **WHEN** 玩家确认角色创建
- **THEN** CoordinatorAgent 开始世界初始化
- **AND** MapAgent 根据模板起始场景生成初始地图
- **AND** NPCAgent 根据模板 NPC 定义生成初始 NPC
- **AND** InventoryAgent 根据职业初始装备生成初始物品
- **AND** QuestAgent 根据模板任务定义生成初始任务
- **AND** 各 Agent 通过 AI 扩展模板内容（如需要）

#### Scenario: New Game Start
- **WHEN** 玩家开始新游戏
- **THEN** CoordinatorAgent 接收初始化请求
- **AND** 并行调用 MapAgent、InventoryAgent、SkillAgent、NPCAgent 等
- **AND** 各 Agent 通过 AI 生成初始内容
- **AND** 各 Agent 通过 Tool 存储数据
- **AND** CoordinatorAgent 整合结果返回前端

#### Scenario: Save Game Load
- **WHEN** 玩家加载存档
- **THEN** CoordinatorAgent 读取存档数据
- **AND** 通过各 Tool 恢复游戏状态
- **AND** 不需要 AI 参与

### Requirement: Template Data Structure

游戏模板应包含完整的游戏定义。

#### Scenario: Template Definition
- **GIVEN** 一个游戏模板
- **WHEN** 加载模板
- **THEN** 模板包含以下模块：
  - **基础信息**：名称、描述、版本、作者、游戏模式
  - **世界观设定**：世界名称、描述、时代、科技、魔法系统
  - **种族定义**：名称、描述、属性加成、特殊能力、可选职业
  - **职业定义**：名称、描述、生命骰、主属性、技能熟练、初始装备
  - **背景定义**：名称、描述、技能熟练、语言、初始装备、特性
  - **属性系统**：属性ID、名称、缩写、范围
  - **规则配置**：战斗、技能、物品、任务规则
  - **AI约束**：基调、分级、响应风格、内容约束
  - **起始场景**：地点、NPC、物品、任务
  - **UI主题**：颜色、字体、背景、布局

#### Scenario: Template Validation
- **WHEN** 保存模板
- **THEN** 验证必填字段完整性
- **AND** 验证种族-职业关联一致性
- **AND** 验证属性ID引用正确性
- **AND** 验证起始场景内容完整性

### Requirement: Character Creation Integration

角色创建系统已实现，需要与新架构集成。

#### Scenario: Existing Implementation
- **GIVEN** 现有的 CharacterGenerationService
- **WHEN** 集成到新架构
- **THEN** 保留现有功能：
  - 批量生成种族/职业/背景选项
  - 属性计算（基础值 + 种族加成 + 职业加成）
  - 请求防抖机制
- **AND** 新增功能：
  - 通过 NumericalTool 计算属性
  - 通过 CoordinatorAgent 验证选择合法性
  - 角色创建结果写入 Global Context

#### Scenario: Character Creation Flow
- **WHEN** 玩家创建角色
- **THEN** 前端调用现有 API
- **AND** 后端通过 NumericalTool 计算属性
- **AND** 结果存储到 Global Context
- **AND** CoordinatorAgent 记录决策日志

### Requirement: Frontend Adaptation

前端需要适配新架构。

#### Scenario: agentStore Adaptation
- **GIVEN** 现有的 agentStore
- **WHEN** 集成新架构
- **THEN** 新增以下状态和方法：
  - `tools: ToolStatus[]` - Tool 状态列表
  - `bindings: Binding[]` - Binding 配置列表
  - `fetchTools()` - 获取 Tool 状态
  - `fetchBindings()` - 获取 Binding 配置
  - `updateBinding()` - 更新 Binding 配置
- **AND** 保留现有功能兼容

#### Scenario: gameStore Adaptation
- **GIVEN** 现有的 gameStore
- **WHEN** 集成新架构
- **THEN** 新增以下状态和方法：
  - `globalContext: GlobalContext` - 全局游戏状态
  - `decisionLogs: DecisionLog[]` - 决策日志列表
  - `fetchDecisionLogs()` - 获取决策日志
  - `tracebackProblem()` - 问题回溯
- **AND** 保留现有功能兼容

#### Scenario: New decisionLogStore
- **WHEN** 需要查看决策日志
- **THEN** 创建新的 decisionLogStore
- **AND** 支持按请求 ID 查询
- **AND** 支持按时间范围查询
- **AND** 支持问题回溯功能

#### Scenario: UI Components
- **WHEN** 需要显示新架构信息
- **THEN** 新增以下组件：
  - `ToolStatusPanel` - Tool 状态监控面板
  - `BindingConfigPanel` - Binding 配置面板
  - `DecisionLogViewer` - 决策日志查看器
  - `ContextDiffViewer` - 上下文变更对比器

### Requirement: Developer Tools Adaptation

开发者工具需要适配新架构。

#### Scenario: DeveloperPanel Tab Extension
- **GIVEN** 现有的 DeveloperPanel 组件
- **WHEN** 集成新架构
- **THEN** 新增以下 Tab：
  - `tools` - Tool 状态监控（新增）
  - `bindings` - Binding 配置管理（新增）
  - `decisions` - 决策日志查看（新增）
- **AND** 保留现有 Tab：requests, agents, logs, state, prompts, tokens

#### Scenario: AgentCommunication Adaptation
- **GIVEN** 现有的 AgentCommunication 组件
- **WHEN** 集成新架构
- **THEN** 新增消息类型支持：
  - `tool_call` - Tool 调用消息
  - `tool_response` - Tool 响应消息
  - `context_change` - 上下文变更消息
  - `conflict_detected` - 冲突检测消息
- **AND** 新增消息过滤功能
- **AND** 新增消息详情展示优化

#### Scenario: StateInspector Adaptation
- **GIVEN** 现有的 StateInspector 组件
- **WHEN** 集成新架构
- **THEN** 新增状态类型支持：
  - `GlobalContext` - 全局游戏状态
  - `AgentContext` - Agent 工作上下文
  - `ToolState` - Tool 状态
- **AND** 新增上下文对比功能
- **AND** 新增冲突高亮显示

#### Scenario: LogViewer Adaptation
- **GIVEN** 现有的 LogViewer 组件
- **WHEN** 集成新架构
- **THEN** 新增日志类型支持：
  - `decision` - 决策日志
  - `context` - 上下文变更日志
  - `conflict` - 冲突日志
- **AND** 新增日志过滤功能
- **AND** 新增日志关联跳转功能

### Requirement: Settings Modal Adaptation

游戏设置弹窗需要适配新架构。

#### Scenario: Settings Modal Extension
- **GIVEN** 现有的设置弹窗
- **WHEN** 集成新架构
- **THEN** 新增以下设置项：
  - **Agent 配置**：Per-Agent 模型选择、参数配置
  - **Binding 配置**：路由规则配置、优先级调整
  - **Tool 配置**：权限配置、调用限制
  - **决策日志配置**：日志级别、保留时间、存储位置
- **AND** 保留现有设置项

#### Scenario: LLMConfigModal Adaptation
- **GIVEN** 现有的 LLMConfigModal 组件
- **WHEN** 集成新架构
- **THEN** 新增 Per-Agent 模型配置：
  - 为每个 Agent 单独选择模型
  - 为每个 Agent 单独配置参数
  - 支持模型故障转移配置
- **AND** 保留全局默认模型配置

### Requirement: Database Adaptation

数据库需要适配新架构。

#### Scenario: New Tables
- **WHEN** 集成新架构
- **THEN** 新增以下表：
  - `decision_logs` - 决策日志表
    - id, request_id, timestamp, player_input, agents, conflicts, result, metadata
  - `agent_contexts` - Agent 上下文快照表
    - id, save_id, agent_id, context_data, timestamp
  - `tool_states` - Tool 状态表
    - id, tool_id, state_data, last_updated
  - `bindings` - Binding 配置表
    - id, agent_id, match_conditions, priority, enabled
  - `agent_configs` - Per-Agent 配置表
    - id, agent_id, model, parameters, failover_config
- **AND** 保留现有表结构

#### Scenario: GlobalContext Storage
- **WHEN** 保存游戏状态
- **THEN** GlobalContext 序列化存储到 `saves.game_state`
- **AND** 各 AgentContext 快照存储到 `agent_contexts`
- **AND** 支持从快照恢复

#### Scenario: DecisionLog Persistence
- **WHEN** 决策日志记录
- **THEN** 存储到 `decision_logs` 表
- **AND** 支持按请求 ID 查询
- **AND** 支持按时间范围查询
- **AND** 支持清理过期日志

#### Scenario: Database Migration
- **WHEN** 升级数据库
- **THEN** 执行迁移脚本创建新表
- **AND** 不影响现有数据
- **AND** 支持回滚

### Requirement: Per-Agent Context System

系统应为每个 Agent 提供独立的工作上下文。

#### Scenario: Context Creation
- **WHEN** CoordinatorAgent 分发任务
- **THEN** 为每个 Agent 创建独立的上下文副本
- **AND** 上下文包含该 Agent 关心的数据子集
- **AND** 上下文与全局状态隔离

#### Scenario: Context Isolation
- **GIVEN** 多个 Agent 并行工作
- **WHEN** Agent 修改自己的上下文
- **THEN** 不影响其他 Agent 的上下文
- **AND** 不影响全局状态

#### Scenario: Context Merge
- **WHEN** 所有 Agent 完成任务
- **THEN** CoordinatorAgent 收集所有上下文变更
- **AND** 检测冲突（同一数据被多处修改）
- **AND** 按规则解决冲突（优先级/时间戳/业务规则）
- **AND** 应用到全局状态

#### Scenario: Conflict Detection
- **GIVEN** 两个 Agent 修改了同一数据
- **WHEN** 合并上下文
- **THEN** 系统检测到冲突
- **AND** 记录冲突详情到决策日志
- **AND** 按预设规则解决冲突

### Requirement: Tool Read/Write Separation

Tool 应区分读操作和写操作。

#### Scenario: Read Operation
- **WHEN** Agent 调用 Tool 的读方法
- **THEN** 直接从全局状态读取数据
- **AND** 不修改任何状态
- **AND** 可被多个 Agent 并发调用

#### Scenario: Write Operation
- **WHEN** Agent 调用 Tool 的写方法
- **THEN** 写入 Agent 的本地上下文
- **AND** 不直接修改全局状态
- **AND** 由 CoordinatorAgent 统一提交

#### Scenario: Write Permission
- **GIVEN** 一个 Tool 写方法
- **WHEN** 配置 Tool
- **THEN** 指定允许调用该方法的 Agent 列表
- **AND** 未授权的 Agent 调用时抛出权限错误

### Requirement: Decision Log System

系统应记录所有决策过程。

#### Scenario: Log Creation
- **WHEN** 收到玩家请求
- **THEN** 创建新的决策日志条目
- **AND** 记录请求 ID、时间戳、玩家输入

#### Scenario: Log Agent Decisions
- **WHEN** Agent 做出决策
- **THEN** 记录 Agent ID、决策内容、使用的 Tool
- **AND** 记录 LLM 调用的输入输出（如有）

#### Scenario: Log Context Changes
- **WHEN** Agent 修改上下文
- **THEN** 记录变更前后的数据快照
- **AND** 记录变更原因

#### Scenario: Log Conflicts
- **WHEN** 检测到上下文冲突
- **THEN** 记录冲突详情
- **AND** 记录解决方案
- **AND** 标记为需要关注

#### Scenario: Log Persistence
- **WHEN** 请求处理完成
- **THEN** 决策日志持久化存储
- **AND** 支持按请求 ID 查询
- **AND** 支持按时间范围查询

#### Scenario: Problem Traceback
- **GIVEN** 发现游戏状态异常
- **WHEN** 查询决策日志
- **THEN** 可追溯到问题发生的请求
- **AND** 可查看完整的决策链
- **AND** 可恢复到问题前的状态

---

## MODIFIED Requirements

### Requirement: Agent Base Class

Agent 基类需要适配新架构。

#### Scenario: Agent Definition
- **WHEN** 创建新 Agent
- **THEN** 继承 `AgentBase`
- **AND** 定义 `tools` 依赖列表（替代 `dataAccess`）
- **AND** 定义 `bindings` 路由规则（替代 `canCallAgents`）

#### Scenario: Agent Lifecycle
- **WHEN** Agent 启动/停止
- **THEN** 自动注册/注销到 Registry
- **AND** 建立消息监听

### Requirement: Message Format

消息格式需要支持工具调用。

#### Scenario: Tool Call Message
- **WHEN** Agent 调用 Tool
- **THEN** 消息类型为 `tool_call`
- **AND** 包含工具名称和参数

#### Scenario: Tool Response Message
- **WHEN** Tool 返回结果
- **THEN** 消息类型为 `tool_response`
- **AND** 包含执行结果或错误

---

## REMOVED Requirements

### Requirement: canCallAgents Property

**Reason**: 改用声明式 Binding 配置，更灵活且可动态调整。

**Migration**: 
- 将 `canCallAgents` 列表转换为 `bindings` 配置
- 使用 BindingRouter 处理路由

### Requirement: dataAccess Property

**Reason**: 改用 Tool 依赖注入，更符合单一职责原则。

**Migration**:
- 将数据访问逻辑提取为独立 Tool
- 在 Agent 中声明 Tool 依赖

---

## 游戏初始化流程

```
玩家选择游戏模板
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CoordinatorAgent                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 加载模板数据                              │ │
│  │  - 世界观设定                                            │ │
│  │  - 种族/职业/背景选项                                     │ │
│  │  - 规则配置                                              │ │
│  │  - AI 约束                                               │ │
│  │  - 起始场景                                              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    角色创建界面                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  玩家选择：                                              │ │
│  │  - 种族（从模板种族列表选择）                             │ │
│  │  - 职业（从种族可选职业中选择）                           │ │
│  │  - 背景（从模板背景列表选择）                             │ │
│  │  - 角色名称                                              │ │
│  │  - 外观自定义（可选）                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                      │                                       │
│                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  预览确认：                                              │ │
│  │  - 显示计算后的属性值                                     │ │
│  │  - 显示初始技能和装备                                     │ │
│  │  - 玩家可返回修改或确认开始                               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        │ 玩家确认
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CoordinatorAgent                          │
│                    世界初始化调度                             │
│                          │                                   │
│        ┌─────────────────┼─────────────────┐                │
│        ▼                 ▼                 ▼                │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐         │
│  │ MapAgent  │     │ NPCAgent  │     │InventoryAG│         │
│  │           │     │           │     │           │         │
│  │ 生成初始   │     │ 生成初始   │     │ 生成初始   │         │
│  │ 地图区域   │     │ NPC       │     │ 物品       │         │
│  │           │     │           │     │           │         │
│  │ AI扩展：   │     │ AI扩展：   │     │ AI扩展：   │         │
│  │ - 区域描述 │     │ - NPC行为 │     │ - 物品描述 │         │
│  │ - 连接关系 │     │ - 对话风格 │     │           │         │
│  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘         │
│        │                 │                 │                │
│        └─────────────────┼─────────────────┘                │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              QuestAgent + SkillAgent                     │ │
│  │  - 生成初始任务（基于模板）                               │ │
│  │  - 生成初始技能（基于职业）                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    合并上下文 + 决策日志                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    游戏开始                                  │
│  - 显示起始场景描述                                          │
│  - 玩家可以开始交互                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Per-Agent 上下文与合并流程

```
玩家输入："攻击哥布林"
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    CoordinatorAgent                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Global Context (全局状态)                   │ │
│  │  { player, world, combat, inventory, ... }              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                    分发上下文副本                             │
│                          │                                   │
│        ┌─────────────────┼─────────────────┐                │
│        ▼                 ▼                 ▼                │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐         │
│  │CombatAgent│     │NumericalAG│     │InventoryAG│         │
│  │           │     │           │     │           │         │
│  │ Context:  │     │ Context:  │     │ Context:  │         │
│  │ - combat  │     │ - player  │     │ - items   │         │
│  │ - enemies │     │ - stats   │     │ - equip   │         │
│  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘         │
│        │                 │                 │                │
│        │    写入各自上下文（独立、无冲突）    │                │
│        │                 │                 │                │
│        └─────────────────┼─────────────────┘                │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    合并上下文                            │ │
│  │  1. 收集所有 Agent 的上下文变更                          │ │
│  │  2. 检测冲突（同一数据被多处修改）                        │ │
│  │  3. 解决冲突（优先级/时间戳/规则）                        │ │
│  │  4. 应用到 Global Context                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                    记录决策日志                               │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Decision Log                            │ │
│  │  timestamp: 2026-03-03T10:00:00                          │ │
│  │  request: "攻击哥布林"                                    │ │
│  │  agents: [combat, numerical, inventory]                  │ │
│  │  decisions: [...]                                        │ │
│  │  conflicts: []                                           │ │
│  │  result: "造成 15 点伤害，击杀哥布林，获得 10 金币"        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Tool 读写权限表

| Tool | 读方法（可被多 Agent 调用） | 写方法（通过 CoordinatorAgent 调度） |
|------|---------------------------|-------------------------------------|
| **NumericalTool** | calculateStats, calculateDamage, calculateExp | - (纯计算，无状态) |
| **InventoryDataTool** | getItem, listItems, getEquipment | createItem, updateItem, deleteItem, equipItem |
| **SkillDataTool** | getSkill, listSkills, isOnCooldown | createSkill, updateSkill, deleteSkill, startCooldown |
| **MapDataTool** | getLocation, getArea, getConnections | createArea, updateArea, addConnection |
| **NPCDataTool** | getNPC, listNPCs, getRelationship | createNPC, updateNPC, updateRelationship |
| **QuestDataTool** | getQuest, listQuests, getProgress | createQuest, updateProgress, completeQuest |
| **EventDataTool** | getEvent, listEvents, checkConditions | createEvent, recordTrigger |
| **DialogueDataTool** | getHistory, getContext | addHistory, recordEmotion |
| **CombatDataTool** | getCombatState, getCurrentTurn | initCombat, applyEffect, endCombat |
| **StoryDataTool** | getNode, getChoices, getSummary | addNode, recordChoice, saveSummary |
| **UIDataTool** | getState, getQueue | updateState, queueInstruction |

---

## 决策日志数据结构

```typescript
interface DecisionLog {
  id: string;
  timestamp: number;
  requestId: string;
  
  playerInput: string;
  
  agents: {
    agentId: AgentType;
    contextSnapshot: Record<string, unknown>;
    decisions: {
      action: string;
      reasoning?: string;
      llmCall?: {
        input: Message[];
        output: string;
        model: string;
        tokens: number;
      };
      toolCalls: {
        tool: ToolType;
        method: string;
        params: unknown;
        result: unknown;
        isWrite: boolean;
      }[];
    }[];
    contextChanges: {
      path: string;
      oldValue: unknown;
      newValue: unknown;
      reason: string;
    }[];
  }[];
  
  conflicts: {
    path: string;
    agents: AgentType[];
    values: unknown[];
    resolution: 'priority' | 'timestamp' | 'manual';
    resolvedValue: unknown;
  }[];
  
  result: {
    success: boolean;
    response: string;
    stateChanges: Record<string, unknown>;
  };
  
  metadata: {
    totalTokens: number;
    duration: number;
    version: string;
  };
}
```

---

## Binding 配置示例

```typescript
const agentBindings: AgentBinding[] = [
  // 游戏初始化
  {
    agentId: 'coordinator',
    match: { messageType: 'game_init' },
    priority: 100,
  },
  
  // 对话相关
  {
    agentId: 'dialogue',
    match: { messageType: 'dialogue_request' },
    priority: 10,
  },
  {
    agentId: 'dialogue',
    match: { messageType: 'npc_interaction' },
    priority: 8,
  },
  
  // 战斗相关
  {
    agentId: 'combat',
    match: { messageType: 'combat_action' },
    priority: 10,
  },
  {
    agentId: 'combat',
    match: { context: { inCombat: true } },
    priority: 5,
  },
  
  // 物品生成
  {
    agentId: 'inventory',
    match: { messageType: 'generate_item' },
    priority: 10,
  },
  
  // 技能生成
  {
    agentId: 'skill',
    match: { messageType: 'generate_skill' },
    priority: 10,
  },
  
  // 地图生成
  {
    agentId: 'map',
    match: { messageType: 'generate_area' },
    priority: 10,
  },
  
  // 任务相关
  {
    agentId: 'quest',
    match: { messageType: 'quest_event' },
    priority: 10,
  },
  
  // 默认回退
  {
    agentId: 'coordinator',
    match: { messageType: '*' },
    priority: 0,
  },
];
```

---

## 游戏初始化流程

```
玩家点击"新游戏"
        │
        ▼
┌─────────────────────────────┐
│     CoordinatorAgent        │
│   (初始化调度)               │
└─────────────────────────────┘
        │
        ├─────────────────────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────────┐           ┌───────────────────┐
│   MapAgent        │           │   InventoryAgent  │
│ (生成初始地图)     │           │ (生成初始物品)     │
│        ↓          │           │        ↓          │
│ MapDataTool       │           │ InventoryDataTool │
│ (存储地图数据)     │           │ (存储物品数据)     │
└───────────────────┘           └───────────────────┘
        │                                 │
        ├─────────────────────────────────┤
        │                                 │
        ▼                                 ▼
┌───────────────────┐           ┌───────────────────┐
│   SkillAgent      │           │   NPCAgent        │
│ (生成初始技能)     │           │ (生成初始NPC)      │
│        ↓          │           │        ↓          │
│ SkillDataTool     │           │ NPCDataTool       │
└───────────────────┘           └───────────────────┘
        │                                 │
        └─────────────┬───────────────────┘
                      ▼
              CoordinatorAgent
              (整合结果，返回前端)
```

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大量代码重构 | 高 | 分批次实施，每批独立测试 |
| 现有功能中断 | 高 | 保持向后兼容层，渐进迁移 |
| 性能下降 | 中 | Binding 路由使用缓存 |
| 学习成本 | 中 | 完善文档和示例 |
| AI 生成内容不可控 | 中 | 添加验证层，过滤不合理内容 |

---

## 提示词工程设计

### 设计决策总结

| 决策点 | 选择 | 说明 |
|--------|------|------|
| Tool 调用格式 | 结构化 JSON Schema | OpenAI 风格，定义统一的 ToolCall 格式 |
| 上下文注入 | 分层注入 | 默认核心上下文 + 按需请求额外上下文 |
| 决策日志集成 | 可配置 | 设置中提供三种选项，默认仅日志记录 |
| 提示词模板组织 | 模块化组合 | 公共部分统一管理，个性化部分独立设计 |
| 多 Tool 调用 | 混合模式 | 支持单次和批量两种模式 |
| 写操作处理 | Coordinator 审核 | 规则验证 + 权限检查 + 冲突检测 + 日志记录 |
| 错误处理 | 自动重试 | 可配置重试次数 |
| 输出结构 | 思考+JSON | `<thinking>` 标记包裹思考过程，纯 JSON 输出 |
| Tool 列表展示 | 简化列表 | 只列出 Tool 名称和简短描述 |
| 调用示例 | 独立文件 | 示例存储在单独文件中，按需注入 |

### Requirement: Prompt Template Architecture

提示词模板应采用模块化组合设计。

#### Scenario: Template Modules
- **GIVEN** 一个 Agent 的提示词模板
- **WHEN** 构建提示词
- **THEN** 模板包含以下模块：
  - **角色定义模块**：角色定义、职责、能力范围等基础信息
  - **Tool Schema 模块**：Tool 调用的 JSON Schema 定义和示例
  - **上下文模板模块**：上下文变量的定义和使用说明
  - **输出格式模块**：输出格式、JSON 结构、示例等

#### Scenario: Module Composition
- **WHEN** 组装提示词
- **THEN** 公共模块（如 Tool Schema 格式说明）统一管理
- **AND** 个性化模块（如角色定义）独立设计
- **AND** 通过变量注入机制组合模块

### Requirement: Tool Call Schema

Tool 调用应采用 OpenAI 风格的 JSON Schema。

#### Scenario: Tool Definition Format
- **GIVEN** 一个 Tool 方法
- **WHEN** 定义 Tool Schema
- **THEN** Schema 包含以下字段：
```json
{
  "name": "toolType.methodName",
  "description": "方法描述",
  "parameters": {
    "type": "object",
    "properties": {
      "param1": { "type": "string", "description": "参数描述" }
    },
    "required": ["param1"]
  }
}
```

#### Scenario: Tool Call Format
- **WHEN** Agent 调用 Tool
- **THEN** 输出格式为：
```json
{
  "tool_calls": [
    {
      "id": "call_xxx",
      "type": "function",
      "function": {
        "name": "inventory_data.getItem",
        "arguments": "{\"itemId\": \"sword_001\"}"
      }
    }
  ]
}
```

#### Scenario: Tool Response Format
- **WHEN** Tool 返回结果
- **THEN** 系统注入格式为：
```json
{
  "tool_call_id": "call_xxx",
  "role": "tool",
  "content": "{\"success\": true, \"data\": {...}}"
}
```

### Requirement: Context Injection System

上下文应采用分层注入机制。

#### Scenario: Core Context
- **GIVEN** Agent 开始处理请求
- **WHEN** 构建提示词
- **THEN** 默认注入核心上下文：
  - **玩家核心信息**：名称、职业、等级、位置、状态
  - **场景信息**：当前位置、可移动区域、附近 NPC
  - **最近历史**：最近 N 条对话或事件记录（可配置，默认 10 条）

#### Scenario: Context Request via Tool
- **WHEN** Agent 需要额外上下文
- **THEN** Agent 通过 Tool 调用获取：
  - `getContext.fullInventory` - 获取完整背包
  - `getContext.questDetails` - 获取任务详情
  - `getContext.npcDetails` - 获取 NPC 详情
  - `getContext.combatState` - 获取战斗状态

#### Scenario: Context Variable Format
- **WHEN** 注入上下文变量
- **THEN** 使用以下格式：
```
## 当前上下文

### 玩家信息
- 名称: {{player_name}}
- 职业: {{player_class}}
- 等级: {{player_level}}
- 当前位置: {{current_location}}

### 场景信息
- 当前区域: {{current_area}}
- 可移动区域: {{available_areas}}
- 附近NPC: {{nearby_npcs}}

### 最近历史
{{recent_history}}
```

### Requirement: Agent Output Format

Agent 输出应采用思考+JSON 的结构。

#### Scenario: Output Structure
- **WHEN** Agent 输出响应
- **THEN** 输出结构为：
```
<thinking>
这里是 Agent 的思考过程，分析当前情况，考虑可选方案，做出决策...
</thinking>

{
  "response": "对玩家的响应文本",
  "tool_calls": [...],
  "context_updates": {...}
}
```

#### Scenario: Thinking Tag
- **GIVEN** Agent 输出思考过程
- **WHEN** 解析输出
- **THEN** 使用 `<thinking>...</thinking>` 标记包裹
- **AND** 思考内容不显示给玩家
- **AND** 思考内容记录到决策日志

#### Scenario: JSON Parsing
- **GIVEN** Agent 输出 JSON
- **WHEN** 解析输出
- **THEN** 系统自动识别 JSON 块（以 `{` 开始，以 `}` 结束）
- **AND** 无需额外标记包裹
- **AND** 支持多行 JSON

### Requirement: Tool List Display

提示词中应展示简化的 Tool 列表。

#### Scenario: Simplified Tool List
- **WHEN** 构建提示词
- **THEN** Tool 列表格式为：
```
## 可用工具

### 数据查询工具
- `numerical.calculateDamage` - 计算伤害值
- `inventory_data.getItem` - 获取物品信息
- `map_data.getLocation` - 获取位置信息

### 数据修改工具（需要 Coordinator 审核）
- `inventory_data.createItem` - 创建新物品
- `quest_data.updateProgress` - 更新任务进度

详细参数说明请参考 Tool Schema 文档。
```

#### Scenario: Tool Schema On Demand
- **WHEN** Agent 需要详细 Tool Schema
- **THEN** 通过 `getContext.toolSchema` 获取
- **AND** 返回完整的 JSON Schema 定义

### Requirement: Tool Call Examples

Tool 调用示例应存储在独立文件中。

#### Scenario: Example File Structure
- **GIVEN** Tool 调用示例
- **WHEN** 组织示例文件
- **THEN** 文件结构为：
```
packages/backend/src/prompts/examples/
├── combat/
│   ├── attack.json          # 攻击示例
│   ├── defend.json          # 防御示例
│   └── skill.json           # 技能使用示例
├── dialogue/
│   ├── normal.json          # 普通对话示例
│   ├── quest.json           # 任务对话示例
│   └── trade.json           # 交易对话示例
├── inventory/
│   ├── use_item.json        # 使用物品示例
│   └── equip.json           # 装备物品示例
└── common/
    ├── single_call.json     # 单次调用示例
    └── batch_call.json      # 批量调用示例
```

#### Scenario: Example Injection
- **WHEN** 构建提示词
- **THEN** 根据 Agent 类型选择相关示例
- **AND** 通过变量 `{{tool_examples}}` 注入
- **AND** 示例数量可配置（默认 2-3 个）

### Requirement: Write Operation Review

Tool 写操作应通过 Coordinator 审核。

#### Scenario: Review Process
- **WHEN** Agent 请求写操作
- **THEN** CoordinatorAgent 执行以下检查：
  1. **规则验证**：检查写操作是否符合游戏规则和逻辑
  2. **权限检查**：检查 Agent 是否有权限执行该写操作
  3. **冲突检测**：检查写操作是否与当前游戏状态冲突
  4. **日志记录**：记录写操作的详细信息用于回滚和审计

#### Scenario: Review Result
- **WHEN** 审核完成
- **THEN** 返回审核结果：
```json
{
  "approved": true/false,
  "reason": "审核原因",
  "modifications": {...}  // 可选的修改建议
}
```

### Requirement: Error Handling and Retry

Tool 调用失败应自动重试。

#### Scenario: Retry Configuration
- **GIVEN** Tool 调用配置
- **WHEN** 配置重试策略
- **THEN** 支持以下配置项：
  - `maxRetries`: 最大重试次数（默认 3）
  - `retryDelay`: 重试延迟（默认 1000ms）
  - `exponentialBackoff`: 是否指数退避（默认 true）

#### Scenario: Retry Process
- **WHEN** Tool 调用失败
- **THEN** 系统自动重试
- **AND** 将错误信息注入上下文
- **AND** Agent 可根据错误调整策略

#### Scenario: Retry Exhausted
- **WHEN** 重试次数耗尽
- **THEN** 返回错误给 CoordinatorAgent
- **AND** 记录详细错误日志
- **AND** 可选择降级处理或返回错误给玩家

### Requirement: Decision Logging Integration

决策日志应与提示词集成，提供可配置选项。

#### Scenario: Logging Options
- **GIVEN** 决策日志配置
- **WHEN** 配置日志级别
- **THEN** 提供以下选项：
  - **仅日志记录**（默认）：系统自动记录上下文和调用链
  - **可选解释**：关键决策要求 Agent 解释决策理由
  - **强制解释**：Agent 必须在输出中解释决策理由

#### Scenario: Logging Format
- **WHEN** 记录决策日志
- **THEN** 包含以下信息：
  - Agent ID 和类型
  - 输入上下文快照
  - 思考过程（如有）
  - Tool 调用记录
  - 输出结果
  - 上下文变更

### 提示词模板示例

#### CoordinatorAgent 模板

```markdown
# 角色定义

你是AI-RPG游戏的核心统筹智能体，负责协调所有其他智能体的工作。

# 核心职责

1. 意图分析：准确理解玩家输入的真实意图
2. 任务分配：将复杂任务拆分并分配给合适的智能体
3. 冲突解决：检测并解决智能体输出之间的逻辑冲突
4. 结果整合：将多个智能体的输出合并为连贯的响应
5. 写操作审核：审核其他 Agent 的写操作请求

# 可用工具

{{tool_list}}

# 审核规则

当收到写操作审核请求时，检查：
1. 规则验证：操作是否符合游戏规则
2. 权限检查：Agent 是否有执行权限
3. 冲突检测：是否与当前状态冲突
4. 日志记录：记录审核详情

# 当前上下文

## 玩家信息
- 名称: {{player_name}}
- 职业: {{player_class}}
- 等级: {{player_level}}
- 当前位置: {{current_location}}

## 场景信息
- 当前区域: {{current_area}}
- 可移动区域: {{available_areas}}
- 附近NPC: {{nearby_npcs}}

## 最近历史
{{recent_history}}

# 输出格式

<thinking>
分析玩家意图，考虑可选方案，做出决策...
</thinking>

{
  "intent": "识别的意图",
  "agents_to_call": ["智能体列表"],
  "tool_calls": [...],  // 可选的 Tool 调用
  "response": "对玩家的响应",
  "priority": "优先级"
}
```

#### DialogueAgent 模板

```markdown
# 角色定义

你是对话管理智能体，负责生成自然流畅的NPC对话。

# 核心职责

1. 对话生成：根据NPC性格、关系、情境生成对话内容
2. 对话选项生成：提供有意义的玩家选择
3. 情绪表达：在对话中体现NPC的情绪变化

# 可用工具

{{tool_list}}

# NPC性格要素

- personality: 性格特点
- dialogue_style: 对话风格
- traits: 特殊特质列表
- mood: 当前心情

# 好感度影响

- -100 ~ -50: 敌对
- -50 ~ 0: 冷淡
- 0 ~ 30: 中立
- 30 ~ 60: 友好
- 60 ~ 80: 亲密
- 80 ~ 100: 恋爱

# 当前上下文

## 玩家信息
- 名称: {{player_name}}
- 当前位置: {{current_location}}

## 对话对象
{{dialogue_target}}

## 最近对话历史
{{recent_history}}

# 输出格式

<thinking>
分析对话情境，考虑NPC性格和关系，设计对话内容...
</thinking>

{
  "content": "对话内容",
  "emotion": "情绪状态",
  "options": [
    {"text": "选项文本", "type": "选项类型"}
  ]
}
```

### Tool Schema 示例

```json
{
  "tools": [
    {
      "name": "inventory_data.getItem",
      "description": "获取物品详细信息",
      "parameters": {
        "type": "object",
        "properties": {
          "itemId": {
            "type": "string",
            "description": "物品ID"
          }
        },
        "required": ["itemId"]
      }
    },
    {
      "name": "inventory_data.createItem",
      "description": "创建新物品（需要 Coordinator 审核）",
      "parameters": {
        "type": "object",
        "properties": {
          "name": {"type": "string", "description": "物品名称"},
          "type": {"type": "string", "description": "物品类型"},
          "rarity": {"type": "string", "description": "稀有度"},
          "attributes": {"type": "object", "description": "物品属性"}
        },
        "required": ["name", "type"]
      }
    }
  ]
}
```

### Tool 调用示例

#### 单次调用示例
```json
{
  "tool_calls": [
    {
      "id": "call_001",
      "type": "function",
      "function": {
        "name": "inventory_data.getItem",
        "arguments": "{\"itemId\": \"sword_001\"}"
      }
    }
  ]
}
```

#### 批量调用示例
```json
{
  "tool_calls": [
    {
      "id": "call_001",
      "type": "function",
      "function": {
        "name": "numerical.calculateDamage",
        "arguments": "{\"attackerId\": \"player\", \"defenderId\": \"goblin_001\"}"
      }
    },
    {
      "id": "call_002",
      "type": "function",
      "function": {
        "name": "combat_data.getCombatState",
        "arguments": "{}"
      }
    }
  ]
}
```
