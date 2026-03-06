# 智能体架构重构 Checklist

## Phase 1: 基础架构验证

### 批次 1.1：核心类型定义

- [x] ToolType 枚举包含所有 11 个 Tool 类型
- [x] ToolBase 接口定义完整（id, name, description, version）
- [x] ToolResponse 接口包含 success, data, error, metadata 字段
- [x] Binding 接口包含 agentId, match, priority, enabled 字段
- [x] BindingMatch 支持 messageType, context, custom 条件
- [x] ToolCallMessage 和 ToolResponseMessage 类型定义正确
- [x] AgentType 枚举包含所有 11 个 Agent 类型
- [x] 类型检查通过：`pnpm -r run typecheck`

### 批次 1.2：工具层基础设施

- [x] ToolBase.ts 文件存在于 `packages/backend/src/tools/`
- [x] ToolBase 是抽象类，包含抽象属性 type, description, version
- [x] ToolBase 包含 registerMethods() 抽象方法
- [x] ToolBase 包含 executeMethod() 抽象方法
- [x] ToolBase 包含 execute() 公共方法
- [x] ToolBase 包含 getReadMethods() 和 getWriteMethods() 方法
- [x] ToolBase 包含 initialize() 和 dispose() 生命周期方法
- [x] ToolRegistry.ts 文件存在于 `packages/backend/src/tools/`
- [x] ToolRegistry 支持注册、查询、列出工具
- [x] ToolRegistry 支持批量初始化和销毁
- [x] ToolRegistry 包含状态监控功能

### 批次 1.3：Binding 路由系统

- [x] BindingRouter.ts 文件存在于 `packages/backend/src/routing/`
- [x] BindingRouter 支持按消息类型路由
- [x] BindingRouter 支持按上下文条件路由
- [x] BindingRouter 支持优先级排序
- [x] BindingRouter 支持回退机制（默认 CoordinatorAgent）
- [x] BindingRouter 包含路由缓存优化
- [x] BindingConfigService.ts 文件存在于 `packages/backend/src/services/`
- [x] BindingConfigService 支持默认配置加载
- [x] BindingConfigService 支持配置验证
- [x] BindingConfigService 支持配置导入导出

### 批次 1.4：上下文系统

- [x] ContextManager.ts 文件存在于 `packages/backend/src/context/`
- [x] AgentContextManager 支持独立上下文创建
- [x] AgentContextManager 支持上下文快照
- [x] AgentContextManager 支持变更追踪
- [x] ContextManager 支持全局状态管理
- [x] ContextManager 支持上下文分发和收集
- [x] ContextManager 支持冲突检测
- [x] ContextManager 支持冲突解决（优先级/时间戳/规则）
- [x] ContextManager 支持状态提交

### 批次 1.5：决策日志系统

- [x] DecisionLogService.ts 文件存在于 `packages/backend/src/services/`
- [x] DecisionLogService 支持日志创建
- [x] DecisionLogService 支持决策记录
- [x] DecisionLogService 支持上下文变更记录
- [x] DecisionLogService 支持冲突记录
- [x] DecisionLogService 支持日志持久化
- [x] DecisionLogService 支持日志查询
- [x] DecisionLogService 支持问题回溯

### 批次 1.6：Tool 读写分离

- [x] ToolPermissions.ts 文件存在于 `packages/backend/src/tools/`
- [x] checkPermission() 函数正确判断读写权限
- [x] toolMethod() 装饰器正确拦截权限检查
- [x] readOnly() 和 writeOnly() 装饰器可用
- [x] ToolPermissionManager 支持权限授予和撤销

### 批次 1.7：数据库迁移

- [x] DatabaseMigration.ts 文件存在于 `packages/backend/src/services/`
- [x] decision_logs 表创建正确
- [x] bindings 表创建正确
- [x] agent_contexts 表创建正确
- [x] context_snapshots 表创建正确
- [x] tool_calls 表创建正确
- [x] schema_version 表创建正确
- [x] DatabaseService 集成 MigrationRunner
- [x] 数据库迁移自动执行
- [x] 迁移状态可查询

---

## Phase 2: Tool 层验证

### NumericalTool

- [x] NumericalTool.ts 文件存在于 `packages/backend/src/tools/implementations/`
- [x] 继承 ToolBase 基类
- [x] 实现 registerMethods() 方法
- [x] 实现 executeMethod() 方法
- [x] 读方法：getCharacter, calculateDamage, calculateHealing 等
- [x] 写方法：registerCharacter, modifyAttribute, applyDamage 等
- [x] 正确调用 NumericalService
- [x] 写操作记录日志

