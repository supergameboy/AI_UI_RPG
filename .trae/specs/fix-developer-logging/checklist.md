# Checklist

## 日志修复
- [x] LogViewer 使用 developerStore.logs 作为数据源
- [x] 日志正确显示来自 WebSocket 的消息
- [x] 清空日志功能正常工作

## Token 类型
- [x] TokenUsageRecord 接口已定义
- [x] TokenStatistics 接口已定义
- [x] DEFAULT_PRICING 常量已定义

## Token 服务
- [x] TokenUsageService.ts 已创建
- [x] LLMService 已集成 Token 记录
- [x] tokenRoutes.ts 已创建
- [x] 路由已注册

## 前端 Token 面板
- [x] tokenService.ts 已创建
- [x] TokenUsagePanel.tsx 已创建
- [x] DeveloperPanel 已添加 Token 标签页
- [x] developerStore 已更新类型

## 类型检查
- [x] 前端类型检查通过
- [x] 后端类型检查通过

## 功能验证
- [ ] 日志面板正确显示日志（需要手动测试）
- [ ] Token 统计正确显示（需要手动测试）
- [ ] 费用计算正确（需要手动测试）
