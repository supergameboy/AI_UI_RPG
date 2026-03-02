# Tasks

## Task 1: 在对话路由中添加日志
- [x] SubTask 1.1: 修改 `dialogueRoutes.ts`
  - 导入 `gameLog` 
  - 在 `/initial` 端点添加日志
  - 在 `/send` 端点添加日志
  - 记录请求参数、LLM 调用、响应、错误

## Task 2: 在 LLMService 中添加日志
- [x] SubTask 2.1: 修改 `LLMService.ts`
  - 导入 `gameLog`
  - 在 `chat` 方法中添加日志
  - 在 `chatStream` 方法中添加日志
  - 记录提供商、模型、Token、耗时

## Task 3: 在战斗服务中添加日志
- [x] SubTask 3.1: 修改 `CombatService.ts`
  - 导入 `gameLog`
  - 在 `initiateCombat` 添加日志
  - 在 `executeAction` 添加日志
  - 在 `executeAITurn` 添加日志
  - 记录战斗状态变化、伤害计算

## Task 4: 在数值服务中添加日志
- [x] SubTask 4.1: 修改 `NumericalService.ts`
  - 导入 `gameLog`
  - 在属性计算方法添加日志
  - 在伤害计算方法添加日志

## Task 5: 在背包服务中添加日志
- [x] SubTask 5.1: 修改 `InventoryService.ts`
  - 导入 `gameLog`
  - 在物品操作方法添加日志
  - 记录物品获取、使用、丢弃

## Task 6: 在任务服务中添加日志
- [x] SubTask 6.1: 修改 `QuestService.ts`
  - 导入 `gameLog`
  - 在任务创建、更新、完成时添加日志

## Task 7: 在地图服务中添加日志
- [x] SubTask 7.1: 修改 `MapService.ts`
  - 导入 `gameLog`
  - 在位置变更、场景切换时添加日志

## Task 8: 类型检查与测试
- [x] SubTask 8.1: 运行后端类型检查
- [ ] SubTask 8.2: 测试日志显示功能

# Task Dependencies

- Task 2-7 可并行执行
- Task 8 依赖所有前置任务
