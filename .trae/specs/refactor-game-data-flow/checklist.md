# Checklist

## 任务 1: 类型定义

- [x] GameState 统一状态类型已定义（包含所有字段）
- [x] DynamicUIData 类型已定义（无类型区分，由 Markdown 内容决定展示形式）
- [x] UpdateGameStateRequest 类型已定义
- [x] DynamicUIActionMessage 类型已定义

## 任务 2: Markdown 动态 UI 渲染器

### 依赖安装
- [x] react-markdown 依赖已安装
- [x] remark-gfm 依赖已安装

### MarkdownRenderer 实现
- [x] MarkdownRenderer.tsx 已创建
- [x] preprocessMarkdown 函数已实现
  - [x] :::component-name 转换为 <div class="dynamic-ui-component-name">
  - [x] 处理属性 {attr=value}
  - [x] 处理嵌套内容
- [x] components 配置已实现
  - [x] 处理 div 标签，根据 className 渲染对应组件
  - [x] 处理 a 标签，处理 action: 和 tooltip: 格式

### 扩展组件
- [x] OptionsComponent.tsx 已创建
- [x] ProgressComponent.tsx 已创建
- [x] TabsComponent.tsx 已创建
- [x] SystemNotifyComponent.tsx 已创建
- [x] BadgeComponent.tsx 已创建
- [x] TooltipComponent.tsx 已创建
- [x] ConditionalComponent.tsx 已创建
- [x] EnhancementComponent.tsx 已创建
- [x] WarehouseComponent.tsx 已创建

### 样式文件
- [x] MarkdownRenderer.module.css 已创建
- [x] 各扩展组件样式已创建

## 任务 3: gameStore 统一更新方法

### 状态字段
- [ ] skills 状态字段已添加
- [ ] inventory 状态字段已添加
- [ ] equipment 状态字段已添加
- [ ] mapData 状态字段已添加
- [ ] journalEntries 状态字段已添加
- [ ] dynamicUI 状态字段已添加

### updateGameState 方法
- [ ] 接收 Partial<GameState> 参数
- [ ] 支持部分更新（只更新传入的字段）
- [ ] 触发 React 重新渲染
- [ ] 所有独立 setter 方法已移除

### sendDynamicUIAction 方法
- [ ] 构造 DynamicUIActionMessage 消息
- [ ] 通过 WebSocket 发送消息
- [ ] 处理关闭操作时清空 dynamicUI 状态

### initWebSocket 方法
- [ ] 监听 game_state_update 事件
- [ ] 调用 updateGameState 更新状态

### 应用启动初始化
- [ ] 在 App.tsx 或入口文件中调用 initWebSocket

## 任务 4: UIDataTool 统一方法

- [ ] UIDataTool.ts 已创建或重构
- [ ] updateGameState 方法已实现
- [ ] WebSocket 推送逻辑已实现
- [ ] 已注册到 ToolRegistry

## 任务 5: UIAgent 动态 UI 生成

- [ ] generateDynamicUI 方法已实现
- [ ] 接收自然语言描述
- [ ] DYNAMIC_UI_SYSTEM_PROMPT 已定义
- [ ] LLM 调用生成 Markdown
- [ ] processMessage 处理动态 UI 请求
- [ ] 调用 UIDataTool.updateGameState 推送结果

## 任务 6: 模拟数据服务

- [x] mockGameData.ts 已创建
- [x] 包含完整模拟数据（角色、技能、装备、背包、任务、NPC、日志、地图、动态UI）
- [x] mockGameService.ts 已创建
- [x] loadMockData 方法已实现
- [x] 数据格式与 GameState 一致

## 任务 7: 模拟游戏界面入口

- [ ] MainMenu 显示"模拟游戏界面"按钮
- [ ] 点击按钮正确加载模拟数据
- [ ] 调用 updateGameState 更新状态
- [ ] 所有面板正确显示模拟数据

