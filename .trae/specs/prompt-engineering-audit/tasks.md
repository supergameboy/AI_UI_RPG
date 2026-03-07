# Tasks

## 阶段一：提示词统一

- [x] Task 1: 更新 `prompts/ui.md` 添加完整动态UI语法
  - [x] 1.1 添加悬浮提示 `[text](tooltip:content)` 完整说明
  - [x] 1.2 添加 `UIDataTool.updateGameState` 使用说明
  - [x] 1.3 添加所有组件的完整示例
  - [x] 1.4 添加新增组件类型语法（skill-tree, quest-tracker 等）
  - [x] 1.5 添加扩展的条件渲染语法说明

- [x] Task 2: 移除 Agent 类中的 systemPrompt 硬编码
  - [x] 2.1 移除 `UIAgent.ts` 中的 `DYNAMIC_UI_SYSTEM_PROMPT`
  - [x] 2.2 移除 `UIAgent.ts` 中的 `systemPrompt` 属性
  - [x] 2.3 移除 `DialogueAgent.ts` 中的 `systemPrompt` 属性
  - [x] 2.4 移除 `CombatAgent.ts` 中的 `systemPrompt` 属性
  - [x] 2.5 移除 `CoordinatorAgent.ts` 中的 `systemPrompt` 属性
  - [x] 2.6 移除其他 Agent 中的重复定义（InventoryAgent, SkillAgent, EventAgent, MapAgent, NPCAgent, NumericalAgent, QuestAgent, StoryContextAgent）
  - [x] 2.7 移除 `AgentBase.ts` 中的抽象属性
  - [x] 2.8 移除 `shared/types/agent.ts` 中 `Agent` 接口的 `systemPrompt` 属性

- [x] Task 3: 更新 AgentConfigService 确保运行时加载 MD 文件
  - [x] 3.1 修改 `getSystemPrompt()` 方法优先从 MD 文件加载
  - [x] 3.2 添加 `loadPromptFromFile()` 方法
  - [x] 3.3 添加 Agent 类型到 MD 文件的映射
  - [x] 3.4 添加加载失败的错误处理

## 阶段二：动态UI扩展

- [x] Task 4: 扩展前端条件渲染解析器
  - [x] 4.1 实现比较运算符解析（>=, <=, >, <, ==, !=）
  - [x] 4.2 实现逻辑运算符解析（AND, OR, NOT）
  - [x] 4.3 实现 else 分支支持
  - [x] 4.4 添加数值比较条件（level, gold, reputation）
  - [x] 4.5 添加阵营检查条件

- [x] Task 5: 实现新增组件类型
  - [x] 5.1 实现 `skill-tree` 组件
  - [x] 5.2 实现 `quest-tracker` 组件
  - [x] 5.3 实现 `minimap` 组件
  - [x] 5.4 实现 `character-status` 组件
  - [x] 5.5 实现 `dialogue-history` 组件

- [x] Task 6: 更新后端动态UI生成提示词
  - [x] 6.1 更新 `prompts/ui.md` 添加新组件说明
  - [x] 6.2 UIAgent.generateDynamicUI 使用 AgentConfigService 获取提示词

## 阶段三：技术债务修复

- [x] Task 7: 实现 CombatAgent.executeItem 与 InventoryAgent 集成
  - [x] 7.1 添加 INVENTORY Agent 绑定
  - [x] 7.2 调用 InventoryAgent 检查并消耗物品
  - [x] 7.3 应用物品效果到战斗单位
  - [x] 7.4 移除 TODO 注释

- [x] Task 8: 统一所有 Agent 使用 gameLog
  - [x] 8.1 替换 `DialogueAgent.ts` 中的 `console.error`
  - [x] 8.2 替换 `CombatAgent.ts` 中的 `console.error`
  - [x] 8.3 检查并替换其他 Agent 中的 console 调用

- [x] Task 9: 消除硬编码默认值
  - [x] 9.1 创建 `packages/backend/src/constants/combat.ts` 定义默认战斗属性常量
  - [x] 9.2 修改 `CombatAgent.handleInitiateCombat` 使用常量和参数

- [x] Task 10: 提取 AgentBase 公共方法
  - [x] 10.1 添加 `parseJsonResponse<T>()` 方法
  - [x] 10.2 添加 `handleLLMError()` 方法

## 阶段四：代码质量改进

- [x] Task 11: 定义常量替代魔法数字
  - [x] 11.1 创建 `packages/backend/src/constants/agent.ts` 定义 Agent 相关常量
  - [x] 11.2 更新 `packages/backend/src/constants/combat.ts` 添加战斗常量
  - [x] 11.3 替换 AgentBase 中的魔法数字
  - [x] 11.4 替换 CombatAgent 中的魔法数字

- [x] Task 12: 添加运行时类型验证（已集成到 parseJsonResponse）

- [x] Task 13: 整合类型定义
  - [x] 13.1 更新 `shared/types/agent.ts` 移除 systemPrompt

- [x] Task 14: 验证类型检查通过
  - [x] 14.1 后端类型检查通过
  - [x] 14.2 前端类型检查通过

# Task Dependencies

- Task 2 依赖 Task 1（先更新 MD 文件再移除硬编码）✓
- Task 3 依赖 Task 2 ✓
- Task 5 可与 Task 4 并行执行 ✓
- Task 6 依赖 Task 4 和 Task 5 ✓
- Task 7-10 可并行执行 ✓
- Task 11-14 可并行执行 ✓