### InventoryDataTool

- [x] InventoryDataTool.ts 文件存在
- [x] 读方法：getItem, listItems, getEquipment 等
- [x] 写方法：createItem, updateItem, equipItem 等

### SkillDataTool

- [x] SkillDataTool.ts 文件存在
- [x] 读方法：getSkill, listSkills, isOnCooldown 等
- [x] 写方法：createSkill, startCooldown 等

### MapDataTool

- [x] MapDataTool.ts 文件存在
- [x] 读方法：getLocation, getArea, getConnections 等
- [x] 写方法：createArea, addConnection 等

### NPCDataTool

- [x] NPCDataTool.ts 文件存在
- [x] 读方法：getNPC, listNPCs, getRelationship 等
- [x] 写方法：createNPC, updateRelationship 等

### QuestDataTool

- [x] QuestDataTool.ts 文件存在
- [x] 读方法：getQuest, listQuests, getProgress 等
- [x] 写方法：createQuest, updateProgress, completeQuest 等

### EventDataTool

- [x] EventDataTool.ts 文件存在
- [x] 读方法：getEvent, listEvents, checkConditions 等
- [x] 写方法：createEvent, updateEvent, triggerEvent 等

### DialogueDataTool

- [x] DialogueDataTool.ts 文件存在
- [x] 读方法：getHistory, getContext 等
- [x] 写方法：addHistory, recordEmotion 等

### CombatDataTool

- [x] CombatDataTool.ts 文件存在
- [x] 读方法：getCombatState, getCurrentTurn 等
- [x] 写方法：initCombat, applyEffect, endCombat 等

### StoryDataTool

- [x] StoryDataTool.ts 文件存在
- [x] 读方法：getNode, getChoices, getSummary 等
- [x] 写方法：addNode, recordChoice, saveSummary 等

### UIDataTool

- [x] UIDataTool.ts 文件存在
- [x] 读方法：getState, getQueue 等
- [x] 写方法：updateState, queueInstruction 等

---

## Phase 1.9: 新增服务验证

### EventService

- [x] EventService.ts 文件存在于 `packages/backend/src/services/`
- [x] GameEvent 类型定义完整（id, saveId, type, name, description, trigger, effects, chain, metadata, status）
- [x] EventTriggerRecord 类型定义完整
- [x] EventCondition 类型定义完整
- [x] EventEffect 类型定义完整
- [x] 事件 CRUD 方法实现（createEvent, getEvent, listEvents, updateEvent, deleteEvent）
- [x] 条件检查方法实现（checkConditions, checkLocationTriggers, checkConditionTriggers）
- [x] 触发管理方法实现（triggerEvent, recordTrigger, getTriggerHistory）
- [x] 事件链方法实现（getNextEvent, getChainProgress）
- [x] 存读档支持实现（serializeState, deserializeState）
- [x] 随机事件方法实现（rollRandomEvent）
- [x] 数据库迁移脚本执行（events 表、event_trigger_history 表）
- [ ] 单元测试通过

### StoryService

- [x] StoryService.ts 文件存在于 `packages/backend/src/services/`
- [x] StoryNode 类型定义完整（id, saveId, title, description, type, content, choices, parentId, metadata, status）
- [x] StoryChoice 类型定义完整
- [x] StorySummary 类型定义完整
- [x] PlotPoint 类型定义完整
- [x] 节点管理方法实现（createNode, getNode, updateNode, deleteNode, getActiveNodes）
- [x] 分支管理方法实现（getBranch, mergeBranches, getCurrentBranch）
- [x] 选择记录方法实现（recordChoice, getChoices, undoChoice）
- [x] 摘要管理方法实现（generateSummary, saveSummary, getSummary）
- [x] 剧情点方法实现（addPlotPoint, getPlotPoints）
- [x] 存读档支持实现（serializeState, deserializeState）
- [x] 导航方法实现（getCurrentNode, navigateToNode, getStoryPath）
- [x] 数据库迁移脚本执行（story_nodes 表、story_summaries 表、plot_points 表）
- [x] LLM 服务集成用于摘要生成
- [ ] 单元测试通过

### UIService

