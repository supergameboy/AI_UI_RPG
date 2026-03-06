# Tasks

## Phase 1: 基础架构搭建

### 批次 1.1：核心类型定义

- [x] Task 1.1: 更新共享类型定义
  - [x] SubTask 1.1.1: 添加 ToolType 枚举
  - [x] SubTask 1.1.2: 添加 ToolBase、ToolConfig、ToolResponse 接口
  - [x] SubTask 1.1.3: 添加 Binding 接口和 BindingMatch 条件
  - [x] SubTask 1.1.4: 添加 ToolCallMessage、ToolResponseMessage 类型
  - [x] SubTask 1.1.5: 更新 AgentType 包含所有 11 个 Agent
  - [x] SubTask 1.1.6: 运行类型检查确保无错误

### 批次 1.2：工具层基础设施

- [x] Task 1.2: 创建 ToolBase 基类
  - [x] SubTask 1.2.1: 创建 `packages/backend/src/tools/ToolBase.ts`
  - [x] SubTask 1.2.2: 定义 ToolConfig 接口（id, name, description）
  - [x] SubTask 1.2.3: 定义抽象 execute 方法
  - [x] SubTask 1.2.4: 定义 ToolResponse 接口（success, data, error）
  - [x] SubTask 1.2.5: 添加工具生命周期方法（initialize, dispose）

- [x] Task 1.3: 创建 ToolRegistry 工具注册中心
  - [x] SubTask 1.3.1: 创建 `packages/backend/src/tools/ToolRegistry.ts`
  - [x] SubTask 1.3.2: 实现工具注册方法（registerTool）
  - [x] SubTask 1.3.3: 实现工具查询方法（getTool, hasTool）
  - [x] SubTask 1.3.4: 实现工具列表方法（listTools）
  - [x] SubTask 1.3.5: 实现工具初始化方法（initializeAll）
  - [x] SubTask 1.3.6: 添加工具状态监控

### 批次 1.3：Binding 路由系统

- [x] Task 1.4: 创建 BindingRouter 路由器
  - [x] SubTask 1.4.1: 创建 `packages/backend/src/routing/BindingRouter.ts`
  - [x] SubTask 1.4.2: 定义 Binding 接口（agentId, match, priority）
  - [x] SubTask 1.4.3: 定义 BindingMatch 条件类型（messageType, context, custom）
  - [x] SubTask 1.4.4: 实现绑定注册方法（registerBinding）
  - [x] SubTask 1.4.5: 实现路由匹配方法（route）
  - [x] SubTask 1.4.6: 实现优先级排序（高优先级优先）
  - [x] SubTask 1.4.7: 实现回退机制（无匹配时返回默认）
  - [x] SubTask 1.4.8: 添加路由缓存优化性能

- [x] Task 1.5: 创建 BindingConfigService 配置服务
  - [x] SubTask 1.5.1: 创建 `packages/backend/src/services/BindingConfigService.ts`
  - [x] SubTask 1.5.2: 实现默认 Binding 配置
  - [x] SubTask 1.5.3: 实现 Binding 配置加载
  - [x] SubTask 1.5.4: 实现 Binding 配置验证

### 批次 1.4：上下文系统

- [x] Task 1.6: 创建 AgentContext 上下文类
  - [x] SubTask 1.6.1: 创建 `packages/backend/src/context/AgentContext.ts`
  - [x] SubTask 1.6.2: 定义 ContextData 接口（数据路径、值、变更记录）
  - [x] SubTask 1.6.3: 实现上下文快照方法（snapshot）
  - [x] SubTask 1.6.4: 实现上下文变更追踪方法（trackChange）
  - [x] SubTask 1.6.5: 实现上下文合并方法（merge）

- [x] Task 1.7: 创建 ContextManager 上下文管理器
  - [x] SubTask 1.7.1: 创建 `packages/backend/src/context/ContextManager.ts`
  - [x] SubTask 1.7.2: 实现全局状态管理（globalContext）
  - [x] SubTask 1.7.3: 实现上下文分发方法（dispatch）
  - [x] SubTask 1.7.4: 实现上下文收集方法（collect）
  - [x] SubTask 1.7.5: 实现冲突检测方法（detectConflicts）
  - [x] SubTask 1.7.6: 实现冲突解决方法（resolveConflicts）
  - [x] SubTask 1.7.7: 实现状态提交方法（commit）

### 批次 1.5：决策日志系统

- [x] Task 1.8: 创建 DecisionLogService 决策日志服务
  - [x] SubTask 1.8.1: 创建 `packages/backend/src/services/DecisionLogService.ts`
  - [x] SubTask 1.8.2: 定义 DecisionLog 数据结构
  - [x] SubTask 1.8.3: 实现日志创建方法（createLog）
  - [x] SubTask 1.8.4: 实现决策记录方法（recordDecision）
  - [x] SubTask 1.8.5: 实现上下文变更记录方法（recordChange）
  - [x] SubTask 1.8.6: 实现冲突记录方法（recordConflict）
  - [x] SubTask 1.8.7: 实现日志持久化方法（persist）
  - [x] SubTask 1.8.8: 实现日志查询方法（query）
  - [x] SubTask 1.8.9: 实现问题回溯方法（traceback）

### 批次 1.6：Tool 读写分离

