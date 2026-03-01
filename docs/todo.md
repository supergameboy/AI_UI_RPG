# AI-RPG Engine 待办事项

本文档记录已规划但尚未完成的功能和需要后续集成的任务。

---

## 一、已完成功能概览 (v0.4.0)

详见 [development.md](./development.md)

- 项目基础架构 (Monorepo + pnpm workspace)
- SQLite 数据库 (sql.js)
- LLM 适配器系统 (DeepSeek/GLM/Kimi/OpenAI)
- 前端 UI 框架 (React 18 + Zustand + CSS Modules)
- 存档系统
- 上下文管理系统 (四层压缩)
- 智能体系统 (12个智能体框架)
- 设置系统
- 开发者工具系统
- 提示词工程系统
- 故事模板系统 (4个预设模板)
- 角色创建系统

---

## 二、v0.5.0 版本计划 - 核心玩法系统

### Phase 1: 基础系统 (可并行开发)

#### 2.1.1 数值系统 (Numerical System)
**优先级**: P0 | **依赖**: 无 | **智能体**: NumericalAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 属性计算引擎 | 基础属性 + 种族加成 + 职业加成 + 装备加成 | 未开始 |
| 派生属性计算 | HP/MP/攻击/防御/速度/暴击等 | 未开始 |
| 等级成长系统 | 经验值曲线、升级奖励 | 未开始 |
| 伤害公式系统 | 物理伤害、魔法伤害、治疗公式 | 未开始 |
| API 路由 | `/api/numerical/*` | 未开始 |
| 前端面板 | CharacterPanel 属性显示 | 框架已创建 |

**关键文件**:
- `packages/backend/src/agents/NumericalAgent.ts` (已存在，需完善)
- `packages/backend/src/services/NumericalService.ts` (待创建)
- `packages/frontend/src/components/panels/CharacterPanel.tsx`

#### 2.1.2 背包系统 (Inventory System)
**优先级**: P0 | **依赖**: 无 | **智能体**: InventoryAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 物品数据模型 | Item 定义、物品模板 | 未开始 |
| 背包存储 | 容量限制、堆叠逻辑 | 未开始 |
| 物品操作 | 获取/使用/丢弃/移动 | 未开始 |
| 物品类型 | 消耗品/材料/任务物品/装备 | 未开始 |
| API 路由 | `/api/inventory/*` | 未开始 |
| 前端面板 | InventoryPanel 物品显示 | 框架已创建 |

**关键文件**:
- `packages/backend/src/agents/InventoryAgent.ts` (已存在，需完善)
- `packages/backend/src/services/InventoryService.ts` (待创建)
- `packages/backend/src/models/ItemRepository.ts` (待创建)
- `packages/frontend/src/components/panels/InventoryPanel.tsx`

#### 2.1.3 技能系统 (Skill System)
**优先级**: P0 | **依赖**: 无 | **智能体**: SkillAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 技能数据模型 | Skill 定义、技能模板 | 未开始 |
| 技能学习 | 学习条件、技能点消耗 | 未开始 |
| 技能冷却 | CD 管理、冷却计时 | 未开始 |
| 技能效果 | 效果类型、数值计算 | 未开始 |
| API 路由 | `/api/skills/*` | 未开始 |
| 前端面板 | SkillsPanel 技能显示 | 未创建 |

**关键文件**:
- `packages/backend/src/agents/SkillAgent.ts` (已存在，需完善)
- `packages/backend/src/services/SkillService.ts` (待创建)
- `packages/frontend/src/components/panels/SkillsPanel.tsx` (待创建)

---

### Phase 2: 依赖系统

#### 2.2.1 装备系统 (Equipment System)
**优先级**: P0 | **依赖**: 背包系统 + 数值系统 | **智能体**: InventoryAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 装备槽位 | 武器/头部/身体/脚部/饰品 | 未开始 |
| 装备穿戴 | 穿戴条件检查、槽位管理 | 未开始 |
| 装备卸下 | 卸下装备、返回背包 | 未开始 |
| 属性加成 | 装备属性应用到角色 | 未开始 |
| 前端面板 | EquipmentPanel 装备显示 | 未创建 |

**关键文件**:
- `packages/backend/src/services/EquipmentService.ts` (待创建)
- `packages/frontend/src/components/panels/EquipmentPanel.tsx` (待创建)

#### 2.2.2 任务系统 (Quest System)
**优先级**: P0 | **依赖**: 无 | **智能体**: QuestAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 任务数据模型 | Quest 定义、目标类型 | 未开始 |
| 任务生成 | 主线/支线/日常任务 | 未开始 |
| 任务追踪 | 目标进度、完成检测 | 未开始 |
| 任务奖励 | 经验/金币/物品奖励 | 未开始 |
| 任务链 | 前置任务、后续任务 | 未开始 |
| API 路由 | `/api/quests/*` | 未开始 |
| 前端面板 | QuestPanel 任务显示 | 框架已创建 |

**关键文件**:
- `packages/backend/src/agents/QuestAgent.ts` (已存在，需完善)
- `packages/backend/src/services/QuestService.ts` (待创建)
- `packages/frontend/src/components/panels/QuestPanel.tsx`

---

### Phase 3: 世界系统

