# AI-RPG Engine 架构决策记录 (ADR)

本文档记录项目开发过程中的关键架构决策，为参与项目的开发者提供决策背景和理由参考。

---

## ADR-001: UI Agent 职责边界

### 状态
已采纳 (2026-03-02)

### 背景
在多智能体架构中，UI Agent 的职责范围需要明确界定。有两种可能的设计方向：
- 方案 A：UI Agent 处理所有 UI 指令，包括面板切换、状态更新、动态组件等
- 方案 B：UI Agent 仅处理 Markdown 动态组件、通知、弹窗，其他 UI 由前端直接管理

### 决策
采用 **方案 B**：UI Agent 仅处理 Markdown 动态组件。

### 理由
1. **职责单一原则**：UI Agent 专注于将智能体输出转换为可渲染的 UI 指令，避免职责过重
2. **性能考虑**：频繁的状态更新（如 HP/MP 变化）如果都经过 UI Agent，会增加消息传递开销
3. **解耦设计**：前端直接管理静态 UI 组件，减少对后端的依赖
4. **可维护性**：清晰的职责边界使代码更易于理解和维护

### UI Agent 职责范围

| 由 UI Agent 处理 | 由前端直接管理 |
|-----------------|---------------|
| Markdown 动态组件渲染 | 面板显示/隐藏 |
| 通知消息（notify） | 状态栏更新（HP/MP/经验） |
| 弹窗对话框（dialog） | 菜单导航 |
| 选项按钮组（options） | 输入框状态 |
| 进度条组件（progress） | 列表滚动 |
| 标签页组件（tabs） | 主题切换 |

### 实现
UI Agent 的 `parseAgentOutput` 方法解析各智能体返回的结构化数据，生成 `UIInstruction`：
- `type: 'notify'` - 通知消息
- `type: 'dialog'` - 弹窗对话框
- `type: 'update'` - 更新 Markdown 组件内容
- `type: 'show'/'hide'` - 显示/隐藏动态组件

前端通过 WebSocket 或 HTTP 轮询获取 UI 指令并执行渲染。

---

## ADR-002: 基础系统开发顺序

### 状态
已采纳 (2026-03-02)

### 背景
游戏有多个基础系统需要实现，包括数值、背包、技能、装备、任务、地图、NPC、对话、战斗等。需要确定合理的开发顺序。

### 决策
按 **依赖关系** 确定开发顺序：

```
Phase 1: 基础系统（可并行开发）
├── 数值系统 (Numerical) - 属性计算、伤害公式
├── 背包系统 (Inventory) - 物品存储、使用、丢弃
└── 技能系统 (Skill) - 技能定义、学习、冷却

Phase 2: 依赖系统
├── 装备系统 (Equipment) - 依赖背包 + 数值
└── 任务系统 (Quest) - 独立，但与对话系统关联

Phase 3: 世界系统
├── 地图系统 (Map) - 场景、地点、移动
└── NPC系统 (NPC) - NPC 数据、关系、好感度

Phase 4: 交互系统
├── 对话系统 (Dialogue) - 依赖 NPC + 任务
└── 战斗系统 (Combat) - 依赖数值 + 技能 + 装备

Phase 5: 游戏初始化
└── 整合所有系统，实现角色创建后的初始化流程
```

### 理由
1. **依赖优先**：被依赖的系统必须先实现，避免后续返工
2. **并行开发**：无依赖关系的系统可以并行开发，提高效率
3. **渐进集成**：每个阶段完成后可以进行集成测试
4. **风险控制**：核心系统优先，问题早发现早解决

### 依赖关系图

```
                    ┌─────────────┐
                    │   数值系统   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌───────────┐    ┌───────────┐    ┌───────────┐
   │  装备系统  │    │  战斗系统  │    │  技能系统  │
   └─────┬─────┘    └─────┬─────┘    └───────────┘
         │                │
         ▼                ▼
   ┌───────────┐    ┌───────────┐
   │  背包系统  │    │  对话系统  │
   └───────────┘    └─────┬─────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ▼             ▼
              ┌───────────┐ ┌───────────┐
              │  NPC系统  │ │  任务系统  │
              └───────────┘ └───────────┘
                    │
                    ▼
              ┌───────────┐
              │  地图系统  │
              └───────────┘
```

---

## ADR-003: 游戏初始化流程

### 状态
已采纳 (2026-03-02)

### 背景
角色创建完成后进入游戏时，需要初始化多个游戏系统，生成初始场景对话。这是一个复杂的工程，需要明确的流程。

### 决策
采用 **分步初始化** 流程，由 CoordinatorAgent 统筹调用各智能体：