- [x] Task 1.9: 创建 Tool 读写装饰器
  - [x] SubTask 1.9.1: 创建 `packages/backend/src/tools/ToolPermissions.ts`
  - [x] SubTask 1.9.2: 实现 `@Read` 装饰器
  - [x] SubTask 1.9.3: 实现 `@Write` 装饰器
  - [x] SubTask 1.9.4: 实现权限检查中间件
  - [x] SubTask 1.9.5: 实现写操作队列

### 批次 1.7：模板系统

- [x] Task 1.10: 创建 TemplateService 模板服务
  - [x] SubTask 1.10.1: 创建 `packages/backend/src/services/TemplateService.ts`
  - [x] SubTask 1.10.2: 定义 GameTemplate 数据结构
  - [x] SubTask 1.10.3: 实现模板加载方法（loadTemplate）
  - [x] SubTask 1.10.4: 实现模板验证方法（validateTemplate）
  - [x] SubTask 1.10.5: 实现模板存储方法（saveTemplate）
  - [x] SubTask 1.10.6: 实现模板列表方法（listTemplates）

- [x] Task 1.11: 集成现有角色创建系统
  - [x] SubTask 1.11.1: 审查现有 CharacterGenerationService 实现
  - [x] SubTask 1.11.2: 修改属性计算调用 NumericalTool
  - [x] SubTask 1.11.3: 添加 CoordinatorAgent 验证逻辑
  - [x] SubTask 1.11.4: 添加角色创建结果写入 Global Context
  - [x] SubTask 1.11.5: 添加决策日志记录
  - [x] SubTask 1.11.6: 更新前端 Store 集成新 API

### 批次 1.8：数据库迁移

- [x] Task 1.12: 创建数据库迁移脚本
  - [x] SubTask 1.12.1: 创建 `decision_logs` 表
  - [x] SubTask 1.12.2: 创建 `agent_contexts` 表
  - [x] SubTask 1.12.3: 创建 `tool_states` 表
  - [x] SubTask 1.12.4: 创建 `bindings` 表
  - [x] SubTask 1.12.5: 创建 `agent_configs` 表

- [x] Task 1.13: 更新 DatabaseService
  - [x] SubTask 1.13.1: 添加新表的 CRUD 方法
  - [x] SubTask 1.13.2: 添加决策日志查询方法
  - [x] SubTask 1.13.3: 添加上下文快照方法
  - [x] SubTask 1.13.4: 添加 Binding 配置方法
  - [x] SubTask 1.13.5: 添加 Agent 配置方法
  - [x] SubTask 1.13.6: 添加迁移版本检查

---

## Phase 1.9：新增服务实现

### 批次 1.9.1：EventService 事件服务

- [x] Task 1.9.1: 创建 EventService
  - [x] SubTask 1.9.1.1: 创建 `packages/backend/src/services/EventService.ts`
  - [x] SubTask 1.9.1.2: 定义 GameEvent、EventTriggerRecord、EventCondition、EventEffect 类型
  - [x] SubTask 1.9.1.3: 实现事件 CRUD 方法（createEvent, getEvent, listEvents, updateEvent, deleteEvent）
  - [x] SubTask 1.9.1.4: 实现条件检查方法（checkConditions, checkLocationTriggers, checkConditionTriggers）
  - [x] SubTask 1.9.1.5: 实现触发管理方法（triggerEvent, recordTrigger, getTriggerHistory）
  - [x] SubTask 1.9.1.6: 实现事件链方法（getNextEvent, getChainProgress）
  - [x] SubTask 1.9.1.7: 实现存读档支持（serializeState, deserializeState）
  - [x] SubTask 1.9.1.8: 实现随机事件方法（rollRandomEvent）
  - [x] SubTask 1.9.1.9: 创建数据库迁移脚本（events 表、event_trigger_history 表）
  - [ ] SubTask 1.9.1.10: 编写单元测试

### 批次 1.9.2：StoryService 故事服务

- [x] Task 1.9.2: 创建 StoryService
  - [x] SubTask 1.9.2.1: 创建 `packages/backend/src/services/StoryService.ts`
  - [x] SubTask 1.9.2.2: 定义 StoryNode、StoryChoice、StorySummary、PlotPoint 类型
  - [x] SubTask 1.9.2.3: 实现节点管理方法（createNode, getNode, updateNode, deleteNode, getActiveNodes）
  - [x] SubTask 1.9.2.4: 实现分支管理方法（getBranch, mergeBranches, getCurrentBranch）
  - [x] SubTask 1.9.2.5: 实现选择记录方法（recordChoice, getChoices, undoChoice）
  - [x] SubTask 1.9.2.6: 实现摘要管理方法（generateSummary, saveSummary, getSummary）
  - [x] SubTask 1.9.2.7: 实现剧情点方法（addPlotPoint, getPlotPoints）
  - [x] SubTask 1.9.2.8: 实现存读档支持（serializeState, deserializeState）
  - [x] SubTask 1.9.2.9: 实现导航方法（getCurrentNode, navigateToNode, getStoryPath）
  - [x] SubTask 1.9.2.10: 创建数据库迁移脚本（story_nodes 表、story_summaries 表、plot_points 表）
  - [x] SubTask 1.9.2.11: 集成 LLM 服务用于摘要生成
  - [ ] SubTask 1.9.2.12: 编写单元测试

### 批次 1.9.3：UIService UI服务

