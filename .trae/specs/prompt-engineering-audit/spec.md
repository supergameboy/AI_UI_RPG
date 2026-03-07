# AI-RPG 提示词工程与代码质量审查报告

## Why
用户发现游戏智能体提示词工程混乱，Agent 文件夹和 prompts 文件夹中存在重复定义，需要进行系统、完整、专业的审查，识别技术债务、异常设计和占位符问题。

## What Changes
- 统一提示词来源为 `prompts/*.md` 文件（运行时加载）
- 同步动态UI使用方法到UIAgent提示词
- 扩展动态UI组件类型和条件渲染语法
- 修复所有技术债务（TODO、占位符、硬编码）
- 统一错误处理和日志记录
- 提取公共代码，消除重复模式

## Impact
- Affected code: 
  - `packages/backend/src/agents/*.ts` - 所有Agent实现
  - `packages/backend/src/prompts/*.md` - 所有提示词模板
  - `packages/backend/src/prompts/modules/*` - 模块化提示词系统
  - `packages/backend/src/services/AgentConfigService.ts` - Agent配置服务
  - `packages/backend/src/services/PromptService.ts` - 提示词服务
  - `packages/frontend/src/components/ui/dynamic-ui/*` - 动态UI组件

---

## 用户决策

| 问题 | 决策 |
|------|------|
| 提示词来源策略 | **选项A**：以 `prompts/*.md` 为唯一来源，运行时加载 |
| 动态UI组件扩展 | **是**，需要支持更多组件类型 |
| 条件渲染语法扩展 | **是**，需要扩展表达式语法 |
| 技术债务处理 | **全部处理**，不分优先级 |

---

## 审查发现

### 一、提示词工程架构问题

#### 1.1 提示词定义位置混乱

**问题描述**：提示词在四个不同位置定义，存在重复和不一致：

| 位置 | 文件 | 用途 | 问题 |
|------|------|------|------|
| Agent类内部 | `UIAgent.ts`, `DialogueAgent.ts` 等 | `systemPrompt` 属性 | 与MD文件内容重复 |
| prompts/*.md | `ui.md`, `dialogue.md` 等 | 模板文件 | 作为主要来源 |
| prompts/modules/ | `role.ts`, `context.ts` 等 | 模块化组件 | 部分Agent未使用 |
| AgentConfigService | `getDefaultSystemPrompt()` | 默认回退 | 简化版，与正式版不一致 |

**解决方案**：以 `prompts/*.md` 为唯一来源，移除其他位置的重复定义。

#### 1.2 动态UI组件语法未同步

**问题描述**：`UIAgent.ts` 中的 `DYNAMIC_UI_SYSTEM_PROMPT` 与 `prompts/ui.md` 中的定义不一致：

- `ui.md` 缺少悬浮提示 `[text](tooltip:content)` 的完整说明
- `DYNAMIC_UI_SYSTEM_PROMPT` 缺少 `UIDataTool.updateGameState` 使用说明
- 两者的输出要求描述不一致

**解决方案**：统一到 `prompts/ui.md`，移除 Agent 类中的硬编码。

---

### 二、技术债务

#### 2.1 TODO 注释和占位符实现

| 文件 | 行号 | 内容 | 修复方案 |
|------|------|------|----------|
| `CombatAgent.ts` | 1343 | `// TODO: 调用INVENTORY agent处理物品使用` | 实现与 InventoryAgent 集成 |
| `DialogueAgent.ts` | 1230 | `console.error` 而非 `gameLog` | 替换为 gameLog |
| `CombatAgent.ts` | 1183 | `console.error` 而非 `gameLog` | 替换为 gameLog |

#### 2.2 硬编码默认值

**问题描述**：多处使用硬编码默认值：

```typescript
// CombatAgent.ts 第426-445行 - 玩家单位硬编码
const playerUnit: CombatUnit = {
  id: params.playerId,
  name: 'Player',  // 硬编码
  level: 1,  // 硬编码
  stats: {
    maxHp: 100,  // 硬编码
    // ...
  },
};
```

**解决方案**：从数据库或配置文件获取，或通过参数传入。

#### 2.3 类型断言过多

**问题描述**：代码中存在大量类型断言，可能掩盖类型问题。

**解决方案**：添加运行时类型验证或使用更精确的类型定义。

---

### 三、代码质量问题

#### 3.1 错误处理不一致

**问题描述**：部分Agent使用 `console.error`，部分使用 `gameLog.error`。

**解决方案**：统一使用 `gameLog`。

#### 3.2 重复代码模式

**问题描述**：多个Agent中存在相似的解析和错误处理模式。

**解决方案**：提取为 `AgentBase` 的公共方法。

#### 3.3 魔法数字

**问题描述**：代码中存在未命名的常量。

**解决方案**：定义常量替代魔法数字。

---

## 动态UI组件扩展计划

### 新增组件类型

| 组件 | 语法 | 用途 |
|------|------|------|
| `:::skill-tree` | `:::skill-tree{...}` | 技能树展示 |
| `:::quest-tracker` | `:::quest-tracker{...}` | 任务追踪面板 |
| `:::minimap` | `:::minimap{...}` | 小地图组件 |
| `:::character-status` | `:::character-status{...}` | 角色状态面板 |
| `:::dialogue-history` | `:::dialogue-history{...}` | 对话历史记录 |

### 条件渲染语法扩展

当前语法：
```markdown
:::conditional{condition="hasItem:magic-key"}
内容
:::
```

扩展语法：
```markdown
<!-- 比较运算 -->
:::conditional{condition="level >= 10"}
内容
:::

<!-- 逻辑运算 -->
:::conditional{condition="hasItem:key AND hasSkill:lockpick"}
内容
:::

<!-- 数值比较 -->
:::conditional{condition="gold >= 100"}
内容
:::

<!-- 多条件组合 -->
:::conditional{condition="faction:thieves AND reputation >= 50"}
内容
:::

<!-- Else 分支 -->
:::conditional{condition="hasItem:magic-key"}
有钥匙的内容
:::else:
没有钥匙的内容
:::
```

支持的条件表达式：
- `hasItem:item_id` - 拥有物品
- `hasSkill:skill_id` - 拥有技能
- `hasQuest:quest_id` - 拥有任务
- `level >= N` - 等级比较
- `gold >= N` - 金币比较
- `faction:faction_id` - 阵营检查
- `reputation >= N` - 声望比较
- `AND`, `OR`, `NOT` - 逻辑运算

---

## 实施计划

### 阶段一：提示词统一

1. 更新 `prompts/ui.md` 添加完整动态UI语法
2. 移除 Agent 类中的 `systemPrompt` 硬编码
3. 更新 `AgentConfigService` 确保运行时加载 MD 文件
4. 移除 `AgentConfigService.getDefaultSystemPrompt()` 中的重复定义

### 阶段二：动态UI扩展

1. 扩展前端条件渲染解析器
2. 实现新增组件类型
3. 更新后端动态UI生成提示词

### 阶段三：技术债务修复

1. 实现 `CombatAgent.executeItem` 与 InventoryAgent 集成
2. 统一所有 Agent 使用 `gameLog`
3. 消除硬编码默认值
4. 提取 AgentBase 公共方法

### 阶段四：代码质量改进

1. 定义常量替代魔法数字
2. 添加运行时类型验证
3. 整合类型定义
4. 添加单元测试
