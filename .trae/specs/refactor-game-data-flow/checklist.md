# Checklist

## 类型定义

- [x] GameState 统一状态类型已定义（包含所有字段）
- [x] DynamicUIData 类型已定义
- [x] DynamicUIType 类型已定义
- [x] UpdateGameStateRequest 类型已定义

## Markdown 动态 UI 渲染器（新建）

- [x] MarkdownRenderer.tsx 已创建
- [x] 支持 :::options 扩展组件
- [x] 支持 :::progress 扩展组件
- [x] 支持 :::tabs 扩展组件
- [x] 支持 :::system-notify 扩展组件
- [x] 支持 :::badge 扩展组件
- [x] 支持 :::enhancement 扩展组件
- [x] 支持 :::warehouse 扩展组件
- [x] 支持 [链接](action:xxx) 可点击操作
- [x] 支持 [文本](tooltip:提示内容) 悬浮提示
- [x] 支持 :::if{condition="..."} 条件显示
- [x] OptionsComponent.tsx 已创建
- [x] ProgressComponent.tsx 已创建
- [x] TabsComponent.tsx 已创建
- [x] SystemNotifyComponent.tsx 已创建
- [x] BadgeComponent.tsx 已创建
- [x] TooltipComponent.tsx 已创建
- [x] ConditionalComponent.tsx 已创建
- [x] EnhancementComponent.tsx 已创建
- [x] WarehouseComponent.tsx 已创建

## DynamicUIPanel 通用组件（新建）

- [x] DynamicUIPanel.tsx 已创建
- [x] 根据 dynamicUI.type 应用不同样式
- [x] 使用 MarkdownRenderer 渲染内容
- [x] 处理用户操作调用 updateGameState
- [x] 支持关闭操作

## gameStore 统一更新方法

- [x] skills 状态字段已添加
- [x] inventory 状态字段已添加
- [x] equipment 状态字段已添加
- [x] mapData 状态字段已添加
- [x] journalEntries 状态字段已添加
- [x] dynamicUI 状态字段已添加
- [x] updateGameState 方法已实现
- [x] WebSocket 监听器已添加
- [x] 所有独立 setter 方法已移除

## UIDataTool 统一方法

- [x] UIDataTool.ts 已创建或重构
- [x] updateGameState 方法已实现
- [x] WebSocket 推送逻辑已实现
- [x] 已注册到 ToolRegistry

## UIAgent 扩展

- [x] generateDynamicUI 方法已实现
- [x] 支持多种 UI 类型
- [x] DYNAMIC_UI_SYSTEM_PROMPT 已定义
- [x] LLM 调用生成 Markdown
- [x] processMessage 处理动态 UI 请求
- [x] 调用 UIDataTool.updateGameState 推送结果

## 模拟数据服务

- [x] mockGameData.ts 已创建
- [x] 包含完整模拟数据
- [x] mockGameService.ts 已创建
- [x] loadMockData 方法已实现
- [x] 数据格式与 GameState 一致

## 模拟游戏入口

- [x] MainMenu 显示"模拟游戏界面"按钮
- [x] 点击按钮正确加载模拟数据
- [x] 调用 updateGameState 更新状态
- [x] 所有面板正确显示模拟数据

## 面板数据绑定

- [x] CharacterPanel 从 gameStore 获取数据
- [x] SkillsPanel 从 gameStore 获取数据
- [x] EquipmentPanel 从 gameStore 获取数据
- [x] InventoryPanel 从 gameStore 获取数据
- [x] QuestPanel 从 gameStore 获取数据
- [x] NPCPanel 从 gameStore 获取数据
- [x] JournalPanel 从 gameStore 获取数据
- [x] MapPanel 从 gameStore 获取数据
- [x] 所有面板处理空数据状态
- [x] 所有硬编码数据已移除

## CoordinatorAgent 预制方法

- [x] initializeNewGame 方法已实现
- [x] 并行调用各专业 Agent
- [x] 结果整合逻辑已实现
- [x] 调用 UIDataTool.updateGameState 更新前端
- [x] 调用 UIAgent 生成动态 UI
- [x] 再次调用 UIDataTool.updateGameState 显示动态 UI