- [x] Task 1.9.3: 创建 UIService
  - [x] SubTask 1.9.3.1: 创建 `packages/backend/src/services/UIService.ts`
  - [x] SubTask 1.9.3.2: 定义 UIState、UIInstruction、NotificationItem、QuickBarSlot 类型
  - [x] SubTask 1.9.3.3: 实现状态管理方法（getState, updateState, resetState）
  - [x] SubTask 1.9.3.4: 实现面板管理方法（openPanel, closePanel, togglePanel, setPanelTab）
  - [x] SubTask 1.9.3.5: 实现指令队列方法（queueInstruction, getQueue, clearQueue, processNextInstruction）
  - [x] SubTask 1.9.3.6: 实现通知管理方法（showNotification, dismissNotification, clearNotifications, getNotifications, markAsRead）
  - [x] SubTask 1.9.3.7: 实现对话框管理方法（showDialog, hideDialog, bringToFront）
  - [x] SubTask 1.9.3.8: 实现组件缓存方法（getComponent, cacheComponent, invalidateComponent, clearCache）
  - [x] SubTask 1.9.3.9: 实现快捷栏管理方法（setQuickBarSlot, clearQuickBarSlot, useQuickBarSlot）
  - [x] SubTask 1.9.3.10: 实现存读档支持（serializeState, deserializeState）
  - [x] SubTask 1.9.3.11: 实现订阅机制（subscribe, notifySubscribers）
  - [x] SubTask 1.9.3.12: 创建数据库迁移脚本（ui_states 表、ui_instructions 表）
  - [ ] SubTask 1.9.3.13: 编写单元测试

---

## Phase 2: Tool 层实现（自底向上）

### 批次 2.1：基础数据工具

- [x] Task 2.1: 创建 NumericalTool
  - [x] SubTask 2.1.1: 创建 `packages/backend/src/tools/implementations/NumericalTool.ts`
  - [x] SubTask 2.1.2: 实现属性计算方法（calculateStats）
  - [x] SubTask 2.1.3: 实现伤害计算方法（calculateDamage）
  - [x] SubTask 2.1.4: 实现经验值计算方法（calculateExp）
  - [x] SubTask 2.1.5: 实现等级成长方法（calculateLevelUp）
  - [x] SubTask 2.1.6: 注册到 ToolRegistry

- [x] Task 2.2: 创建 UIDataTool
  - [x] SubTask 2.2.1: 创建 `packages/backend/src/tools/implementations/UIDataTool.ts`
  - [x] SubTask 2.2.2: 实现 UI 状态管理方法
  - [x] SubTask 2.2.3: 实现指令队列方法
  - [x] SubTask 2.2.4: 实现组件缓存方法
  - [x] SubTask 2.2.5: 注册到 ToolRegistry

### 批次 2.2：核心数据工具

- [x] Task 2.3: 创建 InventoryDataTool
  - [x] SubTask 2.3.1: 创建 `packages/backend/src/tools/InventoryDataTool.ts`
  - [x] SubTask 2.3.2: 实现物品 CRUD 方法（createItem, getItem, updateItem, deleteItem）
  - [x] SubTask 2.3.3: 实现堆叠逻辑方法（stackItems, splitStack）
  - [x] SubTask 2.3.4: 实现装备穿戴方法（equipItem, unequipItem）
  - [x] SubTask 2.3.5: 实现耐久度管理方法
  - [x] SubTask 2.3.6: 注册到 ToolRegistry

- [x] Task 2.4: 创建 SkillDataTool
  - [x] SubTask 2.4.1: 创建 `packages/backend/src/tools/SkillDataTool.ts`
  - [x] SubTask 2.4.2: 实现技能 CRUD 方法
  - [x] SubTask 2.4.3: 实现冷却管理方法（startCooldown, isOnCooldown, getRemainingCooldown）
  - [x] SubTask 2.4.4: 实现前置检查方法（checkPrerequisites）
  - [x] SubTask 2.4.5: 注册到 ToolRegistry

- [x] Task 2.5: 创建 MapDataTool
  - [x] SubTask 2.5.1: 创建 `packages/backend/src/tools/MapDataTool.ts`
  - [x] SubTask 2.5.2: 实现位置查询方法（getLocation, getCurrentLocation）
  - [x] SubTask 2.5.3: 实现移动验证方法（canMoveTo, getTravelTime）
  - [x] SubTask 2.5.4: 实现区域管理方法（createArea, updateArea, getArea）
  - [x] SubTask 2.5.5: 实现连接关系方法（getConnections, addConnection）
  - [x] SubTask 2.5.6: 注册到 ToolRegistry

### 批次 2.3：实体数据工具

- [x] Task 2.6: 创建 NPCDataTool
  - [x] SubTask 2.6.1: 创建 `packages/backend/src/tools/NPCDataTool.ts`
  - [x] SubTask 2.6.2: 实现 NPC CRUD 方法
  - [x] SubTask 2.6.3: 实现关系管理方法（updateRelationship, getRelationship）
  - [x] SubTask 2.6.4: 实现队伍管理方法（addPartyMember, removePartyMember）
  - [x] SubTask 2.6.5: 实现日程调度方法
  - [x] SubTask 2.6.6: 注册到 ToolRegistry

