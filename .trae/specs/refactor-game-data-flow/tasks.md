# Tasks

## 任务 1: 添加类型定义

- [x] Task 1.1: 在 `packages/shared/src/types/` 添加/更新类型
  - [x] `GameState` 统一状态类型（包含所有字段）
  - [x] `DynamicUIData` 类型（无类型区分，由 Markdown 内容决定展示形式）
  - [x] `UpdateGameStateRequest` 类型
  - [x] `DynamicUIActionMessage` 类型

## 任务 2: 实现 Markdown 动态 UI 渲染器（合并 Task 2 + Task 15）

- [x] Task 2.1: 安装依赖
  - [x] 安装 `react-markdown`
  - [x] 安装 `remark-gfm`

- [x] Task 2.2: 创建 `packages/frontend/src/components/ui/MarkdownRenderer.tsx`
  - [x] 支持标准 Markdown 语法
  - [x] 实现 `preprocessMarkdown` 函数
    - [x] 将 `:::component-name` 转换为 `<div class="dynamic-ui-component-name">`
    - [x] 处理属性 `{attr=value}`
    - [x] 处理嵌套内容
  - [x] 实现 `components` 配置
    - [x] 处理 `div` 标签，根据 className 渲染对应组件
    - [x] 处理 `a` 标签，处理 `action:` 和 `tooltip:` 格式

- [x] Task 2.3: 创建扩展组件
  - [x] `OptionsComponent.tsx` - 选项按钮组
  - [x] `ProgressComponent.tsx` - 进度条
  - [x] `TabsComponent.tsx` - 标签页
  - [x] `SystemNotifyComponent.tsx` - 系统通知
  - [x] `BadgeComponent.tsx` - 徽章
  - [x] `TooltipComponent.tsx` - 悬浮提示
  - [x] `ConditionalComponent.tsx` - 条件显示
  - [x] `EnhancementComponent.tsx` - 装备强化
  - [x] `WarehouseComponent.tsx` - 仓库/银行

- [x] Task 2.4: 创建样式文件
  - [x] `MarkdownRenderer.module.css`
  - [x] 各扩展组件样式

## 任务 3: 扩展 gameStore 统一更新方法（合并 Task 3 + Task 14）

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

- [x] Task 3.3: 添加 `sendDynamicUIAction` 方法
  - [x] 构造 `DynamicUIActionMessage` 消息
  - [x] 通过 WebSocket 发送消息
  - [x] 处理关闭操作时清空 dynamicUI 状态

- [x] Task 3.4: 添加 `initWebSocket` 方法
  - [x] 监听 `game_state_update` 事件
  - [x] 调用 `updateGameState` 更新状态

- [x] Task 3.5: 在应用启动时初始化 WebSocket
  - [x] 在 App.tsx 或入口文件中调用 `initWebSocket`

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
  - [x] 接收自然语言描述
  - [x] 构建动态 UI 生成提示词
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

- [x] Task 11.3: 更新各专业 Agent 提示词
  - [x] NumericalAgent (`numerical.md`) - 添加初始化方法说明
  - [ ] SkillAgent (`skill.md`) - 添加从模板获取初始技能的说明
  - [ ] InventoryAgent (`inventory.md`) - 添加从模板获取初始物品的说明
  - [ ] QuestAgent (`quest.md`) - 添加从模板获取初始任务的说明
  - [ ] MapAgent (`map.md`) - 添加从模板获取地图配置的说明
  - [ ] NPCAgent (`npc_party.md`) - 添加从模板获取初始NPC的说明

- [x] Task 11.4: 创建动态 UI 提示词模块
  - [x] 创建 `packages/backend/src/prompts/modules/dynamic-ui.md`
  - [x] 包含所有 Markdown 扩展组件语法
  - [x] 包含组件使用示例
  - [x] 可被 UIAgent 和其他 Agent 引用

## 任务 12: 前端 DynamicUIPanel 窗口化实现

- [x] Task 12.1: 创建 `DynamicUIPanel.tsx` 通用动态 UI 面板
  - [x] 使用 MarkdownRenderer 渲染内容
  - [x] 处理用户操作（调用 updateGameState 或 onAction）
  - [x] 支持关闭操作

- [x] Task 12.2: 实现窗口状态管理
  - [x] position 状态（位置）
  - [x] size 状态（大小）
  - [x] isDragging/isResizing 状态

