# Checklist

## Phase 1: 基础架构搭建

### 批次 1.1：核心类型定义

- [ ] ToolType 枚举已添加，包含所有 11 个 Tool
- [ ] ToolBase、ToolConfig、ToolResponse 接口已定义
- [ ] Binding 接口和 BindingMatch 条件类型已定义
- [ ] ToolCallMessage、ToolResponseMessage 类型已添加
- [ ] AgentType 已更新包含所有 11 个 Agent
- [ ] 类型检查通过，无错误

### 批次 1.2：工具层基础设施

- [ ] ToolBase 基类已创建，包含 execute 方法和生命周期方法
- [ ] ToolRegistry 已实现，支持工具注册、查询和初始化
- [ ] 工具状态监控已实现

### 批次 1.3：Binding 路由系统

- [ ] BindingRouter 已实现，支持声明式路由配置
- [ ] 优先级排序已实现（高优先级优先）
- [ ] 回退机制已实现（无匹配时返回默认）
- [ ] 路由缓存已添加，性能优化
- [ ] BindingConfigService 已创建，支持配置加载和验证

### 批次 1.4：上下文系统

- [ ] AgentContext 类已创建，支持快照和变更追踪
- [ ] ContextManager 已实现，支持全局状态管理
- [ ] 上下文分发方法已实现（dispatch）
- [ ] 上下文收集方法已实现（collect）
- [ ] 冲突检测方法已实现（detectConflicts）
- [ ] 冲突解决方法已实现（resolveConflicts）
- [ ] 状态提交方法已实现（commit）

### 批次 1.5：决策日志系统

- [ ] DecisionLogService 已创建
- [ ] DecisionLog 数据结构已定义
- [ ] 日志创建、记录、持久化方法已实现
- [ ] 日志查询和问题回溯方法已实现

### 批次 1.6：Tool 读写分离

- [ ] `@Read` 和 `@Write` 装饰器已实现
- [ ] 权限检查中间件已实现
- [ ] 写操作队列已实现
- [ ] 所有 Tool 方法已标注读写类型

### 批次 1.7：模板系统

- [ ] TemplateService 已创建
- [ ] GameTemplate 数据结构已定义
- [ ] 模板加载、验证、存储方法已实现
- [ ] CharacterGenerationService 已集成 NumericalTool
- [ ] 角色创建结果写入 Global Context
- [ ] 决策日志记录已添加

### 批次 1.8：数据库迁移

- [ ] 数据库迁移脚本已创建
- [ ] `decision_logs` 表已创建
  - [ ] 字段完整：id, request_id, timestamp, player_input, agents, conflicts, result, metadata
  - [ ] 索引已创建：request_id, timestamp
- [ ] `agent_contexts` 表已创建
  - [ ] 字段完整：id, save_id, agent_id, context_data, timestamp
  - [ ] 外键关联：save_id -> saves.id
  - [ ] 索引已创建：agent_id
- [ ] `tool_states` 表已创建
  - [ ] 字段完整：id, tool_id, state_data, last_updated
  - [ ] 唯一约束：tool_id
- [ ] `bindings` 表已创建
  - [ ] 字段完整：id, agent_id, match_conditions, priority, enabled
  - [ ] 索引已创建：agent_id
- [ ] `agent_configs` 表已创建
  - [ ] 字段完整：id, agent_id, model, parameters, failover_config
  - [ ] 唯一约束：agent_id
- [ ] DatabaseService 已更新
  - [ ] 新表 CRUD 方法已添加
  - [ ] 决策日志查询方法已添加
  - [ ] 上下文快照方法已添加
  - [ ] Binding 配置方法已添加
  - [ ] Agent 配置方法已添加
  - [ ] 迁移版本检查已添加
- [ ] 迁移不影响现有数据
- [ ] 迁移支持回滚

---

## Phase 2: Tool 层实现

### 批次 2.1：基础数据工具

- [ ] NumericalTool 已创建，实现属性计算、伤害计算、经验值计算
- [ ] UIDataTool 已创建，实现 UI 状态管理、指令队列

### 批次 2.2：核心数据工具

- [ ] InventoryDataTool 已创建，实现物品 CRUD、堆叠、装备穿戴
- [ ] SkillDataTool 已创建，实现技能 CRUD、冷却管理
- [ ] MapDataTool 已创建，实现位置查询、移动验证、区域管理

### 批次 2.3：实体数据工具

- [ ] NPCDataTool 已创建，实现 NPC CRUD、关系管理、队伍管理
- [ ] QuestDataTool 已创建，实现任务 CRUD、进度追踪、奖励发放
- [ ] EventDataTool 已创建，实现事件 CRUD、条件检查、事件链

### 批次 2.4：状态数据工具

- [ ] DialogueDataTool 已创建，实现对话历史管理、上下文构建
- [ ] CombatDataTool 已创建，实现战斗状态管理、回合处理
- [ ] StoryDataTool 已创建，实现剧情节点管理、选择记录

