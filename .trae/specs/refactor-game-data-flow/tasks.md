# Tasks

## 任务 1: 添加类型定义

- [x] Task 1.1: 在 `packages/shared/src/types/` 添加/更新类型
  - [ ] `GameState` 统一状态类型（包含所有字段）
  - [ ] `DynamicUIData` 类型
  - [ ] `DynamicUIType` 类型
  - [ ] `UpdateGameStateRequest` 类型

## 任务 2: 实现 Markdown 动态 UI 渲染器

- [x] Task 2.1: 创建 `packages/frontend/src/components/ui/MarkdownRenderer.tsx`
  - [x] 支持标准 Markdown 语法
  - [x] 支持 `:::options` 扩展组件
  - [x] 支持 `:::progress` 扩展组件
  - [x] 支持 `:::tabs` 扩展组件
  - [x] 支持 `:::system-notify` 扩展组件
  - [x] 支持 `:::badge` 扩展组件
  - [x] 支持 `:::enhancement` 扩展组件
  - [x] 支持 `:::warehouse` 扩展组件
  - [x] 支持 `[链接](action:xxx)` 可点击操作
  - [x] 支持 `[文本](tooltip:提示内容)` 悬浮提示
  - [x] 支持 `:::if{condition="..."}` 条件显示

- [x] Task 2.2: 创建扩展组件
  - [x] `OptionsComponent.tsx` - 选项按钮组
  - [x] `ProgressComponent.tsx` - 进度条
  - [x] `TabsComponent.tsx` - 标签页
  - [x] `SystemNotifyComponent.tsx` - 系统通知
  - [x] `BadgeComponent.tsx` - 徽章
  - [x] `TooltipComponent.tsx` - 悬浮提示
  - [x] `ConditionalComponent.tsx` - 条件显示
  - [x] `EnhancementComponent.tsx` - 装备强化
  - [x] `WarehouseComponent.tsx` - 仓库/银行

- [x] Task 2.3: 创建 `DynamicUIPanel.tsx` 通用动态 UI 面板
  - [x] 根据 `dynamicUI.type` 应用不同样式
  - [x] 使用 MarkdownRenderer 渲染内容
  - [x] 处理用户操作（调用 updateGameState 或 onAction）
  - [x] 支持关闭操作

## 任务 3: 扩展 gameStore 统一更新方法

- [x] Task 3.1: 在 gameStore 中添加新的状态字段
  - [x] 添加 `skills: Skill[]` 状态
  - [x] 添加 `inventory: InventoryItem[]` 状态
  - [x] 添加 `equipment: EquipmentState` 状态
  - [x] 添加 `mapData: MapData | null` 状态
  - [x] 添加 `journalEntries: JournalEntry[]` 状态
  - [x] 添加 `dynamicUI: DynamicUIData | null` 状态

- [x] Task 3.2: 实现统一的 `updateGameState` 方法
  - [x] 接收 `Partial<GameState>` 参数
  - [x] 支持部分更新（只更新传入的字段）
  - [x] 触发 React 重新渲染
  - [x] 移除所有独立的 setter 方法

- [x] Task 3.3: 添加 WebSocket 监听器
  - [x] 监听后端推送的游戏状态更新
  - [x] 调用 `updateGameState` 更新状态

## 任务 4: 实现 UIDataTool 统一方法

- [x] Task 4.1: 检查 UIDataTool 是否存在
  - [x] 如果不存在，创建 `packages/backend/src/tools/implementations/UIDataTool.ts`
  - [x] 如果存在，重构为统一方法

- [x] Task 4.2: 实现 `updateGameState` 方法
  - [x] 接收 `Partial<GameState>` 数据
  - [x] 通过 WebSocket 推送更新到前端

- [x] Task 4.3: 注册 UIDataTool 到 ToolRegistry
  - [x] 在 ToolRegistry 中注册
  - [x] 设置读写权限

## 任务 5: 扩展 UIAgent 动态 UI 生成

- [x] Task 5.1: 在 UIAgent 中添加 `generateDynamicUI` 方法
  - [x] 支持多种 UI 类型（welcome, notification, dialog, enhancement, warehouse, shop, custom）
  - [x] 构建对应类型的提示词
  - [x] 调用 LLM 生成 Markdown
  - [x] 返回 DynamicUIData

- [x] Task 5.2: 定义动态 UI 系统提示词
  - [x] 创建 `DYNAMIC_UI_SYSTEM_PROMPT`
  - [x] 包含所有 Markdown 扩展组件使用说明
  - [x] 包含模板风格适配指南

- [x] Task 5.3: 添加 `processMessage` 处理动态 UI 请求
  - [x] 处理 `generate_dynamic_ui` action
  - [x] 调用 UIDataTool.updateGameState 推送结果

## 任务 6: 创建纯前端模拟数据服务

