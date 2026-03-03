# Tasks

## Task 1: 统一类型定义整理
- [x] SubTask 1.1: 审查现有类型定义，识别分散的类型
- [x] SubTask 1.2: 创建 `packages/shared/src/types/api.ts` 统一 API 响应类型
- [x] SubTask 1.3: 创建 `packages/shared/src/types/error.ts` 统一错误类型
- [x] SubTask 1.4: 更新各服务的类型导入，使用共享类型
- [x] SubTask 1.5: 运行类型检查确保无错误

## Task 2: 统一错误处理机制
- [x] SubTask 2.1: 创建 `packages/backend/src/middleware/errorHandler.ts` 错误处理中间件
- [x] SubTask 2.2: 创建 `packages/backend/src/utils/errors.ts` 自定义错误类
- [x] SubTask 2.3: 更新所有路由使用错误处理中间件
- [x] SubTask 2.4: 前端创建统一错误处理服务
- [x] SubTask 2.5: 运行类型检查确保无错误

## Task 3: 统一 API 响应格式
- [x] SubTask 3.1: 创建 `packages/backend/src/utils/response.ts` 响应格式化工具
- [x] SubTask 3.2: 更新所有路由使用统一响应格式
- [x] SubTask 3.3: 前端服务层适配新响应格式
- [x] SubTask 3.4: 运行类型检查确保无错误

## Task 4: 完善数据流转日志
- [x] SubTask 4.1: 审查所有服务，识别缺少日志的关键操作
- [x] SubTask 4.2: 为 CharacterGenerationService 添加详细日志
- [x] SubTask 4.3: 为 TemplateService 添加详细日志
- [x] SubTask 4.4: 为 SaveService 添加详细日志
- [x] SubTask 4.5: 为 ContextService 添加详细日志
- [x] SubTask 4.6: 为 SettingsService 添加详细日志
- [x] SubTask 4.7: 为所有路由添加请求/响应日志中间件
- [x] SubTask 4.8: 运行类型检查确保无错误

## Task 5: 更新项目规则文档
- [x] SubTask 5.1: 在 `project_rules.md` 添加类型定义规范
- [x] SubTask 5.2: 在 `project_rules.md` 添加错误处理规范
- [x] SubTask 5.3: 在 `project_rules.md` 添加 API 响应格式规范
- [x] SubTask 5.4: 在 `project_rules.md` 添加日志记录规范

## Task 6: 游戏测试
- [x] SubTask 6.1: 启动前后端服务
- [x] SubTask 6.2: 测试角色创建流程
- [x] SubTask 6.3: 测试对话系统
- [x] SubTask 6.4: 测试战斗系统
- [x] SubTask 6.5: 测试开发者工具日志显示
- [x] SubTask 6.6: 验证错误处理和响应格式

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] 可以与 Task 1-3 并行
- [Task 5] depends on [Task 1, Task 2, Task 3]
- [Task 6] depends on [Task 1, Task 2, Task 3, Task 4, Task 5]
