# Technical Debt Audit Checklist

## Phase 1: P0 紧急问题

- [x] 战斗胜利后物品奖励正确添加到玩家背包
- [x] 故事条件检查逻辑正确实现并集成
- [x] 故事效果应用逻辑正确实现并集成
- [x] 技能属性要求检查正确实现

## Phase 2: P1 高优先级问题

- [x] 事件分支选择基于条件而非固定选择第一个
- [x] 技能前置条件检查完整实现
- [x] 任务声望奖励正确发放
- [x] 任务自定义奖励框架实现

## Phase 3: P2 代码质量

- [x] 前端所有 `as any` 类型断言已修复
- [x] 后端所有 `as any` 类型断言已修复
- [x] 前端日志统一使用 gameLog
- [x] 后端日志统一使用 gameLog
- [x] 所有 eslint-disable 注释已审查和处理

## Phase 4: P3 优化改进

- [x] 硬编码常量已提取为配置
- [x] 简化实现已完善

## Phase 5: 异常设计

- [x] 所有 throw new Error 已替换为自定义错误类
- [x] 错误信息清晰且国际化友好

## 验证测试

- [x] TypeScript 类型检查通过 (`pnpm -r run typecheck`)
- [ ] ESLint 检查通过
- [ ] 战斗系统测试通过
- [ ] 任务系统测试通过
- [ ] 技能系统测试通过
- [ ] 故事系统测试通过

## 文档更新

- [ ] 更新 docs/development.md 记录修复内容
- [ ] 更新 docs/todo.md 移除已完成项