### 工具层验证

- [ ] 所有 11 个 Tool 已注册到 ToolRegistry
- [ ] 所有 Tool 不包含 LLM 调用逻辑
- [ ] 所有 Tool 输入输出类型明确

---

## Phase 3: Agent 基类重构

### 批次 3.1：AgentBase 重构

- [ ] `canCallAgents` 属性已移除
- [ ] `dataAccess` 属性已移除
- [ ] `tools` 依赖列表属性已添加
- [ ] `bindings` 配置属性已添加
- [ ] `getTool` 方法已实现
- [ ] `callTool` 方法已实现
- [ ] `callAgent` 方法已实现
- [ ] 构造函数已更新接收 Registry 依赖

### 批次 3.2：AgentRegistry 实现

- [ ] AgentRegistry 已创建
- [ ] Agent 注册、查询、列表方法已实现
- [ ] Agent 状态监控已实现
- [ ] ToolRegistry 功能已整合
- [ ] 依赖注入已实现

### 批次 3.3：消息队列更新

- [ ] `tool_call` 消息类型已支持
- [ ] `tool_response` 消息类型已支持
- [ ] MessageRouter 支持 Binding 匹配
- [ ] 日志记录支持 Tool 调用追踪

---

## Phase 4: Agent 层重构

### 批次 4.1：基础 Agent 重构

- [ ] UIAgent 已重构，声明 tools 依赖，实现 AI 能力

### 批次 4.2：生成型 Agent 重构

- [ ] InventoryAgent 已重构，实现物品生成 AI 能力
- [ ] SkillAgent 已重构，实现技能生成 AI 能力
- [ ] MapAgent 已重构，实现地图生成 AI 能力
- [ ] 所有生成型 Agent 配置了 Per-Agent 模型参数

### 批次 4.3：实体 Agent 重构

- [ ] NPCAgent 已重构，实现 NPC 行为生成 AI 能力
- [ ] QuestAgent 已重构，实现任务生成 AI 能力
- [ ] EventAgent 已重构，实现事件生成 AI 能力

### 批次 4.4：核心 Agent 重构

- [ ] DialogueAgent 已重构，实现对话生成 AI 能力
- [ ] CombatAgent 已重构，实现战斗 AI 决策能力
- [ ] StoryContextAgent 已重构，实现剧情生成 AI 能力

### 批次 4.5：统筹 Agent 重构

- [ ] CoordinatorAgent 已重构，实现意图分析、结果整合、初始化调度
- [ ] CoordinatorAgent 配置了 Per-Agent 模型参数

### Agent 层验证

- [ ] 所有 11 个 Agent 已注册到 AgentRegistry
- [ ] 所有 Agent 的 tools 依赖已正确声明
- [ ] 所有 Agent 的 Binding 规则已配置
- [ ] Agent 可通过 Registry 获取 Tool 实例
- [ ] Agent 可调用其他 Agent

---

## Phase 5: 集成与测试

### 批次 5.1：后端 API 更新

- [ ] Binding 配置 API 已实现（查询、更新）
- [ ] Tool 状态查询 API 已实现
- [ ] Agent 能力查询 API 已实现
- [ ] 游戏初始化 API 已实现

### 批次 5.2：前端集成

- [ ] agentStore 已更新支持新架构
  - [ ] `tools` 和 `bindings` 状态已添加
  - [ ] `fetchTools()` 和 `fetchBindings()` 方法已实现
  - [ ] `updateBinding()` 方法已实现
- [ ] gameStore 已更新支持新架构
  - [ ] `globalContext` 状态已添加
  - [ ] `decisionLogs` 状态已添加
  - [ ] `fetchDecisionLogs()` 方法已实现
  - [ ] `tracebackProblem()` 方法已实现
- [ ] decisionLogStore 已创建
  - [ ] 支持按请求 ID 查询
  - [ ] 支持按时间范围查询
  - [ ] 支持问题回溯功能
- [ ] 前端服务层已创建
  - [ ] toolService.ts 已创建
  - [ ] bindingService.ts 已创建
  - [ ] decisionLogService.ts 已创建
  - [ ] contextService.ts 已创建

### 批次 5.3：前端 UI 组件

- [ ] ToolStatusPanel 组件已创建
  - [ ] 显示所有 Tool 状态列表
  - [ ] 显示 Tool 调用统计
  - [ ] 支持刷新和过滤
- [ ] BindingConfigPanel 组件已创建
  - [ ] 显示所有 Binding 配置
  - [ ] 支持添加/编辑/删除 Binding
  - [ ] 支持优先级调整
- [ ] DecisionLogViewer 组件已创建
  - [ ] 显示决策日志列表
  - [ ] 显示单个决策详情
  - [ ] 支持搜索和过滤
- [ ] ContextDiffViewer 组件已创建
  - [ ] 显示上下文变更前后对比
  - [ ] 高亮显示差异
  - [ ] 支持冲突显示

### 批次 5.4：开发者工具适配

