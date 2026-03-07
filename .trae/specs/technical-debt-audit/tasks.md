# Tasks

## Phase 1: P0 紧急问题修复

- [x] Task 1: 修复战斗胜利物品奖励未添加到背包
  - [x] SubTask 1.1: 在 gameStore.ts 中实现物品添加到背包的逻辑
  - [x] SubTask 1.2: 调用 inventoryService.addItem 方法
  - [x] SubTask 1.3: 添加单元测试验证

- [x] Task 2: 实现故事条件检查逻辑
  - [x] SubTask 2.1: 设计条件检查接口
  - [x] SubTask 2.2: 实现属性条件检查
  - [x] SubTask 2.3: 实现物品条件检查
  - [x] SubTask 2.4: 实现任务状态条件检查
  - [x] SubTask 2.5: 集成到 StoryService.checkConditions

- [x] Task 3: 实现故事效果应用逻辑
  - [x] SubTask 3.1: 设计效果应用接口
  - [x] SubTask 3.2: 实现属性变化效果
  - [x] SubTask 3.3: 实现物品获取/失去效果
  - [x] SubTask 3.4: 实现任务触发效果
  - [x] SubTask 3.5: 集成到 StoryService.applyEffects

- [x] Task 4: 实现技能属性要求检查
  - [x] SubTask 4.1: 在 SkillAgent 中调用 NUMERICAL agent
  - [x] SubTask 4.2: 实现属性要求验证方法
  - [x] SubTask 4.3: 返回详细的检查结果

## Phase 2: P1 高优先级问题修复

- [x] Task 5: 实现事件分支条件选择
  - [x] SubTask 5.1: 设计分支条件评估逻辑
  - [x] SubTask 5.2: 实现条件评分机制
  - [x] SubTask 5.3: 选择最优分支而非第一个

- [x] Task 6: 完善技能前置条件检查
  - [x] SubTask 6.1: 实现完整的属性检查
  - [x] SubTask 6.2: 实现前置技能检查
  - [x] SubTask 6.3: 返回详细的检查失败原因

- [x] Task 7: 实现任务奖励完整发放
  - [x] SubTask 7.1: 设计声望系统接口
  - [x] SubTask 7.2: 实现声望奖励发放
  - [x] SubTask 7.3: 实现自定义奖励处理框架

## Phase 3: P2 代码质量改进

- [x] Task 8: 修复前端 `as any` 类型断言
  - [x] SubTask 8.1: QuestEditor.tsx 类型修复
  - [x] SubTask 8.2: NPCEditor.tsx 类型修复
  - [x] SubTask 8.3: StartingSceneEditor.tsx 类型修复
  - [x] SubTask 8.4: OptionCard.tsx 类型修复
  - [x] SubTask 8.5: TemplateEditor.tsx 类型修复

- [x] Task 9: 修复后端 `as any` 类型断言
  - [x] SubTask 9.1: AIGenerateService.ts 类型修复
  - [x] SubTask 9.2: 定义正确的接口类型

- [x] Task 10: 统一日志系统
  - [x] SubTask 10.1: 前端 gameStore.ts 日志迁移
  - [x] SubTask 10.2: 前端 MapPanel.tsx 日志迁移
  - [x] SubTask 10.3: 前端 MainMenu.tsx 日志迁移
  - [x] SubTask 10.4: 后端 QuestService.ts 日志迁移
  - [x] SubTask 10.5: 后端 combatRoutes.ts 日志迁移
  - [x] SubTask 10.6: 后端 dialogueRoutes.ts 日志迁移

- [x] Task 11: 处理 eslint-disable 注释
  - [x] SubTask 11.1: 审查每个 eslint-disable 的必要性
  - [x] SubTask 11.2: 修复不必要的依赖数组问题

## Phase 4: P3 优化改进

- [x] Task 12: 提取硬编码常量
  - [x] SubTask 12.1: 战斗恢复比例提取为配置
  - [x] SubTask 12.2: 经验值计算公式提取为配置
  - [x] SubTask 12.3: 默认资源值提取为配置

- [x] Task 13: 完善简化实现
  - [x] SubTask 13.1: 完善种族职业加成计算
  - [x] SubTask 13.2: 完善装备加成提取逻辑
  - [x] SubTask 13.3: 完善技能效果计算

## Phase 5: 异常设计改进

- [x] Task 14: 统一异常处理
  - [x] SubTask 14.1: 审查所有 throw new Error 调用
  - [x] SubTask 14.2: 替换为自定义错误类
  - [x] SubTask 14.3: 确保错误信息国际化友好

# Task Dependencies

- Task 2 和 Task 3 可以并行执行
- Task 4 依赖 Task 2 的条件检查接口
- Task 5 和 Task 6 可以并行执行
- Task 8 和 Task 9 可以并行执行
- Task 10 的各子任务可以并行执行
- Task 11 可以与其他任务并行执行
- Task 12 和 Task 13 可以并行执行