- [x] UIService.ts 文件存在于 `packages/backend/src/services/`
- [x] UIState 类型定义完整（id, characterId, panels, dialogs, inputs, notifications, quickBar, minimap, lastUpdated）
- [x] UIInstruction 类型定义完整
- [x] NotificationItem 类型定义完整
- [x] QuickBarSlot 类型定义完整
- [x] 状态管理方法实现（getState, updateState, resetState）
- [x] 面板管理方法实现（openPanel, closePanel, togglePanel, setPanelTab）
- [x] 指令队列方法实现（queueInstruction, getQueue, clearQueue, processNextInstruction）
- [x] 通知管理方法实现（showNotification, dismissNotification, clearNotifications, getNotifications, markAsRead）
- [x] 对话框管理方法实现（showDialog, hideDialog, bringToFront）
- [x] 组件缓存方法实现（getComponent, cacheComponent, invalidateComponent, clearCache）
- [x] 快捷栏管理方法实现（setQuickBarSlot, clearQuickBarSlot, useQuickBarSlot）
- [x] 存读档支持实现（serializeState, deserializeState）
- [x] 订阅机制实现（subscribe, notifySubscribers）
- [x] 数据库迁移脚本执行（ui_states 表、ui_instructions 表）
- [ ] 单元测试通过

---

## Phase 3: Agent 基类重构验证

### AgentBase 重构

- [x] AgentBase.ts 移除 canCallAgents 属性
- [x] AgentBase.ts 移除 dataAccess 属性
- [x] AgentBase.ts 添加 tools 抽象属性
- [x] AgentBase.ts 添加 bindings 抽象属性
- [x] AgentBase.ts 实现 getTool 方法
- [x] AgentBase.ts 实现 callTool 方法
- [x] AgentBase.ts 实现 callAgent 方法
- [x] AgentBase.ts 构造函数接收 ToolRegistry 依赖

### AgentRegistry

- [x] AgentRegistry.ts 文件存在
- [x] Agent 注册方法实现（registerAgent）
- [x] Agent 查询方法实现（getAgent, getAgentByType）
- [x] Agent 列表方法实现（listAgents）
- [x] Agent 状态监控方法实现（getAgentStatus）
- [x] Tool 整合方法实现（getTool, listTools）
- [x] 依赖注入方法实现（injectDependencies）

### MessageQueue 更新

- [x] tool_call 消息类型支持
- [x] tool_response 消息类型支持
- [x] MessageRouter 支持 Binding 匹配
- [x] Tool 调用日志追踪

---

## Phase 4: Agent 层重构验证

### 所有 Agent 更新

- [x] UIAgent tools 和 bindings 属性已添加
- [x] InventoryAgent tools 和 bindings 属性已添加
- [x] SkillAgent tools 和 bindings 属性已添加
- [x] MapAgent tools 和 bindings 属性已添加
- [x] NPCAgent tools 和 bindings 属性已添加
- [x] QuestAgent tools 和 bindings 属性已添加
- [x] EventAgent tools 和 bindings 属性已添加
- [x] DialogueAgent tools 和 bindings 属性已添加
- [x] CombatAgent tools 和 bindings 属性已添加
- [x] StoryContextAgent tools 和 bindings 属性已添加
- [x] CoordinatorAgent tools 和 bindings 属性已添加
- [x] NumericalAgent tools 和 bindings 属性已添加

### 类型检查

- [x] packages/shared 类型检查通过
- [x] packages/backend 类型检查通过

---

## Phase 5.0: 提示词工程验证

### 提示词模块系统

- [x] `packages/backend/src/prompts/modules/` 目录存在
- [x] 角色定义模块模板存在
- [x] Tool Schema 模块模板存在
- [x] 上下文模板模块存在
- [x] 输出格式模块模板存在
- [x] 模块支持变量注入

### Tool Schema 生成器

- [x] ToolSchemaGenerator.ts 文件存在
- [x] OpenAI 风格 Schema 生成正确
- [x] Tool 方法元数据提取正确
- [x] Schema 缓存机制工作正常
- [x] Schema 按需获取 API 可用

### 上下文注入服务

- [x] ContextInjectionService.ts 文件存在
- [x] 核心上下文构建正确（玩家信息、场景信息、最近历史）
- [x] 分层注入逻辑正确
- [x] 上下文请求 Tool 可用
- [x] 历史记录截断可配置

### Agent 输出解析器

- [x] AgentOutputParser.ts 文件存在
- [x] `<thinking>` 标记解析正确
- [x] JSON 自动识别和解析正确
- [x] Tool 调用提取正确
- [x] 解析错误处理完善

### Tool 调用执行器

- [x] ToolCallExecutor.ts 文件存在
- [x] 单次调用执行正确
- [x] 批量并行调用执行正确
- [x] 自动重试机制可配置
- [x] 指数退避延迟实现
- [x] 调用结果注入上下文正确

### 写操作审核服务