- [ ] DeveloperPanel 已适配
  - [ ] 新增 `tools` Tab
  - [ ] 新增 `bindings` Tab
  - [ ] 新增 `decisions` Tab
  - [ ] 保留现有 Tab 功能
- [ ] AgentCommunication 已适配
  - [ ] 新增 `tool_call` 消息类型支持
  - [ ] 新增 `tool_response` 消息类型支持
  - [ ] 新增 `context_change` 消息类型支持
  - [ ] 新增 `conflict_detected` 消息类型支持
  - [ ] 新增消息过滤功能
- [ ] StateInspector 已适配
  - [ ] 新增 `GlobalContext` 状态类型支持
  - [ ] 新增 `AgentContext` 状态类型支持
  - [ ] 新增 `ToolState` 状态类型支持
  - [ ] 新增上下文对比功能
  - [ ] 新增冲突高亮显示
- [ ] LogViewer 已适配
  - [ ] 新增 `decision` 日志类型支持
  - [ ] 新增 `context` 日志类型支持
  - [ ] 新增 `conflict` 日志类型支持
  - [ ] 新增日志过滤功能
  - [ ] 新增日志关联跳转功能

### 批次 5.5：设置弹窗适配

- [ ] 设置弹窗已适配
  - [ ] 新增 Agent 配置面板
  - [ ] 新增 Binding 配置面板
  - [ ] 新增 Tool 配置面板
  - [ ] 新增决策日志配置面板
- [ ] LLMConfigModal 已适配
  - [ ] 新增 Per-Agent 模型选择
  - [ ] 新增 Per-Agent 参数配置
  - [ ] 新增模型故障转移配置
  - [ ] 保留全局默认模型配置

### 批次 5.3：测试

- [ ] ToolBase 和各 Tool 实现单元测试通过
- [ ] 重构后的 Agent 实现单元测试通过
- [ ] Agent-Tool 交互测试通过
- [ ] Binding 配置生效测试通过
- [ ] 端到端游戏初始化流程测试通过
- [ ] 端到端对话流程测试通过
- [ ] 端到端战斗流程测试通过
- [ ] 多 Agent 协作流程测试通过

### 批次 5.4：文档更新

- [ ] agent-architecture.md 已更新，包含 Tool 层和 Binding 说明
- [ ] development.md 已更新，包含工具开发指南
- [ ] 迁移指南已创建
- [ ] 示例代码已添加

---

## 功能验证检查点

### Tool 层验证

- [ ] Tool 执行不依赖 LLM，纯数据操作
- [ ] Tool 输入输出类型明确，幂等性保证
- [ ] Tool 不能调用其他 Agent 或 Tool
- [ ] Tool 方法已正确标注 `@Read` 或 `@Write`
- [ ] 读操作可被多 Agent 并发调用
- [ ] 写操作通过 CoordinatorAgent 统一调度

### Agent 层验证

- [ ] Agent 可独立配置模型参数
- [ ] Agent 通过 Binding 调用其他 Agent 或 Tool
- [ ] Agent 的 AI 能力正常工作
- [ ] 生成型 Agent（物品、技能、地图）可生成合理内容
- [ ] Agent 拥有独立的工作上下文
- [ ] Agent 写操作写入本地上下文，不直接修改全局状态

### Binding 路由验证

- [ ] 消息按 Binding 规则正确路由
- [ ] 优先级匹配正确（最具体优先）
- [ ] 回退机制正常工作

### 上下文系统验证

- [ ] CoordinatorAgent 正确分发上下文副本
- [ ] 各 Agent 上下文相互隔离
- [ ] 上下文合并正确执行
- [ ] 冲突检测正常工作
- [ ] 冲突解决按规则执行

### 决策日志验证

- [ ] 每次请求创建决策日志
- [ ] Agent 决策正确记录
- [ ] 上下文变更正确记录
- [ ] 冲突正确记录
- [ ] 日志持久化正常
- [ ] 问题回溯功能正常

### 游戏初始化验证

- [ ] 新游戏开始时 CoordinatorAgent 正确调度各 Agent
- [ ] 各 Agent 生成初始内容正常
- [ ] 各 Tool 存储数据正常
- [ ] 加载存档时不需要 AI 参与

### 系统集成验证

- [ ] 现有游戏流程不受影响
- [ ] 对话系统正常工作
- [ ] 战斗系统正常工作
- [ ] 任务系统正常工作
- [ ] 开发者面板正常显示 Agent/Tool 状态

---

## 性能检查点

- [ ] Binding 路由使用缓存，无性能瓶颈
- [ ] Tool 调用无阻塞
- [ ] Agent 并发调用正常处理
- [ ] 内存使用无明显增加

---

## 安全检查点

- [ ] Tool 不能直接调用 LLM
- [ ] Agent 只能调用声明依赖的 Tool
- [ ] Binding 配置有权限验证
- [ ] 敏感数据不泄露到日志
- [ ] AI 生成内容有验证层过滤不合理内容