- [x] Task 2.7: 创建 QuestDataTool
  - [x] SubTask 2.7.1: 创建 `packages/backend/src/tools/QuestDataTool.ts`
  - [x] SubTask 2.7.2: 实现任务 CRUD 方法
  - [x] SubTask 2.7.3: 实现进度追踪方法（updateProgress, getProgress）
  - [x] SubTask 2.7.4: 实现前置检查方法（checkPrerequisites）
  - [x] SubTask 2.7.5: 实现奖励发放方法（grantRewards）
  - [x] SubTask 2.7.6: 注册到 ToolRegistry

- [x] Task 2.8: 创建 EventDataTool
  - [x] SubTask 2.8.1: 创建 `packages/backend/src/tools/implementations/EventDataTool.ts`
  - [x] SubTask 2.8.2: 实现事件 CRUD 方法
  - [x] SubTask 2.8.3: 实现条件检查方法（checkConditions）
  - [x] SubTask 2.8.4: 实现触发记录方法（recordTrigger, getTriggerHistory）
  - [x] SubTask 2.8.5: 实现事件链方法（getNextEvent, getChainProgress）
  - [x] SubTask 2.8.6: 注册到 ToolRegistry

### 批次 2.4：状态数据工具

- [x] Task 2.9: 创建 DialogueDataTool
  - [x] SubTask 2.9.1: 创建 `packages/backend/src/tools/implementations/DialogueDataTool.ts`
  - [x] SubTask 2.9.2: 实现对话历史管理方法（addHistory, getHistory）
  - [x] SubTask 2.9.3: 实现上下文构建方法（buildContext）
  - [x] SubTask 2.9.4: 实现情绪记录方法（recordEmotion, getEmotionHistory）
  - [x] SubTask 2.9.5: 注册到 ToolRegistry

- [x] Task 2.10: 创建 CombatDataTool
  - [x] SubTask 2.10.1: 创建 `packages/backend/src/tools/implementations/CombatDataTool.ts`
  - [x] SubTask 2.10.2: 实现战斗状态管理方法（initCombat, getCombatState, endCombat）
  - [x] SubTask 2.10.3: 实现回合处理方法（nextTurn, getCurrentTurn）
  - [x] SubTask 2.10.4: 实现效果结算方法（applyEffect, removeEffect）
  - [x] SubTask 2.10.5: 注册到 ToolRegistry

- [x] Task 2.11: 创建 StoryDataTool
  - [x] SubTask 2.11.1: 创建 `packages/backend/src/tools/implementations/StoryDataTool.ts`
  - [x] SubTask 2.11.2: 实现剧情节点管理方法（addNode, getNode, updateNode）
  - [x] SubTask 2.11.3: 实现选择记录方法（recordChoice, getChoices）
  - [x] SubTask 2.11.4: 实现摘要存储方法（saveSummary, getSummary）
  - [x] SubTask 2.11.5: 注册到 ToolRegistry

---

## Phase 3: Agent 基类重构

### 批次 3.1：AgentBase 重构

- [x] Task 3.1: 重构 AgentBase 基类
  - [x] SubTask 3.1.1: 移除 `canCallAgents` 属性
  - [x] SubTask 3.1.2: 移除 `dataAccess` 属性
  - [x] SubTask 3.1.3: 添加 `tools` 依赖列表属性
  - [x] SubTask 3.1.4: 添加 `bindings` 配置属性
  - [x] SubTask 3.1.5: 实现 `getTool<T>(toolType: ToolType): T` 方法
  - [x] SubTask 3.1.6: 实现 `callTool(toolType: ToolType, method: string, params: any): Promise<ToolResponse>` 方法
  - [x] SubTask 3.1.7: 实现 `callAgent(agentType: AgentType, message: AgentMessage): Promise<AgentResponse>` 方法
  - [x] SubTask 3.1.8: 更新构造函数接收 Registry 依赖

### 批次 3.2：AgentRegistry 实现

- [x] Task 3.2: 创建 AgentRegistry
  - [x] SubTask 3.2.1: 创建 `packages/backend/src/services/AgentRegistry.ts`
  - [x] SubTask 3.2.2: 实现 Agent 注册方法（registerAgent）
  - [x] SubTask 3.2.3: 实现 Agent 查询方法（getAgent, getAgentByType）
  - [x] SubTask 3.2.4: 实现 Agent 列表方法（listAgents）
  - [x] SubTask 3.2.5: 实现 Agent 状态监控方法（getAgentStatus）
  - [x] SubTask 3.2.6: 整合 ToolRegistry 功能（getTool, listTools）
  - [x] SubTask 3.2.7: 实现依赖注入（injectDependencies）

### 批次 3.3：消息队列更新

- [x] Task 3.3: 更新 MessageQueue 支持 Tool 调用
  - [x] SubTask 3.3.1: 添加 `tool_call` 消息类型支持
  - [x] SubTask 3.3.2: 添加 `tool_response` 消息类型支持
  - [x] SubTask 3.3.3: 更新 MessageRouter 支持 Binding 匹配
  - [x] SubTask 3.3.4: 更新日志记录支持 Tool 调用追踪

---

## Phase 4: Agent 层重构（自底向上）

### 批次 4.1：基础 Agent 重构

