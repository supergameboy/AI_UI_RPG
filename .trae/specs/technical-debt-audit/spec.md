# 技术债务全面审查报告 Spec

## Why
项目代码中存在大量未完成的功能标记（TODO）、简化实现、类型安全问题（`as any`）、不规范日志使用等技术债务，影响代码质量和可维护性。需要进行系统、完整、专业的审查，出具标准审查报告，并制定解决方案。

## What Changes
- 审查并记录所有技术债务问题
- 分类整理问题严重程度
- 制定解决方案和优先级
- 特别关注：技术债务、异常设计、占位符实现、提示词工程

## Impact
- Affected code: 前端、后端、智能体提示词
- 涉及文件数量: 50+ 文件

---

## 审查发现汇总

### 一、TODO 标记（未完成任务）- 9 处

| 文件 | 行号 | 问题描述 | 严重程度 |
|------|------|----------|----------|
| `gameStore.ts` | 1022 | TODO: 将物品添加到背包 | 高 |
| `SkillAgent.ts` | 983 | TODO: 调用 NUMERICAL agent 检查属性要求 | 高 |
| `SkillAgent.ts` | 1686 | TODO: 调用 NUMERICAL agent 检查详细要求 | 中 |
| `SkillAgent.ts` | 1921 | TODO: 调用 NUMERICAL agent 进行详细计算 | 高 |
| `StoryService.ts` | 1230 | TODO: 实现条件检查逻辑 | 高 |
| `StoryService.ts` | 1239 | TODO: 实现效果应用逻辑 | 高 |
| `QuestService.ts` | 605 | TODO: 发放声望奖励 | 中 |
| `QuestService.ts` | 606 | TODO: 发放自定义奖励 | 中 |
| `SkillService.ts` | 517 | TODO: 集成角色资源检查 | 中 |

### 二、简化处理/简化实现 - 9 处

| 文件 | 行号 | 问题描述 | 严重程度 |
|------|------|----------|----------|
| `SkillAgent.ts` | 981 | 检查前置条件简化处理，未检查角色属性 | 高 |
| `SkillAgent.ts` | 1118 | 技能解锁逻辑简化，需要更复杂的解锁逻辑 | 中 |
| `SkillAgent.ts` | 1885 | 等级缩放逻辑简化 | 低 |
| `NumericalAgent.ts` | 539 | 种族和职业加成简化实现 | 中 |
| `NumericalAgent.ts` | 2087 | 装备加成提取简化实现 | 中 |
| `EventAgent.ts` | 1464 | 事件分支选择简化，只选第一个分支 | 高 |
| `QuestService.ts` | 580, 600 | 使用 saveId 作为 characterId 简化处理 | 中 |
| `SkillService.ts` | 437 | 技能效果计算简化 | 中 |

### 三、`as any` 类型断言（类型安全） - 21 处

#### 前端文件
| 文件 | 行号 | 问题描述 |
|------|------|----------|
| `QuestEditor.tsx` | 239, 280 | 类型断言绕过类型检查 |
| `NPCEditor.tsx` | 105, 107, 207, 210 | 服务类型断言 |
| `StartingSceneEditor.tsx` | 211 | 图标类型断言 |
| `OptionCard.tsx` | 104 | feature 类型断言 |
| `TemplateEditor.tsx` | 514 | 图标类型断言 |

#### 后端文件
| 文件 | 行号 | 问题描述 |
|------|------|----------|
| `AIGenerateService.ts` | 705, 731, 742, 753, 758, 850, 876, 902, 917 | 多处 any 类型使用 |

### 四、console.log/warn/error 使用（应使用 gameLog）- 50+ 处

#### 前端文件（应使用 gameLog）
- `gameStore.ts`: 5 处
- `MapPanel.tsx`: 4 处
- `MainMenu.tsx`: 4 处
- `RequestMonitor.tsx`: 1 处
- `DataSimulatorPanel.tsx`: 4 处

#### 后端文件（应使用 gameLog）
- `initializeTools.ts`: 1 处
- `initializer.ts`: 8 处
- `QuestService.ts`: 10 处
- `combatRoutes.ts`: 11 处
- `dialogueRoutes.ts`: 3 处

### 五、eslint-disable 注释 - 11 处

| 文件 | 行号 | 禁用规则 |
|------|------|----------|
| `DynamicUIPanel.tsx` | 133 | react-hooks/exhaustive-deps |
| `StateInspector.tsx` | 137, 146 | react-hooks/exhaustive-deps |
| `ToolStatusPanel.tsx` | 82 | react-hooks/exhaustive-deps |
| `DecisionLogViewer.tsx` | 71, 78 | react-hooks/exhaustive-deps |
| `RaceSelectionStep.tsx` | 44 | react-hooks/exhaustive-deps |
| `ClassSelectionStep.tsx` | 45 | react-hooks/exhaustive-deps |
| `CharacterConfirmStep.tsx` | 35 | react-hooks/exhaustive-deps |
| `BindingConfigPanel.tsx` | 42 | react-hooks/exhaustive-deps |

### 六、模拟数据文件（开发测试用）

