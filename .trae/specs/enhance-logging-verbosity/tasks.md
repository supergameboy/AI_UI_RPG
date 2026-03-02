# Tasks

## Task 1: 增强 LLMService 日志详细程度
- [x] SubTask 1.1: 修改 `LLMService.ts`
  - 在 `chat` 方法中添加完整 messages 和 response 日志
  - 实现内容截断函数 `truncateContent`
  - 使用 debug 级别记录详细内容

## Task 2: 增强对话路由日志详细程度
- [x] SubTask 2.1: 修改 `dialogueRoutes.ts`
  - 记录完整的请求体（玩家输入）
  - 记录完整的响应体（LLM 输出）
  - 记录完整的 systemPrompt（debug 级别）

## Task 3: 增强战斗服务日志详细程度
- [x] SubTask 3.1: 修改 `CombatService.ts`
  - 记录完整的战斗单位数据
  - 记录伤害计算详情
  - 记录 AI 决策过程

## Task 4: 增强其他服务日志详细程度
- [x] SubTask 4.1: 修改 `NumericalService.ts` - 记录计算公式和中间值
- [x] SubTask 4.2: 修改 `InventoryService.ts` - 记录物品完整信息
- [x] SubTask 4.3: 修改 `QuestService.ts` - 记录任务完整信息
- [x] SubTask 4.4: 修改 `MapService.ts` - 记录位置完整信息

## Task 5: 类型检查与测试
- [x] SubTask 5.1: 运行后端类型检查
- [ ] SubTask 5.2: 测试日志显示功能

# Task Dependencies

- Task 1-4 可并行执行
- Task 5 依赖所有前置任务