#### 2.3.1 地图系统 (Map System)
**优先级**: P1 | **依赖**: 无 | **智能体**: MapAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 地图数据模型 | 世界/区域/地点层级 | 未开始 |
| 场景管理 | 当前场景、可探索区域 | 未开始 |
| 移动系统 | 地点切换、移动时间 | 未开始 |
| 场景事件 | 进入/离开事件触发 | 未开始 |
| 前端面板 | MapPanel 小地图 | 未创建 |

**关键文件**:
- `packages/backend/src/agents/MapAgent.ts` (已存在，需完善)
- `packages/backend/src/services/MapService.ts` (待创建)
- `packages/frontend/src/components/panels/MapPanel.tsx` (待创建)

#### 2.3.2 NPC系统 (NPC System)
**优先级**: P1 | **依赖**: 无 | **智能体**: NPCAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| NPC数据模型 | NPC 定义、性格、外观 | 未开始 |
| 关系系统 | 好感度、信任度 | 未开始 |
| NPC行为 | 日程、移动、互动 | 未开始 |
| 队伍系统 | 队友管理、战斗参与 | 未开始 |

**关键文件**:
- `packages/backend/src/agents/NPCAgent.ts` (已存在，需完善)
- `packages/backend/src/services/NPCService.ts` (待创建)

---

### Phase 4: 交互系统

#### 2.4.1 对话系统 (Dialogue System)
**优先级**: P1 | **依赖**: NPC系统 + 任务系统 | **智能体**: DialogueAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 对话生成 | NPC 响应、对话选项 | 未开始 |
| 对话历史 | 消息记录、上下文感知 | 未开始 |
| 对话类型 | 普通/任务/交易/战斗/浪漫 | 未开始 |
| 快速选项 | 动态生成 2-5 个选项 | 未开始 |
| 前端组件 | StoryDisplay/QuickOptions | 框架已创建 |

**关键文件**:
- `packages/backend/src/agents/DialogueAgent.ts` (已存在，需完善)
- `packages/backend/src/routes/dialogueRoutes.ts` (待创建)
- `packages/frontend/src/components/game/StoryDisplay.tsx`
- `packages/frontend/src/components/game/QuickOptions.tsx`

#### 2.4.2 战斗系统 (Combat System)
**优先级**: P2 | **依赖**: 数值+技能+装备 | **智能体**: CombatAgent

| 任务 | 描述 | 状态 |
|------|------|------|
| 回合制战斗 | 行动顺序、回合管理 | 未开始 |
| 战斗行动 | 攻击/技能/物品/逃跑 | 未开始 |
| 伤害计算 | 命中/闪避/暴击/伤害 | 未开始 |
| 战斗AI | 敌人行为决策 | 未开始 |
| 战斗奖励 | 经验/物品/金币 | 未开始 |

**关键文件**:
- `packages/backend/src/agents/CombatAgent.ts` (已存在，需完善)
- `packages/backend/src/services/CombatService.ts` (待创建)

---

### Phase 5: 游戏初始化

#### 2.5.1 角色创建后初始化流程
**优先级**: P0 | **依赖**: 所有基础系统

| 步骤 | 描述 | 状态 |
|------|------|------|
| 1. 数值初始化 | 计算初始属性、HP/MP | 未开始 |
| 2. 技能初始化 | 添加初始技能 | 未开始 |
| 3. 背包初始化 | 添加初始物品、金币 | 未开始 |
| 4. 装备初始化 | 自动装备初始装备 | 未开始 |
| 5. 任务初始化 | 创建隐藏主线任务 | 未开始 |
| 6. 地图初始化 | 设置初始场景 | 未开始 |
| 7. NPC初始化 | 加载场景NPC | 未开始 |
| 8. 初始场景对话 | 生成故事背景、快速选项 | 未开始 |

---

## 三、技术债务

### 3.1 类型定义整理

**问题**: 部分类型定义分散在多个文件中

**解决方案**: 
- 将共享类型移至 `packages/shared/src/types/`
- 统一导出和引用

### 3.2 错误处理统一

**问题**: 错误处理方式不统一

**解决方案**:
- 创建统一的错误处理中间件
- 定义标准错误类型
- 前端统一错误提示

### 3.3 API响应格式统一

**问题**: API响应格式不完全一致

**解决方案**:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    total?: number;
  };
}
```

---

## 四、架构决策记录

详见 [architecture-decisions.md](./architecture-decisions.md)

关键决策：
- **ADR-001**: UI Agent 仅处理 Markdown 动态组件
- **ADR-002**: 按依赖关系确定开发顺序
- **ADR-003**: 分步初始化流程
- **ADR-004**: 总分总智能体通信架构
- **ADR-005**: 增量存档 + 快照存档混合模式

---

## 五、版本迭代路线图

| 版本 | 目标 | 核心功能 |
|------|------|----------|
| v0.5.0 | 核心玩法 | 数值/背包/技能/装备/任务/对话 |
| v0.6.0 | 世界扩展 | 地图/NPC/战斗系统 |
| v0.7.0 | 内容丰富 | 更多模板/物品/技能 |
| v0.8.0 | 优化完善 | 性能/存档/测试 |
| v1.0.0 | 正式发布 | 完整游戏体验 |

---

## 六、开发优先级总览

```
P0 (必须): 数值系统 → 背包系统 → 技能系统 → 装备系统 → 任务系统 → 游戏初始化
P1 (重要): 地图系统 → NPC系统 → 对话系统
P2 (次要): 战斗系统
P3 (可选): 成就系统、图鉴系统、多人模式
```

---

*文档版本: v2.0*
*创建日期: 2026-02-28*
*最后更新: 2026-03-02*