- [x] Task 4.1: 重构 UIAgent
  - [x] SubTask 4.1.1: 更新 UIAgent 继承新 AgentBase
  - [x] SubTask 4.1.2: 声明 tools 依赖：[UIDataTool]
  - [x] SubTask 4.1.3: 实现 UI 指令生成 AI 能力
  - [x] SubTask 4.1.4: 实现文本格式化 AI 能力
  - [x] SubTask 4.1.5: 实现通知生成 AI 能力
  - [x] SubTask 4.1.6: 配置 Binding 规则
  - [x] SubTask 4.1.7: 注册到 AgentRegistry

### 批次 4.2：生成型 Agent 重构

- [x] Task 4.2: 重构 InventoryAgent
  - [x] SubTask 4.2.1: 更新 InventoryAgent 继承新 AgentBase
  - [x] SubTask 4.2.2: 声明 tools 依赖：[InventoryDataTool]
  - [x] SubTask 4.2.3: 实现物品生成 AI 能力（generateItem）
  - [x] SubTask 4.2.4: 实现物品描述生成 AI 能力
  - [x] SubTask 4.2.5: 配置 Per-Agent 模型参数
  - [x] SubTask 4.2.6: 配置 Binding 规则
  - [x] SubTask 4.2.7: 注册到 AgentRegistry

- [x] Task 4.3: 重构 SkillAgent
  - [x] SubTask 4.3.1: 更新 SkillAgent 继承新 AgentBase
  - [x] SubTask 4.3.2: 声明 tools 依赖：[SkillDataTool]
  - [x] SubTask 4.3.3: 实现技能生成 AI 能力（generateSkill）
  - [x] SubTask 4.3.4: 实现技能描述生成 AI 能力
  - [x] SubTask 4.3.5: 配置 Per-Agent 模型参数
  - [x] SubTask 4.3.6: 配置 Binding 规则
  - [x] SubTask 4.3.7: 注册到 AgentRegistry

- [x] Task 4.4: 重构 MapAgent
  - [x] SubTask 4.4.1: 更新 MapAgent 继承新 AgentBase
  - [x] SubTask 4.4.2: 声明 tools 依赖：[MapDataTool]
  - [x] SubTask 4.4.3: 实现地图生成 AI 能力（generateArea）
  - [x] SubTask 4.4.4: 实现区域描述生成 AI 能力
  - [x] SubTask 4.4.5: 实现事件生成 AI 能力
  - [x] SubTask 4.4.6: 配置 Per-Agent 模型参数
  - [x] SubTask 4.4.7: 配置 Binding 规则
  - [x] SubTask 4.4.8: 注册到 AgentRegistry

### 批次 4.3：实体 Agent 重构

- [x] Task 4.5: 重构 NPCAgent
  - [x] SubTask 4.5.1: 更新 NPCAgent 继承新 AgentBase
  - [x] SubTask 4.5.2: 声明 tools 依赖：[NPCDataTool]
  - [x] SubTask 4.5.3: 实现 NPC 行为生成 AI 能力
  - [x] SubTask 4.5.4: 实现对话风格生成 AI 能力
  - [x] SubTask 4.5.5: 实现关系变化 AI 能力
  - [x] SubTask 4.5.6: 配置 Binding 规则
  - [x] SubTask 4.5.7: 注册到 AgentRegistry

- [x] Task 4.6: 重构 QuestAgent
  - [x] SubTask 4.6.1: 更新 QuestAgent 继承新 AgentBase
  - [x] SubTask 4.6.2: 声明 tools 依赖：[QuestDataTool]
  - [x] SubTask 4.6.3: 实现任务生成 AI 能力（generateQuest）
  - [x] SubTask 4.6.4: 实现目标设计 AI 能力
  - [x] SubTask 4.6.5: 实现奖励设计 AI 能力
  - [x] SubTask 4.6.6: 配置 Binding 规则
  - [x] SubTask 4.6.7: 注册到 AgentRegistry

- [x] Task 4.7: 重构 EventAgent
  - [x] SubTask 4.7.1: 更新 EventAgent 继承新 AgentBase
  - [x] SubTask 4.7.2: 声明 tools 依赖：[EventDataTool]
  - [x] SubTask 4.7.3: 实现事件生成 AI 能力（generateEvent）
  - [x] SubTask 4.7.4: 实现条件设计 AI 能力
  - [x] SubTask 4.7.5: 配置 Binding 规则
  - [x] SubTask 4.7.6: 注册到 AgentRegistry

### 批次 4.4：核心 Agent 重构

- [x] Task 4.8: 重构 DialogueAgent
  - [x] SubTask 4.8.1: 更新 DialogueAgent 继承新 AgentBase
  - [x] SubTask 4.8.2: 声明 tools 依赖：[DialogueDataTool, NPCDataTool]
  - [x] SubTask 4.8.3: 实现对话生成 AI 能力（generateDialogue）
  - [x] SubTask 4.8.4: 实现选项生成 AI 能力
  - [x] SubTask 4.8.5: 实现情绪分析 AI 能力
  - [x] SubTask 4.8.6: 配置 Per-Agent 模型参数
  - [x] SubTask 4.8.7: 配置 Binding 规则
  - [x] SubTask 4.8.8: 注册到 AgentRegistry