- [x] WriteOperationReviewService.ts 文件存在
- [x] 规则验证检查实现
- [x] 权限检查实现
- [x] 冲突检测实现
- [x] 审核日志记录实现
- [x] 审核结果返回格式正确

### Tool 调用示例文件

- [x] `packages/backend/src/prompts/examples/` 目录存在
- [x] combat/ 示例文件存在
- [x] dialogue/ 示例文件存在
- [x] inventory/ 示例文件存在
- [x] common/ 示例文件存在（单次/批量调用）

### PromptService 更新

- [x] 模块组合功能实现
- [x] Tool Schema 注入实现
- [x] 示例注入实现
- [x] 决策日志配置选项实现
- [x] 现有模板更新为新格式

### Agent 提示词模板更新

- [x] coordinator.md 已更新添加 Tool 调用支持
- [x] dialogue.md 已更新添加 Tool 调用支持
- [x] combat.md 已更新添加 Tool 调用支持
- [x] inventory.md 已更新添加 Tool 调用支持
- [x] skill.md 已更新添加 Tool 调用支持
- [x] map.md 已更新添加 Tool 调用支持
- [x] quest.md 已更新添加 Tool 调用支持
- [x] npc_party.md 已更新添加 Tool 调用支持
- [x] event.md 已更新添加 Tool 调用支持
- [x] ui.md 已更新添加 Tool 调用支持
- [x] story_context.md 已更新添加 Tool 调用支持
- [x] numerical.md 已更新添加 Tool 调用支持
- [x] 所有模板包含 `{{tool_list}}` 占位符
- [x] 所有模板包含 `{{tool_examples}}` 占位符
- [x] 所有模板包含 `<thinking>` 思考标记说明

---

## Phase 5.1: 后端 API 验证

### Binding 配置 API

- [x] GET /api/bindings - 获取所有 Binding 配置
- [x] GET /api/bindings/:agentId - 获取特定 Agent 的 Binding 配置
- [x] POST /api/bindings - 创建新 Binding 配置
- [x] PUT /api/bindings/:bindingId - 更新 Binding 配置
- [x] DELETE /api/bindings/:bindingId - 删除 Binding 配置

### Tool 状态 API

- [x] GET /api/tools - 获取所有 Tool 状态
- [x] GET /api/tools/:toolType - 获取特定 Tool 状态
- [x] GET /api/tools/:toolType/methods - 获取 Tool 方法列表
- [x] GET /api/tools/:toolType/schema - 获取 Tool Schema

### Agent 能力 API

- [x] GET /api/agents - 获取所有 Agent 状态
- [x] GET /api/agents/:agentType/tools - 获取 Agent 依赖的 Tool 列表
- [x] GET /api/agents/:agentType/bindings - 获取 Agent 的 Binding 配置
- [x] GET /api/agents/:agentType/capabilities - 获取 Agent 能力描述

### 游戏初始化 API

- [x] POST /api/game/initialize - 初始化新游戏

---

## Phase 5.2: 前端集成验证

### agentStore 更新

- [x] tools 状态已添加
- [x] bindings 状态已添加
- [x] fetchTools() 方法已实现
- [x] fetchBindings() 方法已实现
- [x] updateBinding() 方法已实现

### gameStore 更新

- [x] globalContext 状态已添加
- [x] decisionLogs 状态已添加
- [x] fetchDecisionLogs() 方法已实现
- [x] tracebackProblem() 方法已实现

### decisionLogStore

- [x] decisionLogStore.ts 文件存在
- [x] 按请求 ID 查询已实现
- [x] 按时间范围查询已实现
- [x] 问题回溯功能已实现

### 前端服务层

- [x] toolService.ts 文件存在
- [x] bindingService.ts 文件存在
- [x] decisionLogService.ts 文件存在
- [x] contextService.ts 文件存在

---

## Phase 5.3: 前端 UI 组件验证

### ToolStatusPanel

- [x] ToolStatusPanel 组件文件存在
- [x] 显示所有 Tool 状态列表
- [x] 显示 Tool 调用统计
- [x] 支持刷新和过滤

### BindingConfigPanel

- [x] BindingConfigPanel 组件文件存在
- [x] 显示所有 Binding 配置
- [x] 支持添加/编辑/删除 Binding
- [x] 支持优先级调整

### DecisionLogViewer

- [x] DecisionLogViewer 组件文件存在
- [x] 显示决策日志列表
- [x] 显示单个决策详情
- [x] 支持搜索和过滤

### ContextDiffViewer

