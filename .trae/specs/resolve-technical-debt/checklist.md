# Checklist

## 类型定义统一
- [x] `packages/shared/src/types/api.ts` 包含统一的 API 响应类型定义
- [x] `packages/shared/src/types/error.ts` 包含统一的错误类型定义
- [x] 所有服务使用共享类型，无本地重复定义
- [x] 类型检查通过：`pnpm -r run typecheck`

## 错误处理统一
- [x] `packages/backend/src/middleware/errorHandler.ts` 错误处理中间件已创建
- [x] `packages/backend/src/utils/errors.ts` 自定义错误类已创建
- [x] 所有路由使用统一错误处理中间件
- [x] 前端有统一的错误处理服务
- [x] 错误响应格式统一：`{ success: false, error: { code, message } }`

## API 响应格式统一
- [x] `packages/backend/src/utils/response.ts` 响应格式化工具已创建
- [x] 所有 API 路由返回统一格式响应
- [x] 成功响应格式统一：`{ success: true, data, meta? }`
- [x] 前端服务层正确解析新响应格式

## 日志记录完善
- [x] CharacterGenerationService 关键操作有日志记录
- [x] TemplateService 关键操作有日志记录
- [x] SaveService 关键操作有日志记录
- [x] ContextService 关键操作有日志记录
- [x] SettingsService 关键操作有日志记录
- [x] 所有 API 路由有请求/响应日志

## 项目规则文档
- [x] `project_rules.md` 包含类型定义规范
- [x] `project_rules.md` 包含错误处理规范
- [x] `project_rules.md` 包含 API 响应格式规范
- [x] `project_rules.md` 包含日志记录规范

## 游戏测试
- [x] 前后端服务正常启动
- [x] 角色创建流程正常
- [x] 对话系统正常
- [x] 战斗系统正常
- [x] 开发者工具日志正常显示
- [x] 错误处理和响应格式正确