- [x] Task 6.1: 创建 `packages/frontend/src/data/mockGameData.ts`
  - [x] 定义模拟角色数据
  - [x] 定义模拟技能数据
  - [x] 定义模拟装备数据
  - [x] 定义模拟背包数据
  - [x] 定义模拟任务数据
  - [x] 定义模拟NPC数据
  - [x] 定义模拟日志数据
  - [x] 定义模拟地图数据
  - [x] 定义模拟动态 UI 数据

- [x] Task 6.2: 创建 `packages/frontend/src/services/mockGameService.ts`
  - [x] `loadMockData()` 方法 - 返回 `Partial<GameState>`
  - [x] 确保数据格式与真实数据一致

## 任务 7: 实现模拟游戏界面入口

- [x] Task 7.1: 修改 `MainMenu.tsx`
  - [x] 修改 `handleDevModeGame` 方法
  - [x] 调用 `mockGameService.loadMockData()` 获取数据
  - [x] 调用 `gameStore.updateGameState()` 更新状态
  - [x] 切换到游戏界面

## 任务 8: 重构面板组件数据绑定

- [x] Task 8.1: 重构 `CharacterPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `character` 状态
  - [x] 处理空数据状态

- [x] Task 8.2: 重构 `SkillsPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `skills` 状态
  - [x] 处理空数据状态

- [x] Task 8.3: 重构 `EquipmentPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `equipment` 状态
  - [x] 处理空数据状态

- [x] Task 8.4: 重构 `InventoryPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `inventory` 状态
  - [x] 处理空数据状态

- [x] Task 8.5: 重构 `QuestPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `quests` 状态
  - [x] 处理空数据状态

- [x] Task 8.6: 重构 `NPCPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `npcs` 状态
  - [x] 处理空数据状态