## 任务 8: 面板组件数据绑定

- [ ] CharacterPanel 从 gameStore 获取数据
- [ ] SkillsPanel 从 gameStore 获取数据
- [ ] EquipmentPanel 从 gameStore 获取数据
- [ ] InventoryPanel 从 gameStore 获取数据
- [ ] QuestPanel 从 gameStore 获取数据
- [ ] NPCPanel 从 gameStore 获取数据
- [ ] JournalPanel 从 gameStore 获取数据
- [ ] MapPanel 从 gameStore 获取数据
- [ ] 所有面板处理空数据状态
- [ ] 所有硬编码数据已移除

## 任务 9: CoordinatorAgent 预制方法

- [ ] initializeNewGame 方法已实现
- [ ] 并行调用各专业 Agent
- [ ] 结果整合逻辑已实现
- [ ] 调用 UIDataTool.updateGameState 更新前端
- [ ] 调用 UIAgent 生成欢迎界面动态 UI
- [ ] 再次调用 UIDataTool.updateGameState 显示动态 UI

### 初始化路由
- [ ] 初始化路由调用 CoordinatorAgent.initializeNewGame
- [ ] 返回初始化结果

## 任务 10: Agent 模板数据使用

- [x] NumericalAgent.initialize 已实现
- [x] SkillAgent.initialize 从模板获取技能
- [x] InventoryAgent.initialize 从模板获取物品
- [x] EquipmentAgent.initialize 从模板获取装备
- [x] QuestAgent.initialize 从模板获取任务
- [x] MapAgent.initialize 从模板获取地图配置
- [x] NPCAgent.initialize 从模板获取初始NPC

## 任务 11: Agent 提示词更新

- [ ] coordinator.md 已更新
  - [ ] 添加 UIDataTool.updateGameState 工具使用说明
  - [ ] 添加预制初始化方法说明
  - [ ] 更新工具调用示例
- [ ] ui.md 已更新
  - [ ] 添加 generateDynamicUI 方法说明
  - [ ] 添加 Markdown 动态 UI 组件语法说明
  - [ ] 添加 UIDataTool.updateGameState 工具使用说明
- [ ] numerical.md 已更新
- [ ] skill.md 已更新
- [ ] inventory.md 已更新
- [ ] quest.md 已更新
- [ ] map.md 已更新
- [ ] npc_party.md 已更新
- [ ] modules/dynamic-ui.md 已创建
  - [ ] 包含所有 Markdown 扩展组件语法
  - [ ] 包含组件使用示例

## 任务 12: DynamicUIPanel 窗口化实现

### 基础功能
- [ ] DynamicUIPanel.tsx 已创建
- [ ] 使用 MarkdownRenderer 渲染内容
- [ ] 处理用户操作调用 updateGameState
- [ ] 支持关闭操作

### 窗口状态管理
- [ ] position 状态已实现
- [ ] size 状态已实现
- [ ] isDragging/isResizing 状态已实现

### 拖拽移动功能
- [ ] handleMouseDown 设置拖拽状态
- [ ] handleMouseMove 更新位置
- [ ] handleMouseUp 结束拖拽

### 缩放大小功能
- [ ] resize handle 元素已创建
- [ ] handleMouseMove 更新大小

### 关闭功能
- [ ] 关闭按钮已创建
- [ ] 调用 sendDynamicUIAction('close')

### 样式文件
- [ ] DynamicUIPanel.module.css 已创建
- [ ] 窗口样式（标题栏、内容区、resize handle）

## 任务 13: 开发者工具 - UIAgent 测试面板

- [ ] UIAgentTestPanel.tsx 已创建
  - [ ] 自然语言描述输入框
  - [ ] 测试生成按钮
  - [ ] 结果显示区域（预览 + Markdown 源码）
