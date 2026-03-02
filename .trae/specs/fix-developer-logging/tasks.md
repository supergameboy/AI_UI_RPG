# Tasks

## Task 1: 修复 LogViewer 数据源
- [x] SubTask 1.1: 修改 `LogViewer.tsx` 使用 `developerStore.logs`
  - 移除 `logService.subscribe()` 调用
  - 使用 `useDeveloperStore((state) => state.logs)`
  - 清空日志使用 `clearLogs()` action

## Task 2: 添加 Token 类型定义
- [x] SubTask 2.1: 创建 `packages/shared/src/types/developer.ts`
  - TokenUsageRecord 接口
  - TokenStatistics 接口
  - DEFAULT_PRICING 常量

## Task 3: 创建 Token 计费服务
- [x] SubTask 3.1: 创建 `packages/backend/src/services/TokenUsageService.ts`
  - recordUsage 方法
  - getStatistics 方法
  - calculateCost 方法
- [ ] SubTask 3.2: 在 `LLMService.ts` 中集成 Token 记录

## Task 4: 创建 Token API 路由
- [x] SubTask 4.1: 创建 `packages/backend/src/routes/tokenRoutes.ts`
  - GET /api/token/statistics
  - GET /api/token/usage
  - POST /api/token/reset
- [ ] SubTask 4.2: 在 index.ts 中注册路由

## Task 5: 创建前端 Token 服务和面板
- [x] SubTask 5.1: 创建 `packages/frontend/src/services/tokenService.ts`
- [ ] SubTask 5.2: 创建 `packages/frontend/src/components/developer/TokenUsagePanel.tsx`
- [ ] SubTask 5.3: 创建样式文件

## Task 6: 集成到开发者工具
- [x] SubTask 6.1: 修改 `developerStore.ts` 添加 'tokens' 标签类型
- [ ] SubTask 6.2: 修改 `DeveloperPanel.tsx` 添加 Token 标签页

## Task 7: 类型检查与测试
- [x] SubTask 7.1: 运行前端类型检查
- [x] SubTask 7.2: 运行后端类型检查
- [ ] SubTask 7.3: 测试日志显示功能
- [ ] SubTask 7.4: 测试 Token 统计功能

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 4
- Task 6 依赖 Task 5
- Task 7 依赖所有前置任务