- [x] Task 4.9: 重构 CombatAgent
  - [x] SubTask 4.9.1: 更新 CombatAgent 继承新 AgentBase
  - [x] SubTask 4.9.2: 声明 tools 依赖：[CombatDataTool, NumericalTool]
  - [x] SubTask 4.9.3: 实现战斗 AI 决策能力（困难模式）
  - [x] SubTask 4.9.4: 实现战斗叙事 AI 能力
  - [x] SubTask 4.9.5: 配置 Per-Agent 模型参数
  - [x] SubTask 4.9.6: 配置 Binding 规则
  - [x] SubTask 4.9.7: 注册到 AgentRegistry

- [x] Task 4.10: 重构 StoryContextAgent
  - [x] SubTask 4.10.1: 更新 StoryContextAgent 继承新 AgentBase
  - [x] SubTask 4.10.2: 声明 tools 依赖：[StoryDataTool]
  - [x] SubTask 4.10.3: 实现剧情生成 AI 能力（generatePlot）
  - [x] SubTask 4.10.4: 实现上下文压缩 AI 能力
  - [x] SubTask 4.10.5: 实现分支管理 AI 能力
  - [x] SubTask 4.10.6: 配置 Per-Agent 模型参数
  - [x] SubTask 4.10.7: 配置 Binding 规则
  - [x] SubTask 4.10.8: 注册到 AgentRegistry

### 批次 4.5：统筹 Agent 重构

- [x] Task 4.11: 重构 CoordinatorAgent
  - [x] SubTask 4.11.1: 更新 CoordinatorAgent 继承新 AgentBase
  - [x] SubTask 4.11.2: 声明 tools 依赖：所有 Tool
  - [x] SubTask 4.11.3: 实现意图分析 AI 能力（analyzeIntent）
  - [x] SubTask 4.11.4: 实现任务分配逻辑
  - [x] SubTask 4.11.5: 实现冲突检测逻辑
  - [x] SubTask 4.11.6: 实现结果整合 AI 能力（integrateResults）
  - [x] SubTask 4.11.7: 实现游戏初始化调度逻辑（initializeGame）
  - [x] SubTask 4.11.8: 配置 Per-Agent 模型参数
  - [x] SubTask 4.11.9: 配置 Binding 规则
  - [x] SubTask 4.11.10: 注册到 AgentRegistry

---

## Phase 5: 集成与测试

### 批次 5.0：提示词工程

- [x] Task 5.0.1: 创建提示词模块系统
  - [x] SubTask 5.0.1.1: 创建 `packages/backend/src/prompts/modules/` 目录
  - [x] SubTask 5.0.1.2: 创建角色定义模块模板
  - [x] SubTask 5.0.1.3: 创建 Tool Schema 模块模板
  - [x] SubTask 5.0.1.4: 创建上下文模板模块
  - [x] SubTask 5.0.1.5: 创建输出格式模块模板

- [x] Task 5.0.2: 创建 Tool Schema 生成器
  - [x] SubTask 5.0.2.1: 创建 `packages/backend/src/services/ToolSchemaGenerator.ts`
  - [x] SubTask 5.0.2.2: 实现 OpenAI 风格 Schema 生成
  - [x] SubTask 5.0.2.3: 实现 Tool 方法元数据提取
  - [x] SubTask 5.0.2.4: 实现 Schema 缓存机制
  - [x] SubTask 5.0.2.5: 实现 Schema 按需获取 API

- [x] Task 5.0.3: 创建上下文注入服务
  - [x] SubTask 5.0.3.1: 创建 `packages/backend/src/services/ContextInjectionService.ts`
  - [x] SubTask 5.0.3.2: 实现核心上下文构建
  - [x] SubTask 5.0.3.3: 实现分层注入逻辑
  - [x] SubTask 5.0.3.4: 实现上下文请求 Tool
  - [x] SubTask 5.0.3.5: 实现历史记录截断（可配置条数）

- [x] Task 5.0.4: 创建 Agent 输出解析器
  - [x] SubTask 5.0.4.1: 创建 `packages/backend/src/services/AgentOutputParser.ts`
  - [x] SubTask 5.0.4.2: 实现 `<thinking>` 标记解析
  - [x] SubTask 5.0.4.3: 实现 JSON 自动识别和解析
  - [x] SubTask 5.0.4.4: 实现 Tool 调用提取
  - [x] SubTask 5.0.4.5: 实现解析错误处理

- [x] Task 5.0.5: 创建 Tool 调用执行器
  - [x] SubTask 5.0.5.1: 创建 `packages/backend/src/services/ToolCallExecutor.ts`
  - [x] SubTask 5.0.5.2: 实现单次调用执行
  - [x] SubTask 5.0.5.3: 实现批量并行调用执行
  - [x] SubTask 5.0.5.4: 实现自动重试机制（可配置次数）
  - [x] SubTask 5.0.5.5: 实现指数退避延迟
  - [x] SubTask 5.0.5.6: 实现调用结果注入上下文

- [x] Task 5.0.6: 创建写操作审核服务
  - [x] SubTask 5.0.6.1: 创建 `packages/backend/src/services/WriteOperationReviewService.ts`
  - [x] SubTask 5.0.6.2: 实现规则验证检查
  - [x] SubTask 5.0.6.3: 实现权限检查
  - [x] SubTask 5.0.6.4: 实现冲突检测
  - [x] SubTask 5.0.6.5: 实现审核日志记录
  - [x] SubTask 5.0.6.6: 实现审核结果返回格式