## 初始化路由

- [x] 初始化路由调用 CoordinatorAgent.initializeNewGame
- [x] 返回初始化结果

## Agent 模板数据使用

- [x] NumericalAgent.initialize 已实现
- [x] SkillAgent.initialize 从模板获取技能
- [x] InventoryAgent.initialize 从模板获取物品
- [x] EquipmentAgent.initialize 从模板获取装备
- [x] QuestAgent.initialize 从模板获取任务
- [x] MapAgent.initialize 从模板获取地图配置
- [x] NPCAgent.initialize 从模板获取NPC

## Agent 提示词更新

- [x] coordinator.md 已更新
  - [x] 添加 UIDataTool.updateGameState 工具使用说明
  - [x] 添加预制初始化方法说明
  - [x] 更新工具调用示例
- [x] ui.md 已更新
  - [x] 添加 generateDynamicUI 方法说明
  - [x] 添加 Markdown 动态 UI 组件语法说明
  - [x] 添加 UIDataTool.updateGameState 工具使用说明
  - [x] 添加动态 UI 类型说明
- [x] numerical.md 已更新
- [x] skill.md 已更新
- [x] inventory.md 已更新
- [x] quest.md 已更新
- [x] map.md 已更新
- [x] npc_party.md 已更新
- [x] modules/dynamic-ui.md 已创建
  - [x] 包含所有 Markdown 扩展组件语法
  - [x] 包含组件使用示例

## 开发者工具更新

- [x] DynamicUITester.tsx 已创建
  - [x] UI 类型选择器已实现
  - [x] 自然语言描述输入框已实现
  - [x] 生成按钮已实现
  - [x] Markdown 预览区域已实现
  - [x] 渲染效果预览区域已实现
- [x] StateDebugger.tsx 已创建
  - [x] 显示 gameStore 所有状态
  - [x] 状态编辑器已实现
  - [x] updateGameState 调用按钮已实现
  - [x] 状态变更历史记录已实现
- [x] MarkdownPreviewer.tsx 已创建
  - [x] Markdown 输入框已实现
  - [x] 实时预览区域已实现
  - [x] 扩展组件列表已实现
  - [x] 组件语法示例已实现
- [x] WebSocketSimulator.tsx 已创建
  - [x] 消息模板选择器已实现
  - [x] 消息内容编辑器已实现
  - [x] 发送按钮已实现
  - [x] 消息历史记录已实现
- [x] DataFlowMonitor.tsx 已创建
  - [x] updateGameState 调用记录列表已实现
  - [x] 记录详情已实现
  - [x] 筛选和搜索功能已实现
  - [x] 导出日志功能已实现
- [x] DevTools.tsx 已更新
  - [x] 新标签页入口已添加
  - [x] 所有调试组件已整合
  - [x] 数据流转监控开关已添加
- [x] gameStore 数据流转监控已添加
  - [x] 记录每次 updateGameState 调用
  - [x] 存储调用来源信息
  - [x] 提供查询接口

## 类型检查

- [x] 前端类型检查通过
- [x] 后端类型检查通过
- [x] 无 any 类型使用

## 功能测试

- [x] MarkdownRenderer 组件正常工作
- [x] DynamicUIPanel 组件正常工作
- [x] 模拟游戏界面入口正常工作
- [x] 正常游戏初始化流程正常工作
- [x] 动态 UI 显示正确
- [x] 动态 UI 交互正常
- [x] 存档加载后数据正确恢复
- [x] updateGameState 统一更新正常工作
- [x] 动态 UI 测试功能正常工作
- [x] 状态调试功能正常工作
- [x] Markdown 预览功能正常工作
- [x] WebSocket 模拟器功能正常工作
- [x] 数据流转监控功能正常工作

## 文档更新

- [x] docs/development.md 已更新动态 UI 生成系统记录
- [x] updateGameState 统一更新方法说明已记录
- [x] 开发者工具使用说明已记录