- [x] Task 12.3: 实现拖拽移动功能
  - [x] handleMouseDown 设置拖拽状态
  - [x] handleMouseMove 更新位置
  - [x] handleMouseUp 结束拖拽

- [x] Task 12.4: 实现缩放大小功能
  - [x] resize handle 元素
  - [x] handleMouseMove 更新大小

- [x] Task 12.5: 实现关闭功能
  - [x] 关闭按钮
  - [x] 调用 `sendDynamicUIAction('close')`

- [x] Task 12.6: 创建样式文件
  - [x] `DynamicUIPanel.module.css`
  - [x] 窗口样式（标题栏、内容区、resize handle）

## 任务 13: 开发者工具 - UIAgent 测试面板

- [x] Task 13.1: 创建 `UIAgentTestPanel.tsx`
  - [x] 自然语言描述输入框
  - [x] 测试生成按钮
  - [x] 结果显示区域（预览 + Markdown 源码）

- [x] Task 13.2: 创建后端 API
  - [x] `POST /api/developer/test-ui-agent`
  - [x] 接收自然语言描述
  - [x] 调用 UIAgent.generateDynamicUI
  - [x] 返回 DynamicUIData

- [x] Task 13.3: 更新 DeveloperPanel.tsx
  - [x] 添加 'ui-agent-test' 标签页
  - [x] 渲染 UIAgentTestPanel

## 任务 14: 开发者工具 - 模拟动态 UI 数据生成器

- [x] Task 14.1: 创建 `MockDynamicUIPanel.tsx`
  - [x] 模板选择器（预设模板名称）
  - [x] Markdown 编辑器
  - [x] 预设模板加载按钮
  - [x] 生成动态 UI 按钮

- [x] Task 14.2: 定义预设模板
  - [x] welcome 模板
  - [x] notification 模板
  - [x] dialog 模板
  - [x] enhancement 模板
  - [x] warehouse 模板
  - [x] shop 模板

- [x] Task 14.3: 更新 DeveloperPanel.tsx
  - [x] 添加 'mock-dynamic-ui' 标签页
  - [x] 渲染 MockDynamicUIPanel

## 任务 15: 开发者工具 - 动态 UI 状态查看器

- [x] Task 15.1: 创建 `DynamicUIStatePanel.tsx`
  - [x] 显示当前 dynamicUI 状态
  - [x] 显示 ID、上下文
  - [x] 显示 Markdown 预览
  - [x] 显示 Markdown 源码

- [x] Task 15.2: 更新 DeveloperPanel.tsx
  - [x] 添加 'dynamic-ui-state' 标签页
  - [x] 渲染 DynamicUIStatePanel

## 任务 16: 开发者工具 - 数据模拟面板

- [x] Task 16.1: 创建 `packages/frontend/src/data/mockDataTemplates.ts`
  - [x] 定义 10 种面板数据模板
  - [x] 每种面板 3 种类型（正常数据、残缺数据、错误数据）
  - [x] 每种类型 3 个示例

- [x] Task 16.2: 创建 `DataSimulatorPanel.tsx`
  - [x] 单面板模式（选择面板、类型、模板）
  - [x] 自由组合模式（勾选多个模板组合）
  - [x] 数据编辑器（JSON 格式，支持临时编辑）
  - [x] 发送按钮（模拟 WebSocket 推送）
  - [x] 发送历史（最近 10 条，可重新发送）

- [x] Task 16.3: 更新 DeveloperPanel.tsx
  - [x] 添加 'data-simulator' 标签页
  - [x] 渲染 DataSimulatorPanel

## 任务 17: 后端动态 UI 操作消息处理

- [x] Task 17.1: 添加消息类型处理
  - [x] 在 CoordinatorAgent 中处理 `dynamic_ui_action` 消息
  - [x] 根据 action 和 context 决定响应

- [x] Task 17.2: 实现关闭响应逻辑
  - [x] 处理 `action: 'close'`
  - [x] 根据 context 执行后续流程（如结束交易）

- [x] Task 17.3: 实现其他 action 响应逻辑
  - [x] 处理各种 action（start_game, open_shop, buy_item, confirm_enhance 等）
  - [x] 可能调用 UIAgent 生成新的动态 UI

## 任务 18: 类型检查与测试