- [x] Task 8.7: 重构 `JournalPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `journalEntries` 状态
  - [x] 处理空数据状态

- [x] Task 8.8: 重构 `MapPanel.tsx`
  - [x] 移除硬编码数据
  - [x] 从 `useGameStore` 获取 `mapData` 状态
  - [x] 处理空数据状态

## 任务 9: 实现 CoordinatorAgent 预制初始化方法

- [x] Task 9.1: 在 CoordinatorAgent 中添加 `initializeNewGame` 方法
  - [x] 定义固定的初始化流程
  - [x] 并行调用各专业 Agent
  - [x] 整合结果
  - [x] 调用 UIDataTool.updateGameState 更新前端
  - [x] 调用 UIAgent 生成欢迎界面动态 UI
  - [x] 再次调用 UIDataTool.updateGameState 显示动态 UI

- [x] Task 9.2: 修改初始化路由
  - [x] 修改 `/api/initialization/start` 路由
  - [x] 调用 CoordinatorAgent.initializeNewGame
  - [x] 返回初始化结果

## 任务 10: 确保各 Agent 正确使用模板数据

- [x] Task 10.1: 确认/实现各 Agent 的初始化方法
  - [x] NumericalAgent.initialize
  - [x] SkillAgent.initialize - 从模板获取初始技能
  - [x] InventoryAgent.initialize - 从模板获取初始物品
  - [x] EquipmentAgent.initialize - 从模板获取初始装备
  - [x] QuestAgent.initialize - 从模板获取初始任务
  - [x] MapAgent.initialize - 从模板获取地图配置
  - [x] NPCAgent.initialize - 从模板获取初始NPC

## 任务 11: 更新 Agent 提示词

- [x] Task 11.1: 更新 CoordinatorAgent 提示词 (`packages/backend/src/prompts/coordinator.md`)
  - [x] 添加 UIDataTool.updateGameState 工具使用说明
  - [x] 添加预制初始化方法说明
  - [x] 更新工具调用示例

- [x] Task 11.2: 更新 UIAgent 提示词 (`packages/backend/src/prompts/ui.md`)
  - [x] 添加 generateDynamicUI 方法说明
  - [x] 添加 Markdown 动态 UI 组件语法说明
  - [x] 添加 UIDataTool.updateGameState 工具使用说明
  - [x] 添加动态 UI 类型说明（welcome, notification, dialog 等）

- [x] Task 11.3: 更新各专业 Agent 提示词
  - [x] NumericalAgent (`numerical.md`) - 添加初始化方法说明
  - [x] SkillAgent (`skill.md`) - 添加从模板获取初始技能的说明
  - [x] InventoryAgent (`inventory.md`) - 添加从模板获取初始物品的说明
  - [x] QuestAgent (`quest.md`) - 添加从模板获取初始任务的说明
  - [x] MapAgent (`map.md`) - 添加从模板获取地图配置的说明
  - [x] NPCAgent (`npc_party.md`) - 添加从模板获取初始NPC的说明

- [x] Task 11.4: 创建动态 UI 提示词模块
  - [x] 创建 `packages/backend/src/prompts/modules/dynamic-ui.md`
  - [x] 包含所有 Markdown 扩展组件语法
  - [x] 包含组件使用示例
  - [x] 可被 UIAgent 和其他 Agent 引用

## 任务 12: 更新开发者工具

- [x] Task 12.1: 创建动态 UI 测试组件 (`packages/frontend/src/components/dev/DynamicUITester.tsx`)
  - [x] UI 类型选择器
  - [x] 自然语言描述输入框
  - [x] 生成按钮（调用 UIAgent API）
  - [x] Markdown 预览区域
  - [x] 渲染效果预览区域

- [x] Task 12.2: 创建状态调试面板 (`packages/frontend/src/components/dev/StateDebugger.tsx`)
  - [x] 显示 gameStore 所有状态
  - [x] 状态编辑器
  - [x] updateGameState 调用按钮
  - [x] 状态变更历史记录

- [x] Task 12.3: 创建 Markdown 组件预览 (`packages/frontend/src/components/dev/MarkdownPreviewer.tsx`)
  - [x] Markdown 输入框
  - [x] 实时预览区域
  - [x] 扩展组件列表
  - [x] 组件语法示例

- [x] Task 12.4: 创建 WebSocket 模拟器 (`packages/frontend/src/components/dev/WebSocketSimulator.tsx`)
  - [x] 消息模板选择器
  - [x] 消息内容编辑器
  - [x] 发送按钮
  - [x] 消息历史记录

- [x] Task 12.5: 创建数据流转监控 (`packages/frontend/src/components/dev/DataFlowMonitor.tsx`)
  - [x] updateGameState 调用记录列表
  - [x] 记录详情（时间戳、来源、内容）
  - [x] 筛选和搜索功能
  - [x] 导出日志功能

- [x] Task 12.6: 更新开发者工具面板 (`packages/frontend/src/components/dev/DevTools.tsx`)
  - [x] 添加新标签页入口
  - [x] 整合所有调试组件
  - [x] 添加数据流转监控开关

- [x] Task 12.7: 在 gameStore 中添加数据流转监控
  - [x] 记录每次 updateGameState 调用
  - [x] 存储调用来源信息
  - [x] 提供查询接口

## 任务 13: 类型检查与测试

- [x] Task 13.1: 运行前端类型检查
- [x] Task 13.2: 运行后端类型检查
- [x] Task 13.3: 测试 MarkdownRenderer 组件
- [x] Task 13.4: 测试 DynamicUIPanel 组件
- [x] Task 13.5: 测试模拟游戏界面入口
- [x] Task 13.6: 测试正常游戏初始化流程
- [x] Task 13.7: 测试动态 UI 显示和交互
- [x] Task 13.8: 测试存档加载后数据恢复
- [x] Task 13.9: 测试 updateGameState 统一更新
- [x] Task 13.10: 测试开发者工具各功能

## 任务 14: 更新开发文档

- [x] Task 14.1: 在 `docs/development.md` 中记录动态 UI 生成系统
  - [x] MarkdownRenderer 组件说明
  - [x] 所有扩展组件语法说明
  - [x] DynamicUIPanel 组件说明
  - [x] UIAgent.generateDynamicUI 方法说明
  - [x] updateGameState 统一更新方法说明
  - [x] Agent 提示词更新说明
  - [x] 开发者工具使用说明

# Task Dependencies

- [Task 2] 独立 - Markdown 渲染器可以独立实现
- [Task 3] 依赖 [Task 1] - 需要类型定义
- [Task 4] 依赖 [Task 1, Task 3] - 需要类型和状态定义
- [Task 5] 依赖 [Task 2, Task 4] - 需要 MarkdownRenderer 和 UIDataTool
- [Task 6] 依赖 [Task 1] - 需要类型定义
- [Task 7] 依赖 [Task 3, Task 6] - 模拟游戏入口需要状态方法和数据
- [Task 8] 依赖 [Task 3] - 面板重构需要新的状态字段
- [Task 9] 依赖 [Task 3, Task 4, Task 5] - Agent 架构需要 UIDataTool、状态方法和 UIAgent
- [Task 10] 独立 - Agent 实现可以独立进行
- [Task 11] 依赖 [Task 4, Task 5] - 提示词更新需要工具和方法定义
- [Task 12] 依赖 [Task 2, Task 3] - 开发者工具需要 MarkdownRenderer 和状态方法
- [Task 13] 依赖 [Task 1-12] - 测试需要所有功能完成
- [Task 14] 依赖 [Task 13] - 文档在测试通过后更新

# 并行执行建议

以下任务可以并行执行：
- Task 1 (类型定义) + Task 2 (Markdown 渲染器) + Task 6 (模拟数据) + Task 10 (Agent 实现)
- Task 3 + Task 4 + Task 5 (依赖 Task 1 和 Task 2)
- Task 7 + Task 8 + Task 9 (依赖各自的前置任务)
- Task 11 可与 Task 4-10 并行（提示词更新基于设计规范）
- Task 12 可与 Task 5-9 并行（开发者工具基于 MarkdownRenderer 和状态方法）