- [x] Task 5.0.7: 创建 Tool 调用示例文件
  - [x] SubTask 5.0.7.1: 创建 `packages/backend/src/prompts/examples/` 目录结构
  - [x] SubTask 5.0.7.2: 创建 combat/ 示例文件
  - [x] SubTask 5.0.7.3: 创建 dialogue/ 示例文件
  - [x] SubTask 5.0.7.4: 创建 inventory/ 示例文件
  - [x] SubTask 5.0.7.5: 创建 common/ 示例文件（单次/批量调用）

- [x] Task 5.0.8: 更新 PromptService
  - [x] SubTask 5.0.8.1: 添加模块组合功能
  - [x] SubTask 5.0.8.2: 添加 Tool Schema 注入
  - [x] SubTask 5.0.8.3: 添加示例注入
  - [x] SubTask 5.0.8.4: 添加决策日志配置选项
  - [x] SubTask 5.0.8.5: 更新现有模板为新格式

- [x] Task 5.0.9: 更新 Agent 提示词模板
  - [x] SubTask 5.0.9.1: 更新 coordinator.md
  - [x] SubTask 5.0.9.2: 更新 dialogue.md
  - [x] SubTask 5.0.9.3: 更新 combat.md
  - [x] SubTask 5.0.9.4: 更新其他 Agent 模板
  - [x] SubTask 5.0.9.5: 添加 `{{tool_list}}` 变量
  - [x] SubTask 5.0.9.6: 添加 `{{tool_examples}}` 变量

### 批次 5.1：后端 API 更新

- [x] Task 5.1: 更新 Agent 相关 API
  - [x] SubTask 5.1.1: 添加 Binding 配置查询 API
  - [x] SubTask 5.1.2: 添加 Binding 配置更新 API
  - [x] SubTask 5.1.3: 添加 Tool 状态查询 API
  - [x] SubTask 5.1.4: 添加 Agent 能力查询 API
  - [x] SubTask 5.1.5: 添加游戏初始化 API

### 批次 5.2：前端集成

- [x] Task 5.2: 更新前端状态管理
  - [x] SubTask 5.2.1: 更新 agentStore 支持新架构
  - [x] SubTask 5.2.2: 更新 gameStore 支持新架构
  - [x] SubTask 5.2.3: 创建 decisionLogStore
  - [x] SubTask 5.2.4: 创建前端服务层

- [x] Task 5.3: 创建前端 UI 组件
  - [x] SubTask 5.3.1: 创建 ToolStatusPanel 组件
  - [x] SubTask 5.3.2: 创建 BindingConfigPanel 组件
  - [x] SubTask 5.3.3: 创建 DecisionLogViewer 组件
  - [x] SubTask 5.3.4: 创建 ContextDiffViewer 组件

### 批次 5.3：测试

- [ ] Task 5.6: 工具层单元测试
  - [ ] SubTask 5.6.1: 测试 ToolBase 基类
  - [ ] SubTask 5.6.2: 测试各 Tool 实现
  - [ ] SubTask 5.6.3: 测试 ToolRegistry 注册机制

- [ ] Task 5.7: Agent 层单元测试
  - [ ] SubTask 5.7.1: 测试重构后的 Agent 实现
  - [ ] SubTask 5.7.2: 测试 Agent-Tool 交互
  - [ ] SubTask 5.7.3: 测试 Binding 配置生效

- [ ] Task 5.8: 集成测试
  - [ ] SubTask 5.8.1: 端到端游戏初始化流程测试
  - [ ] SubTask 5.8.2: 端到端对话流程测试
  - [ ] SubTask 5.8.3: 端到端战斗流程测试
  - [ ] SubTask 5.8.4: 多 Agent 协作流程测试

### 批次 5.4：开发者工具适配

- [x] Task 5.9: 适配 DeveloperPanel 组件
  - [x] SubTask 5.9.1: 新增 `tools` Tab
  - [x] SubTask 5.9.2: 新增 `bindings` Tab
  - [x] SubTask 5.9.3: 新增 `decisions` Tab

- [x] Task 5.10: 适配 AgentCommunication 组件
  - [x] SubTask 5.10.1: 新增 `tool_call` 消息类型支持
  - [x] SubTask 5.10.2: 新增 `tool_response` 消息类型支持
  - [x] SubTask 5.10.3: 新增 `context_change` 消息类型支持
  - [x] SubTask 5.10.4: 新增 `conflict_detected` 消息类型支持
  - [x] SubTask 5.10.5: 新增消息过滤功能
  - [x] SubTask 5.10.6: 优化消息详情展示

- [x] Task 5.11: 适配 StateInspector 组件
  - [x] SubTask 5.11.1: 新增 `GlobalContext` 状态类型支持
  - [x] SubTask 5.11.2: 新增 `AgentContext` 状态类型支持
  - [x] SubTask 5.11.3: 新增 `ToolState` 状态类型支持
  - [x] SubTask 5.11.4: 新增上下文对比功能
  - [x] SubTask 5.11.5: 新增冲突高亮显示

- [x] Task 5.12: 适配 LogViewer 组件
  - [x] SubTask 5.12.1: 新增 `decision` 日志类型支持
  - [x] SubTask 5.12.2: 新增 `context` 日志类型支持
  - [x] SubTask 5.12.3: 新增 `conflict` 日志类型支持
  - [x] SubTask 5.12.4: 新增日志过滤功能
  - [x] SubTask 5.12.5: 新增日志关联跳转功能