```
角色创建完成
    │
    ├── 1. NumericalAgent.calculateInitialStats()
    │      - 计算基础属性（HP/MP/攻击/防御/速度等）
    │      - 应用种族/职业/背景加成
    │
    ├── 2. SkillAgent.initializeSkills()
    │      - 根据职业添加初始技能
    │      - 根据背景添加特殊技能
    │
    ├── 3. InventoryAgent.initializeInventory()
    │      - 添加初始物品（消耗品、材料）
    │      - 添加初始金币
    │
    ├── 4. InventoryAgent.equipInitialGear()
    │      - 自动装备初始装备
    │      - 更新属性加成
    │
    ├── 5. QuestAgent.createMainQuest()
    │      - 创建隐藏的主线任务
    │      - 设置任务目标
    │
    ├── 6. MapAgent.initializeStartingLocation()
    │      - 设置初始场景
    │      - 初始化可探索区域
    │
    ├── 7. NPCAgent.initializeSceneNPCs()
    │      - 加载场景中的 NPC
    │      - 初始化 NPC 关系
    │
    └── 8. DialogueAgent.generateInitialScene()
           - 生成故事背景介绍
           - 生成角色登场描述
           - 生成当前处境说明
           - 生成 2-5 个快速选项
```

### 理由
1. **顺序执行**：确保依赖关系正确（如装备依赖背包）
2. **可恢复**：每个步骤独立，失败后可以从断点恢复
3. **可调试**：每个步骤有明确的输入输出
4. **可扩展**：新增初始化步骤只需添加到流程中

### 存档策略
初始化完成后自动创建初始存档：
- 存档类型：`initial`（初始存档）
- 包含完整的游戏状态快照
- 作为玩家重新开始的起点

---

## ADR-004: 智能体通信架构

### 状态
已采纳 (2026-03-02)

### 背景
多智能体系统需要高效的通信机制。当前采用消息队列（MessageQueue）+ 路由器（MessageRouter）模式。

### 决策
采用 **总分总** 架构模式：

```
玩家输入
    │
    ▼
┌─────────────────────┐
│   CoordinatorAgent  │ ← 总：接收、分析、派发、整合
└─────────┬───────────┘
          │
    ┌─────┼─────┬─────┬─────┬─────┐
    ▼     ▼     ▼     ▼     ▼     ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Quest ││ Map  ││ NPC  ││Invtry││Combat│ ← 分：并行处理
└──────┘└──────┘└──────┘└──────┘└──────┘
    │     │     │     │     │
    └─────┴─────┴─────┴─────┴─────┘
          │
          ▼
┌─────────────────────┐
│   CoordinatorAgent  │ ← 总：整合结果
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│     UIAgent         │ ← 生成 UI 指令
└─────────────────────┘
          │
          ▼
      前端渲染
```

### 理由
1. **并行处理**：多个智能体可以同时工作，提高响应速度
2. **职责分离**：每个智能体专注于自己的领域
3. **冲突检测**：CoordinatorAgent 负责检测和解决智能体之间的冲突
4. **结果整合**：统一整合结果，生成连贯的叙事响应

### 消息格式
```typescript
interface AgentMessage {
  id: string;
  timestamp: number;
  from: AgentType;
  to: AgentType | AgentType[];
  type: 'request' | 'response' | 'notification' | 'error';
  payload: {
    action: string;
    data: Record<string, unknown>;
    context?: Record<string, unknown>;
  };
  metadata: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    requiresResponse: boolean;
    timeout?: number;
  };
  correlationId?: string; // 用于追踪请求-响应链
}
```

---

## ADR-005: 存档系统设计

### 状态
规划中 (2026-03-02)

### 背景
需要设计存档系统以支持游戏进度保存和恢复。

### 决策
采用 **增量存档 + 快照存档** 混合模式：

| 存档类型 | 触发时机 | 存储内容 | 用途 |
|---------|---------|---------|------|
| 初始存档 | 角色创建完成 | 完整游戏状态 | 重新开始 |
| 自动存档 | 场景切换/任务完成 | 完整游戏状态 | 意外恢复 |
| 手动存档 | 玩家操作 | 完整游戏状态 | 自由保存 |
| 快速存档 | F5 快捷键 | 完整游戏状态 | 快速保存/读取 |

### 存档数据结构
```typescript
interface SaveData {
  id: string;
  name: string;
  type: 'initial' | 'auto' | 'manual' | 'quick';
  timestamp: number;
  playTime: number;
  
  // 快照信息
  snapshot: {
    chapter: string;
    location: string;
    level: number;
    mainQuest: string;
    thumbnail?: string;
  };
  
  // 完整游戏状态
  gameState: {
    character: CharacterState;
    quests: QuestState[];
    inventory: InventoryItem[];
    equipment: EquipmentState;
    skills: SkillState[];
    map: MapState;
    npcs: NPCState[];
    dialogue: DialogueState;
    story: StoryState;
  };
  
  // 元数据
  metadata: {
    version: string;
    templateId: string;
    checksum: string;
  };
}
```

---

## 参与决策

如果您对某个决策有不同意见或建议改进，请：
1. 在 Issue 中提出讨论
2. 或直接提交 PR 修改本文档
3. 重大决策变更需要团队讨论确认

---

*文档版本: v1.0*
*创建日期: 2026-03-02*
*最后更新: 2026-03-02*