| 文件 | 用途 | 是否需要保留 |
|------|------|--------------|
| `mockGameService.ts` | 前端模拟游戏服务 | 是（开发测试用） |
| `mockGameData.ts` | 模拟游戏数据 | 是（开发测试用） |
| `mockDataTemplates.ts` | 数据模拟模板 | 是（开发测试用） |

### 七、硬编码值/魔法数字

| 文件 | 行号 | 问题描述 |
|------|------|----------|
| `gameStore.ts` | 1046 | `0.3` - 战斗失败恢复30%生命值 |
| `CharacterPanel.tsx` | 37 | `level * 100` - 经验值计算公式硬编码 |
| `SkillAgent.ts` | 1946-1950 | 默认资源值硬编码 `mana: 100, health: 100, stamina: 100` |

### 八、注意事项/警告注释

| 文件 | 行号 | 描述 |
|------|------|------|
| `CoordinatorAgent.ts` | 152 | 注意：需要确保 data 包含完整的 Character 和 GameTemplate |

---

## 问题分类与优先级

### P0 - 紧急（影响核心功能）

1. **战斗胜利后物品奖励未添加到背包** (`gameStore.ts:1022`)
   - 影响：玩家战斗胜利后无法获得物品奖励
   - 解决方案：实现 `addItemToInventory` 方法调用

2. **故事条件检查和效果应用未实现** (`StoryService.ts:1230, 1239`)
   - 影响：故事分支逻辑无法正常工作
   - 解决方案：实现条件检查和效果应用逻辑

3. **技能属性要求检查未实现** (`SkillAgent.ts:983, 1686, 1921`)
   - 影响：玩家可能学习不满足条件的技能
   - 解决方案：调用 NUMERICAL agent 进行属性检查

### P1 - 高优先级（影响游戏体验）

1. **事件分支选择简化** (`EventAgent.ts:1464`)
   - 影响：事件分支总是选择第一个选项
   - 解决方案：实现基于条件的分支选择逻辑

2. **技能前置条件检查简化** (`SkillAgent.ts:981`)
   - 影响：技能学习不检查角色属性
   - 解决方案：实现完整的属性检查

3. **任务奖励不完整** (`QuestService.ts:605, 606`)
   - 影响：声望和自定义奖励未发放
   - 解决方案：实现声望系统和自定义奖励发放

### P2 - 中优先级（代码质量）

1. **`as any` 类型断言** - 21 处
   - 影响：类型安全，潜在运行时错误
   - 解决方案：定义正确的类型接口

2. **console.log 使用** - 50+ 处
   - 影响：日志不统一，难以追踪
   - 解决方案：统一使用 gameLog

3. **eslint-disable 注释** - 11 处
   - 影响：可能隐藏依赖问题
   - 解决方案：正确处理依赖数组

### P3 - 低优先级（优化改进）

1. **硬编码魔法数字**
   - 影响：可维护性
   - 解决方案：提取为常量或配置

2. **简化实现待优化**
   - 影响：功能完整性
   - 解决方案：逐步完善实现

---

## 智能体提示词工程审查

### 审查范围
- `packages/backend/src/prompts/` 目录下所有 `.md` 和 `.ts` 文件

### 发现问题

1. **提示词文件结构良好**：每个智能体都有独立的提示词文件
2. **模块化设计**：`modules/` 目录包含可复用的提示词模块
3. **示例丰富**：`examples/` 目录包含详细的调用示例

### 待改进项

1. **部分提示词缺少错误处理指导**
2. **工具调用格式需要更严格的校验说明**
3. **冲突解决优先级说明可以更详细**

---

## 异常设计审查

### 发现问题

1. **部分服务使用 `throw new Error()` 而非自定义错误类**
   - 应使用 `ValidationError`, `NotFoundError`, `LLMError` 等自定义错误类

2. **前端错误处理不一致**
   - 部分组件直接使用 `console.error`
   - 应统一使用 `gameLog.error`

---

## ADDED Requirements

### Requirement: 技术债务清理
系统 SHALL 清理所有标记为 TODO、简化处理、简化实现的代码，确保功能完整性。

#### Scenario: 战斗奖励物品添加
- **WHEN** 玩家战斗胜利获得物品奖励
- **THEN** 物品应正确添加到玩家背包

#### Scenario: 故事条件检查
- **WHEN** 故事分支需要条件判断
- **THEN** 系统应正确检查角色属性、物品、任务状态等条件

#### Scenario: 技能学习属性检查
- **WHEN** 玩家尝试学习技能
- **THEN** 系统应检查玩家是否满足属性要求

### Requirement: 类型安全
系统 SHALL 移除所有 `as any` 类型断言，使用正确的类型定义。

### Requirement: 日志规范
系统 SHALL 统一使用 `gameLog` 进行日志记录，移除所有 `console.log/warn/error` 调用。

---

## 下一步行动

审查完成后，需要用户确认以下事项：

1. **优先级确认**：是否同意上述问题分类和优先级？
2. **解决方案确认**：是否需要针对特定问题详细讨论解决方案？
3. **实施范围**：是否一次性解决所有问题，还是按优先级分批处理？