- [x] Task 18.1: 运行前端类型检查
- [x] Task 18.2: 运行后端类型检查
- [x] Task 18.3: 测试 MarkdownRenderer 组件
- [x] Task 18.4: 测试 DynamicUIPanel 组件
- [x] Task 18.5: 测试模拟游戏界面入口
- [x] Task 18.6: 测试正常游戏初始化流程
- [x] Task 18.7: 测试动态 UI 显示和交互
- [x] Task 18.8: 测试存档加载后数据恢复
- [x] Task 18.9: 测试 updateGameState 统一更新
- [x] Task 18.10: 测试数据模拟面板

## 任务 19: 更新开发文档

- [x] Task 19.1: 在 `docs/development.md` 中记录动态 UI 生成系统
  - [x] MarkdownRenderer 组件说明
  - [x] 所有扩展组件语法说明
  - [x] DynamicUIPanel 组件说明
  - [x] UIAgent.generateDynamicUI 方法说明
  - [x] updateGameState 统一更新方法说明
  - [x] Agent 提示词更新说明
  - [x] 数据模拟面板说明

# Task Dependencies

## 第一层（无依赖，可并行执行）
- [Task 1] 类型定义 - 基础类型
- [Task 2] Markdown 渲染器 - 独立实现
- [Task 6] 模拟数据服务 - 独立实现
- [Task 10] Agent 模板数据 - 独立实现

## 第二层（依赖第一层）
- [Task 3] gameStore 扩展 - 依赖 [Task 1] 类型定义
- [Task 4] UIDataTool - 依赖 [Task 1] 类型定义
- [Task 5] UIAgent 动态 UI 生成 - 依赖 [Task 2] MarkdownRenderer, [Task 4] UIDataTool

## 第三层（依赖第二层）
- [Task 7] 模拟游戏入口 - 依赖 [Task 3] gameStore, [Task 6] 模拟数据
- [Task 8] 面板组件重构 - 依赖 [Task 3] gameStore
- [Task 9] CoordinatorAgent - 依赖 [Task 3] gameStore, [Task 4] UIDataTool, [Task 5] UIAgent
- [Task 11] Agent 提示词 - 依赖 [Task 4] UIDataTool, [Task 5] UIAgent
- [Task 12] DynamicUIPanel - 依赖 [Task 2] MarkdownRenderer, [Task 3] gameStore

## 第四层（依赖第三层）
- [Task 13] UIAgent 测试面板 - 依赖 [Task 5] UIAgent
- [Task 14] 模拟动态 UI 面板 - 依赖 [Task 3] gameStore
- [Task 15] 动态 UI 状态查看器 - 依赖 [Task 3] gameStore
- [Task 16] 数据模拟面板 - 依赖 [Task 3] gameStore, [Task 6] 模拟数据
- [Task 17] 后端消息处理 - 依赖 [Task 5] UIAgent

## 第五层（依赖第四层）
- [Task 18] 类型检查与测试 - 依赖 [Task 1-17]

## 第六层（依赖第五层）
- [Task 19] 更新开发文档 - 依赖 [Task 18]

# 并行执行建议

## 第一批并行执行
- Task 1 (类型定义)
- Task 2 (Markdown 渲染器)
- Task 6 (模拟数据服务)
- Task 10 (Agent 模板数据)

## 第二批并行执行（依赖第一批）
- Task 3 (gameStore 扩展) - 依赖 Task 1
- Task 4 (UIDataTool) - 依赖 Task 1
- Task 5 (UIAgent) - 依赖 Task 2, Task 4

## 第三批并行执行（依赖第二批）
- Task 7 (模拟游戏入口) - 依赖 Task 3, Task 6
- Task 8 (面板组件重构) - 依赖 Task 3
- Task 9 (CoordinatorAgent) - 依赖 Task 3, Task 4, Task 5
- Task 11 (Agent 提示词) - 依赖 Task 4, Task 5
- Task 12 (DynamicUIPanel) - 依赖 Task 2, Task 3

## 第四批并行执行（依赖第三批）
- Task 13 (UIAgent 测试面板) - 依赖 Task 5
- Task 14 (模拟动态 UI 面板) - 依赖 Task 3
- Task 15 (动态 UI 状态查看器) - 依赖 Task 3
- Task 16 (数据模拟面板) - 依赖 Task 3, Task 6
- Task 17 (后端消息处理) - 依赖 Task 5

## 第五批顺序执行
- Task 18 (类型检查与测试) - 依赖所有前置任务
- Task 19 (更新开发文档) - 依赖 Task 18