- [x] ContextDiffViewer 组件文件存在
- [x] 显示上下文变更前后对比
- [x] 高亮显示差异
- [x] 支持冲突显示

### 类型检查

- [x] packages/frontend 类型检查通过

---

## Phase 5.4: 开发者工具适配验证

### DeveloperPanel 适配

- [x] tools Tab 已添加
- [x] bindings Tab 已添加
- [x] decisions Tab 已添加

### AgentCommunication 适配

- [x] tool_call 消息类型支持
- [x] tool_response 消息类型支持
- [x] context_change 消息类型支持
- [x] conflict_detected 消息类型支持
- [x] 消息过滤功能
- [x] 消息详情优化

### StateInspector 适配

- [x] GlobalContext 状态类型支持
- [x] AgentContext 状态类型支持
- [x] ToolState 状态类型支持
- [x] 上下文对比功能
- [x] 冲突高亮显示

### LogViewer 适配

- [x] decision 日志类型支持
- [x] context 日志类型支持
- [x] conflict 日志类型支持
- [x] 日志过滤功能
- [x] 日志关联跳转功能

### 类型检查

- [x] packages/shared 类型检查通过
- [x] packages/frontend 类型检查通过

### Tool 调用格式

- [ ] Tool Schema 采用 OpenAI 风格
- [ ] Tool Definition Format 包含 name, description, parameters
- [ ] Tool Call Format 包含 id, type, function
- [ ] Tool Response Format 包含 tool_call_id, role, content

### 上下文注入

- [ ] 默认注入玩家核心信息
- [ ] 默认注入场景信息
- [ ] 默认注入最近历史（可配置条数）
- [ ] Agent 可通过 Tool 获取额外上下文

### 输出格式

- [ ] Agent 输出使用 `<thinking>` 标记包裹思考过程
- [ ] JSON 输出无需额外标记
- [ ] 系统自动识别 JSON 块
- [ ] 思考内容记录到决策日志

### Tool 列表展示

- [ ] 提示词中展示简化 Tool 列表
- [ ] 区分数据查询工具和数据修改工具
- [ ] 详细 Schema 可按需获取

### 写操作审核

- [ ] CoordinatorAgent 审核写操作
- [ ] 规则验证检查执行
- [ ] 权限检查执行
- [ ] 冲突检测执行
- [ ] 日志记录执行

### 错误处理

- [ ] Tool 调用失败自动重试
- [ ] 重试次数可配置
- [ ] 重试延迟可配置
- [ ] 指数退避支持
- [ ] 错误信息注入上下文

### 决策日志集成

- [ ] 三种日志级别选项可用
- [ ] 默认为"仅日志记录"
- [ ] 日志包含 Agent ID 和类型
- [ ] 日志包含输入上下文快照
- [ ] 日志包含思考过程（如有）
- [ ] 日志包含 Tool 调用记录

---

## Phase 5.5: 设置弹窗适配验证

### Settings 组件适配

- [x] Agent 配置面板已添加
- [x] Binding 配置面板已添加
- [x] Tool 配置面板已添加
- [x] 决策日志配置面板已添加

### LLMConfigModal 组件适配

- [x] Per-Agent 模型选择已添加
- [x] Per-Agent 参数配置已添加
- [x] 模型故障转移配置已添加
- [x] 全局默认模型配置保留

### 类型检查

- [x] packages/frontend 类型检查通过

---

## Phase 5.6: 文档更新验证

### 架构文档

- [x] agent-architecture.md 已更新
- [x] Tool 层说明已添加
- [x] Binding 配置说明已添加
- [x] 迁移指南已添加
- [x] 架构图已添加

### 开发文档

- [x] development.md 已更新
- [x] 工具开发指南已添加
- [x] Agent 开发指南已添加
- [x] 示例代码已添加

---

## 最终验证

### 类型检查

- [x] `packages/shared` 类型检查通过
- [x] `packages/backend` 类型检查通过
- [x] `packages/frontend` 类型检查通过
- [x] 无 TypeScript 错误

### 角色创建系统集成

- [x] CharacterGenerationService 已更新
- [x] 属性计算集成 NumericalTool
- [x] 决策日志记录已添加
- [x] 全局上下文写入已添加
- [x] 写操作审核已添加

### 构建测试

- [x] `packages/shared` 构建成功
- [x] `packages/backend` 构建成功

### 功能测试

- [x] ToolRegistry 正确注册所有 Tool (11个)
- [x] BindingRouter 正确路由消息 (10个Binding)
- [x] ContextManager 正确管理上下文
- [x] DecisionLogService 正确记录日志
- [x] 数据库迁移正确执行
