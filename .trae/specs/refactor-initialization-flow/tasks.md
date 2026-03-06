# Tasks

## 任务 1: 修复初始化服务模板数据使用
- [x] Task 1.1: 修复 `executeSceneStep` 方法，正确使用模板的 `startingScene` 配置
- [x] Task 1.2: 修复 `executeQuestsStep` 方法，正确使用模板的 `initialQuests` 配置
- [x] Task 1.3: 修复 `executeNPCsStep` 方法，正确使用模板的 `initialNPCs` 配置
- [x] Task 1.4: 修复 `executeInventoryStep` 方法，正确使用模板的 `startingScene.items` 配置
- [x] Task 1.5: 修复 `executeSkillsStep` 方法，正确使用模板的技能配置

## 任务 2: 修复初始化路由默认模板
- [x] Task 2.1: 移除 `createDefaultTemplate()` 中的硬编码"新手村"内容
- [x] Task 2.2: 使默认模板使用通用配置，不包含特定世界观内容

## 任务 3: 实现初始化数据同步到前端
- [x] Task 3.1: 修改初始化 API 响应，包含所有初始化数据
- [x] Task 3.2: 修改前端初始化调用，正确处理返回的初始化数据
- [x] Task 3.3: 更新 gameStore 以支持批量设置初始化数据

## 任务 4: 实现 NPC 面板功能
- [x] Task 4.1: 创建 `NPCPanel.tsx` 组件
- [x] Task 4.2: 实现 NPC 列表显示
- [x] Task 4.3: 实现 NPC 详细信息展示
- [x] Task 4.4: 实现好感度显示（如适用）
- [x] Task 4.5: 更新 `PanelContainer.tsx` 使用新的 NPCPanel

## 任务 5: 实现记录面板功能
- [x] Task 5.1: 创建 `JournalPanel.tsx` 组件
- [x] Task 5.2: 实现对话历史显示
- [x] Task 5.3: 实现重要事件记录
- [x] Task 5.4: 更新 `PanelContainer.tsx` 使用新的 JournalPanel

## 任务 6: 实现地图面板功能
- [x] Task 6.1: 创建 `MapPanel.tsx` 组件
- [x] Task 6.2: 实现世界地图显示
- [x] Task 6.3: 实现已探索区域标记
- [x] Task 6.4: 实现当前位置标记
- [x] Task 6.5: 更新 `PanelContainer.tsx` 使用新的 MapPanel

## 任务 7: 消除重复场景生成
- [x] Task 7.1: 审查初始化服务和 dialogueRoutes 的场景生成逻辑
- [x] Task 7.2: 统一场景生成入口点
- [x] Task 7.3: 确保场景数据正确传递到前端

## 任务 8: 类型检查和测试
- [x] Task 8.1: 运行前端类型检查
- [x] Task 8.2: 运行后端类型检查
- [ ] Task 8.3: 验证现代都市恋爱模板初始化流程
- [ ] Task 8.4: 验证中世纪奇幻模板初始化流程

# Task Dependencies

- [Task 3] depends on [Task 1] - 数据同步需要先修复初始化服务
- [Task 4] depends on [Task 3] - NPC面板需要正确的NPC数据
- [Task 5] depends on [Task 3] - 记录面板需要正确的对话数据
- [Task 6] depends on [Task 3] - 地图面板需要正确的地图数据
- [Task 7] depends on [Task 1] - 场景生成统一需要先修复初始化服务
- [Task 8] depends on [Task 1-7] - 测试需要在所有修改完成后进行