- [ ] 后端 API 已创建
  - [ ] POST /api/developer/test-ui-agent
  - [ ] 接收自然语言描述
  - [ ] 调用 UIAgent.generateDynamicUI
  - [ ] 返回 DynamicUIData
- [ ] DeveloperPanel.tsx 已更新
  - [ ] 添加 'ui-agent-test' 标签页
  - [ ] 渲染 UIAgentTestPanel

## 任务 14: 开发者工具 - 模拟动态 UI 数据生成器

- [ ] MockDynamicUIPanel.tsx 已创建
  - [ ] 模板选择器（预设模板名称）
  - [ ] Markdown 编辑器
  - [ ] 预设模板加载按钮
  - [ ] 生成动态 UI 按钮
- [ ] 预设模板已定义
  - [ ] welcome 模板
  - [ ] notification 模板
  - [ ] dialog 模板
  - [ ] enhancement 模板
  - [ ] warehouse 模板
  - [ ] shop 模板
- [ ] DeveloperPanel.tsx 已更新
  - [ ] 添加 'mock-dynamic-ui' 标签页
  - [ ] 渲染 MockDynamicUIPanel

## 任务 15: 开发者工具 - 动态 UI 状态查看器

- [ ] DynamicUIStatePanel.tsx 已创建
  - [ ] 显示当前 dynamicUI 状态
  - [ ] 显示 ID、上下文
  - [ ] 显示 Markdown 预览
  - [ ] 显示 Markdown 源码
- [ ] DeveloperPanel.tsx 已更新
  - [ ] 添加 'dynamic-ui-state' 标签页
  - [ ] 渲染 DynamicUIStatePanel

## 任务 16: 开发者工具 - 数据模拟面板

- [ ] mockDataTemplates.ts 已创建
  - [ ] 定义 10 种面板数据模板
  - [ ] 每种面板 3 种类型（正常、残缺、错误）
  - [ ] 每种类型 3 个示例
- [ ] DataSimulatorPanel.tsx 已创建
  - [ ] 单面板模式
  - [ ] 自由组合模式
  - [ ] 数据编辑器
  - [ ] 发送按钮
  - [ ] 发送历史
  - [ ] console.log 输出
- [ ] DeveloperPanel.tsx 已更新
  - [ ] 添加 'data-simulator' 标签页
  - [ ] 渲染 DataSimulatorPanel

## 任务 17: 后端动态 UI 操作消息处理

- [ ] 消息类型处理已添加
  - [ ] CoordinatorAgent 处理 dynamic_ui_action 消息
  - [ ] 根据 action 和 context 决定响应
- [ ] 关闭响应逻辑已实现
  - [ ] 处理 action: 'close'
  - [ ] 根据 context 执行后续流程
- [ ] 其他 action 响应逻辑已实现
  - [ ] 处理各种 action（start_game, confirm_enhance 等）
  - [ ] 可能调用 UIAgent 生成新的动态 UI

## 任务 18: 类型检查与测试

- [ ] 前端类型检查通过
- [ ] 后端类型检查通过
- [ ] 无 any 类型使用
- [ ] MarkdownRenderer 组件正常工作
- [ ] DynamicUIPanel 组件正常工作
- [ ] 模拟游戏界面入口正常工作
- [ ] 正常游戏初始化流程正常工作
- [ ] 动态 UI 显示正确
- [ ] 动态 UI 交互正常
- [ ] 存档加载后数据正确恢复
- [ ] updateGameState 统一更新正常工作
- [ ] 数据模拟面板正常工作

## 任务 19: 更新开发文档

- [ ] docs/development.md 已更新
  - [ ] MarkdownRenderer 组件说明
  - [ ] 所有扩展组件语法说明
  - [ ] DynamicUIPanel 组件说明
  - [ ] UIAgent.generateDynamicUI 方法说明
  - [ ] updateGameState 统一更新方法说明
  - [ ] Agent 提示词更新说明
  - [ ] 数据模拟面板说明