### 批次 5.5：设置弹窗适配

- [x] Task 5.13: 适配设置弹窗
  - [x] SubTask 5.13.1: 新增 Agent 配置面板
  - [x] SubTask 5.13.2: 新增 Binding 配置面板
  - [x] SubTask 5.13.3: 新增 Tool 配置面板
  - [x] SubTask 5.13.4: 新增决策日志配置面板

- [x] Task 5.14: 适配 LLMConfigModal 组件
  - [x] SubTask 5.14.1: 新增 Per-Agent 模型选择
  - [x] SubTask 5.14.2: 新增 Per-Agent 参数配置
  - [x] SubTask 5.14.3: 新增模型故障转移配置
  - [x] SubTask 5.14.4: 保留全局默认模型配置

### 批次 5.6：文档更新

- [x] Task 5.6: 更新架构文档
  - [x] SubTask 5.6.1: 更新 agent-architecture.md
  - [x] SubTask 5.6.2: 添加 Tool 层说明
  - [x] SubTask 5.6.3: 添加 Binding 配置说明
  - [x] SubTask 5.6.4: 添加迁移指南

- [x] Task 5.7: 更新开发文档
  - [x] SubTask 5.7.1: 更新 development.md
  - [x] SubTask 5.7.2: 添加工具开发指南
  - [x] SubTask 5.7.3: 添加 Agent 开发指南
  - [x] SubTask 5.7.4: 添加示例代码

---

# Task Dependencies

## Phase 1 依赖
- [Task 1.2] depends on [Task 1.1]
- [Task 1.3] depends on [Task 1.1]
- [Task 1.4] depends on [Task 1.1]
- [Task 1.5] depends on [Task 1.4]
- [Task 1.6] depends on [Task 1.1]
- [Task 1.7] depends on [Task 1.6]
- [Task 1.8] depends on [Task 1.1]
- [Task 1.9] depends on [Task 1.2]
- [Task 1.10] depends on [Task 1.1]
- [Task 1.11] depends on [Task 1.10]
- [Task 1.12] depends on [Task 1.1]
- [Task 1.13] depends on [Task 1.12]
- [Task 1.9.1] depends on [Task 1.1, Task 1.12]
- [Task 1.9.2] depends on [Task 1.1, Task 1.12]
- [Task 1.9.3] depends on [Task 1.1, Task 1.12]

## Phase 2 依赖
- [Task 2.1] depends on [Task 1.2]
- [Task 2.2] depends on [Task 1.2, Task 1.9.3]
- [Task 2.3] depends on [Task 1.2]
- [Task 2.4] depends on [Task 1.2]
- [Task 2.5] depends on [Task 1.2]
- [Task 2.6] depends on [Task 1.2]
- [Task 2.7] depends on [Task 1.2]
- [Task 2.8] depends on [Task 1.2, Task 1.9.1]
- [Task 2.9] depends on [Task 1.2]
- [Task 2.10] depends on [Task 1.2]
- [Task 2.11] depends on [Task 1.2, Task 1.9.2]

## Phase 3 依赖
- [Task 3.1] depends on [Task 1.2, Task 1.4]
- [Task 3.2] depends on [Task 1.2, Task 3.1]
- [Task 3.3] depends on [Task 1.4, Task 3.2]

## Phase 4 依赖
- [Task 4.1] depends on [Task 3.1, Task 2.2]
- [Task 4.2] depends on [Task 3.1, Task 2.3]
- [Task 4.3] depends on [Task 3.1, Task 2.4]
- [Task 4.4] depends on [Task 3.1, Task 2.5]
- [Task 4.5] depends on [Task 3.1, Task 2.6]
- [Task 4.6] depends on [Task 3.1, Task 2.7]
- [Task 4.7] depends on [Task 3.1, Task 2.8]
- [Task 4.8] depends on [Task 3.1, Task 2.9, Task 2.6]
- [Task 4.9] depends on [Task 3.1, Task 2.10, Task 2.1]
- [Task 4.10] depends on [Task 3.1, Task 2.11]
- [Task 4.11] depends on [Task 3.1, Task 3.2, All Phase 2 Tasks]

## Phase 5 依赖
- [Task 5.0.1] depends on [Task 1.1]
- [Task 5.0.2] depends on [Task 1.2, Task 1.3]
- [Task 5.0.3] depends on [Task 1.6, Task 1.7]
- [Task 5.0.4] depends on [Task 1.1]
- [Task 5.0.5] depends on [Task 1.2, Task 1.3, Task 5.0.4]
- [Task 5.0.6] depends on [Task 1.6, Task 1.7, Task 1.8]
- [Task 5.0.7] depends on [Task 5.0.2]
- [Task 5.0.8] depends on [Task 5.0.1, Task 5.0.2, Task 5.0.3, Task 5.0.7]
- [Task 5.0.9] depends on [Task 5.0.8]
- [Task 5.1] depends on [Task 3.2, Task 4.11, Task 5.0.9]
- [Task 5.2] depends on [Task 5.1]
- [Task 5.3] depends on [All Phase 2 Tasks]
- [Task 5.4] depends on [All Phase 4 Tasks]
- [Task 5.5] depends on [Task 5.3, Task 5.4]
- [Task 5.6] depends on [Task 5.5]
- [Task 5.7] depends on [Task 5.5]
