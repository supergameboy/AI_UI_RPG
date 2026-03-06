# AI-RPG Engine 智能体系统架构

本文档详细描述 AI-RPG Engine 的智能体系统架构，包括各智能体的职责、数据流转、AI调用时机和通信机制。

---

## 一、系统概述

### 1.1 设计理念

AI-RPG Engine 采用**多智能体协作架构**，将复杂的RPG游戏逻辑分解为多个专业化的智能体。每个智能体负责特定领域的决策和数据处理，通过消息队列进行通信协作。

### 1.2 总分总架构模式

```
┌─────────────────────────────────────────────────────────────────┐
│                        玩家输入                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CoordinatorAgent (统筹智能体)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  意图分析   │→│  任务分配   │→│  结果整合   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │ DialogueAgent │   │  CombatAgent  │   │   MapAgent    │
    │   对话智能体   │   │   战斗智能体   │   │   地图智能体   │
    └───────────────┘   └───────────────┘   └───────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │NumericalAgent │   │ InventoryAgent│   │   NPCAgent    │
    │   数值智能体   │   │   背包智能体   │   │   NPC智能体    │
    └───────────────┘   └───────────────┘   └───────────────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CoordinatorAgent (结果整合)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        玩家响应                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 智能体列表

| 智能体 | 类型标识 | 职责 |
|--------|----------|------|
| CoordinatorAgent | coordinator | 统筹协调，意图分析，结果整合 |
| StoryContextAgent | story_context | 故事上下文管理，剧情维护 |
| UIAgent | ui | UI指令生成 |
| QuestAgent | quest | 任务生成与追踪 |
| MapAgent | map | 地图管理，位置处理 |
| NPCAgent | npc_party | NPC和队伍管理 |
| NumericalAgent | numerical | 数值计算，属性处理 |
| InventoryAgent | inventory | 背包物品管理 |
| SkillAgent | skill | 技能管理 |
| CombatAgent | combat | 战斗流程管理 |
| DialogueAgent | dialogue | 对话生成 |
| EventAgent | event | 事件管理 |

---

## 二、核心架构组件

### 2.1 AgentBase (智能体基类)

**文件位置**: `packages/backend/src/agents/AgentBase.ts`

所有智能体的基类，提供：
- 消息处理循环
- LLM调用接口
- 记忆管理系统
- 配置管理

```typescript
abstract class AgentBase {
  abstract readonly type: AgentType;           // 智能体类型
  abstract readonly canCallAgents: AgentType[]; // 可调用的其他智能体
  abstract readonly dataAccess: string[];       // 数据访问权限
  abstract readonly systemPrompt: string;       // 系统提示词
  
  abstract processMessage(message: AgentMessage): Promise<AgentResponse>;
  
  // LLM调用
  async callLLM(messages: Message[], options?): Promise<ChatResponse>;
  async *callLLMStream(messages: Message[], options?): AsyncIterable<StreamChunk>;
  
  // 智能体间通信
  async sendMessage(to: AgentType, action: string, data: Record<string, unknown>): Promise<AgentMessage>;
  
  // 记忆管理
  addMemory(content: string, role: string, importance: number): void;
  clearMemory(): void;
}
```

### 2.2 AgentService (智能体服务)

**文件位置**: `packages/backend/src/services/AgentService.ts`

负责智能体的生命周期管理：
- 初始化所有智能体
- 启动/停止智能体
- 获取智能体状态
- 管理智能体配置

```typescript
class AgentService {
  private agents: Map<AgentType, AgentBase>;
  
  async initialize(): Promise<void>;
  async start(): Promise<void>;
  async stop(): Promise<void>;
  getAgent<T>(type: AgentType): T;
  getAgentStatus(type: AgentType): AgentStatus;
}
```

### 2.3 MessageQueue (消息队列)

**文件位置**: `packages/backend/src/services/MessageQueue.ts`

实现智能体间的异步通信：
- 按优先级排序消息 (critical > high > normal > low)
- 超时处理
- 消息日志记录

```typescript
class MessageQueue {
  enqueue(message: AgentMessage): Promise<AgentMessage>;
  dequeue(agentType: AgentType): AgentMessage | null;
  respond(originalMessage: AgentMessage, response: AgentMessage): void;
  getLogs(filter?): AgentLog[];
}
```

### 2.4 MessageRouter (消息路由)

**文件位置**: `packages/backend/src/services/MessageQueue.ts`

负责消息的路由分发：
- 注册智能体处理器
- 路由消息到目标智能体
- 处理响应回调

```typescript
class MessageRouter {
  registerHandler(agentType: AgentType, handler: Function): void;
  unregisterHandler(agentType: AgentType): void;
  async route(message: AgentMessage): Promise<AgentMessage>;
  async send(from: AgentType, to: AgentType, action: string, data: Record<string, unknown>): Promise<AgentMessage>;
}
```

### 2.5 LLMService (大语言模型服务)

**文件位置**: `packages/backend/src/services/llm/LLMService.ts`

统一的大语言模型调用接口：
- 支持多个LLM提供商 (DeepSeek, GLM, Kimi, OpenAI)
- 统一的请求/响应格式
- 流式输出支持
- 请求日志记录

```typescript
class LLMService {
  async initialize(): Promise<void>;
  async registerProvider(provider: string, config: LLMProviderConfig): Promise<void>;
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  async *chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk>;
}
```

---

## 三、智能体详解

### 3.1 CoordinatorAgent (统筹智能体)

**职责**: 核心协调者，负责接收玩家输入、分析意图、分配任务、整合结果

**可调用智能体**: 所有其他智能体

**数据访问权限**: 所有数据

**AI调用时机**:
1. **意图分析** - 使用LLM分析玩家输入的真实意图
2. **结果整合** - 使用LLM生成连贯的叙事响应

**内部处理流程**:
```
玩家输入
    │
    ▼
┌─────────────────┐
│   意图分析      │ ← LLM调用
│ (analyzeIntent) │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   任务分配      │
│ (callAgents)    │ → 并行调用多个智能体
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   冲突检测      │
│(detectConflicts)│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   结果整合      │ ← LLM调用
│(integrateResults)│
└─────────────────┘
    │
    ▼
玩家响应
```

**判断条件**:
- 根据 `analyzeIntent` 返回的 `requiredAgents` 决定调用哪些智能体
- 冲突检测：检查数据一致性、资源争用、逻辑矛盾
- 冲突解决策略：优先级策略、合并策略、顺序策略

---

### 3.2 DialogueAgent (对话智能体)

**职责**: 生成NPC对话、管理对话选项、处理对话效果

**可调用智能体**: StoryContextAgent, NPCAgent, QuestAgent

**数据访问权限**: dialogue_state, npc_state, quest_state, story_state

**AI调用时机**:
1. **对话生成** - 使用LLM生成NPC响应和对话选项
2. **情绪分析** - 分析对话情绪变化
3. **选项生成** - 动态生成对话选项

**内部处理流程**:
```
对话请求
    │
    ▼
┌─────────────────┐
│  加载对话上下文  │
│ (NPC信息、关系) │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   构建提示词    │
│ (系统提示+上下文)│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   LLM生成对话   │ ← LLM调用
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   解析响应      │
│ (内容、选项、效果)│
└─────────────────┘
    │
    ▼
对话响应
```

---

### 3.3 CombatAgent (战斗智能体)

**职责**: 管理战斗流程、计算伤害、执行AI决策

**可调用智能体**: NumericalAgent, SkillAgent, InventoryAgent

**数据访问权限**: combat_state, character_state, skill_state, inventory_state

**AI调用时机**:
1. **困难模式AI决策** - 使用LLM进行战术决策
2. **战斗叙事** - 生成战斗描述文本

**内部处理流程**:
```
战斗行动请求
    │
    ▼
┌─────────────────┐
│  验证行动合法性  │
│ (MP、冷却、状态) │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   执行行动      │
│ (攻击/技能/物品) │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   伤害计算      │
│ (命中、暴击、防御)│
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   更新状态      │
│ (HP、MP、效果)  │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  检查战斗结束    │
└─────────────────┘
    │
    ▼
战斗结果
```

**AI决策逻辑** (困难模式):
```typescript
// 当 difficulty === 'hard' 时调用LLM
if (this.difficulty === CombatDifficulty.HARD) {
  const decision = await this.callLLM([
    { role: 'system', content: combatDecisionPrompt },
    { role: 'user', content: JSON.stringify(battleState) }
  ]);
  // 解析LLM返回的决策
  return parseCombatDecision(decision.content);
}
// 简单/普通模式使用规则AI
return this.ruleBasedAI(battleState);
```

---

### 3.4 QuestAgent (任务智能体)

**职责**: 生成任务、追踪进度、发放奖励

**可调用智能体**: StoryContextAgent, NPCAgent, MapAgent

**数据访问权限**: quest_state, story_state, npc_state, map_state

**AI调用时机**:
1. **任务生成** - 使用LLM生成符合故事背景的任务
2. **任务描述** - 生成任务详情和目标描述

---

### 3.5 MapAgent (地图智能体)

**职责**: 管理世界地图、处理移动、触发场景事件

**可调用智能体**: EventAgent, NPCAgent

**数据访问权限**: map_state, event_state, npc_state

**AI调用时机**: 无 (纯规则驱动)

---

### 3.6 NPCAgent (NPC智能体)

**职责**: 管理NPC数据、关系系统、队伍管理

**可调用智能体**: DialogueAgent, CombatAgent

**数据访问权限**: npc_state, party_state, relationship_state

**AI调用时机**: 无 (纯数据管理)

---

### 3.7 NumericalAgent (数值智能体)

**职责**: 属性计算、伤害公式、等级成长

**可调用智能体**: 无

**数据访问权限**: character_state, equipment_state

**AI调用时机**: 无 (纯数学计算)

**核心公式**:
```typescript
// 物理伤害计算
calculatePhysicalDamage(attacker: CombatUnitStats, defender: CombatUnitStats): number {
  const baseDamage = attacker.attack * 2 - defender.defense;
  const variance = Math.random() * 0.2 + 0.9; // 90%-110%
  const critical = Math.random() < attacker.luck / 100 ? 1.5 : 1;
  return Math.max(1, Math.floor(baseDamage * variance * critical));
}

// 经验值曲线
calculateExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
```

---

### 3.8 InventoryAgent (背包智能体)

**职责**: 物品管理、堆叠逻辑、装备穿戴

**可调用智能体**: NumericalAgent

**数据访问权限**: inventory_state, equipment_state, character_state

**AI调用时机**: 无 (纯数据管理)

---

### 3.9 SkillAgent (技能智能体)

**职责**: 技能管理、冷却计时、效果处理

**可调用智能体**: NumericalAgent

**数据访问权限**: skill_state, character_state

**AI调用时机**: 无 (纯规则驱动)

---

### 3.10 StoryContextAgent (故事上下文智能体)

**职责**: 维护故事主线、上下文压缩、剧情分支管理

**可调用智能体**: QuestAgent, NPCAgent

**数据访问权限**: story_state, quest_state, npc_state

**AI调用时机**:
1. **上下文压缩** - 使用LLM压缩长对话历史
2. **剧情生成** - 生成新的剧情节点

---

### 3.11 UIAgent (UI智能体)

**职责**: 生成UI指令、界面更新通知

**可调用智能体**: 无

**数据访问权限**: ui_state

**AI调用时机**: 无 (纯规则驱动)

---

### 3.12 EventAgent (事件智能体)

**职责**: 事件触发、条件检测、事件链管理

**可调用智能体**: QuestAgent, NPCAgent, MapAgent

**数据访问权限**: event_state, quest_state, npc_state, map_state

**AI调用时机**: 无 (纯规则驱动)

---

## 四、数据流转

### 4.1 完整请求流程

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              前端                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │ 玩家输入    │ →  │ gameStore   │ →  │ API请求     │                   │
│  │ (聊天/行动) │    │ 状态管理    │    │ (fetch)     │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTP POST /api/dialogue/send
┌──────────────────────────────────────────────────────────────────────────┐
│                              后端                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │ Express路由 │ →  │ LLMService  │ →  │ 响应解析    │                   │
│  │ /dialogue   │    │ (DeepSeek)  │    │ (JSON)      │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ JSON Response
┌──────────────────────────────────────────────────────────────────────────┐
│                              前端                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                   │
│  │ 更新状态    │ →  │ 渲染组件    │ →  │ 显示结果    │                   │
│  │ (gameStore) │    │ (React)     │    │ (UI)        │                   │
│  └─────────────┘    └─────────────┘    └─────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 智能体间消息流转

```typescript
// 1. CoordinatorAgent 发送消息到 DialogueAgent
const message = await this.sendMessage(
  'dialogue',           // 目标智能体
  'generate_response',  // 动作
  { input: playerInput, npcId: 'npc_001' },  // 数据
  { priority: 'high', requiresResponse: true }
);

// 2. MessageQueue 将消息入队
queue.enqueue(message);

// 3. DialogueAgent 从队列获取消息
const msg = queue.dequeue('dialogue');

// 4. DialogueAgent 处理消息
const response = await dialogueAgent.processMessage(msg);

// 5. 返回响应到 CoordinatorAgent
queue.respond(msg, response);
```

---

## 五、AI调用时机汇总

| 智能体 | 调用场景 | 调用条件 | 用途 |
|--------|----------|----------|------|
| CoordinatorAgent | 意图分析 | 每次玩家输入 | 分析玩家意图，决定调用哪些智能体 |
| CoordinatorAgent | 结果整合 | 多智能体调用后 | 生成连贯的叙事响应 |
| DialogueAgent | 对话生成 | 每次对话请求 | 生成NPC响应和对话选项 |
| CombatAgent | AI决策 | 困难模式战斗 | 战术决策（攻击目标、技能选择） |
| QuestAgent | 任务生成 | 新任务请求 | 生成符合故事背景的任务 |
| StoryContextAgent | 上下文压缩 | 对话历史过长 | 压缩历史对话为摘要 |

### 5.1 LLM调用流程

```typescript
// 1. 构建消息
const messages: Message[] = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: playerInput }
];

// 2. 调用LLM
const response = await this.callLLM(messages, {
  temperature: 0.7,    // 创造性 (0-1)
  maxTokens: 2048,     // 最大输出长度
  provider: 'deepseek' // LLM提供商
});

// 3. 解析响应
const content = response.content;
```

### 5.2 提示词模板

每个智能体都有对应的系统提示词，存储在 `AgentConfigService` 中：

```typescript
// 示例：DialogueAgent 的系统提示词
const dialogueSystemPrompt = `你是一个RPG游戏中的NPC对话生成器。
你需要根据NPC的性格、关系和当前情境生成合适的对话。

NPC信息：
- 名字: {npcName}
- 性格: {personality}
- 与玩家关系: {relationship}

请生成：
1. NPC的对话内容
2. 玩家可选择的回复选项
3. 对话情绪变化

返回JSON格式...`;
```

---

## 六、配置与扩展

### 6.1 添加新智能体

1. 创建智能体类，继承 `AgentBase`:
```typescript
// packages/backend/src/agents/NewAgent.ts
export class NewAgent extends AgentBase {
  readonly type = 'new_agent' as AgentType;
  readonly canCallAgents: AgentType[] = ['numerical'];
  readonly dataAccess: string[] = ['new_state'];
  readonly systemPrompt = '...';
  
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    // 实现处理逻辑
  }
}
```

2. 在 `AgentService` 中注册:
```typescript
this.agents.set('new_agent' as AgentType, new NewAgent());
```

3. 添加类型定义到 `@ai-rpg/shared`

### 6.2 配置LLM提供商

编辑 `game_data/settings.json`:
```json
{
  "ai": {
    "defaultProvider": "deepseek",
    "providers": {
      "deepseek": {
        "apiKey": "your-api-key",
        "baseURL": "https://api.deepseek.com",
        "defaultModel": "deepseek-chat"
      }
    }
  }
}
```

---

## 七、性能优化

### 7.1 并行调用

CoordinatorAgent 使用 `Promise.allSettled` 并行调用多个智能体：
```typescript
const callPromises = agents.map(agentType => 
  this.sendMessage(agentType, action, data)
);
const results = await Promise.allSettled(callPromises);
```

### 7.2 记忆管理

智能体记忆分为三层：
- **短期记忆**: 最近50条消息
- **中期记忆**: 51-150条消息
- **长期记忆**: 150条以上

### 7.3 上下文压缩

当对话历史过长时，StoryContextAgent 使用LLM压缩：
```typescript
if (this.memory.shortTerm.length > 40) {
  const compressed = await this.callLLM([
    { role: 'user', content: '请总结以下对话的要点...' }
  ]);
  this.memory.compressed = compressed.content;
}
```

---

## 八、新架构组件

### 8.1 Tool 层架构

Tool 层是 Agent 访问游戏数据的统一接口，提供类型安全的方法调用和权限控制。

#### ToolBase 基类

**文件位置**: `packages/backend/src/tools/ToolBase.ts`

所有 Tool 的基类，提供：
- 方法注册和元数据管理
- 读写权限区分
- 统一的错误处理
- 状态监控

```typescript
abstract class ToolBase {
  protected abstract readonly toolType: ToolType;      // Tool 类型标识
  protected abstract readonly toolDescription: string; // Tool 描述
  protected abstract readonly toolVersion: string;     // 版本号

  // 注册方法（子类实现）
  protected abstract registerMethods(): void;
  protected abstract executeMethod<T>(method: string, params: Record<string, unknown>, context: ToolCallContext): Promise<ToolResponse<T>>;

  // 权限控制
  isReadMethod(method: string): boolean;
  isWriteMethod(method: string): boolean;
  getReadMethods(): string[];
  getWriteMethods(): string[];

  // 执行入口
  async execute<T>(method: string, params: Record<string, unknown>, context: ToolCallContext): Promise<ToolResponse<T>>;

  // 状态管理
  getStatus(): ToolStatus;
  getConfig(): ToolConfig;
}
```

#### ToolRegistry

**文件位置**: `packages/backend/src/tools/ToolRegistry.ts`

Tool 注册和管理中心：
- Tool 注册和注销
- 统一的执行入口
- 并发控制
- 状态监控

```typescript
class ToolRegistry {
  registerTool(tool: ToolBase): void;
  unregisterTool(toolType: ToolType): boolean;
  getTool<T>(toolType: ToolType): T | undefined;
  listTools(): ToolType[];
  listToolStatuses(): ToolStatus[];

  async executeTool<T>(toolType: ToolType, method: string, params: Record<string, unknown>, context: ToolCallContext): Promise<ToolResponse<T>>;
  async initializeAll(): Promise<void>;
  async disposeAll(): Promise<void>;
}
```

#### 已实现的 Tool

| Tool | 类型标识 | 职责 | 文件位置 |
|------|----------|------|----------|
| InventoryDataTool | `inventory_data` | 物品管理、装备系统、交易处理 | tools/implementations/InventoryDataTool.ts |
| SkillDataTool | `skill_data` | 技能管理、冷却管理 | tools/implementations/SkillDataTool.ts |
| MapDataTool | `map_data` | 位置查询、移动验证、区域管理 | tools/implementations/MapDataTool.ts |
| QuestDataTool | `quest_data` | 任务 CRUD、进度追踪、奖励发放 | tools/implementations/QuestDataTool.ts |
| NPCDataTool | `npc_data` | NPC CRUD、关系管理、队伍管理 | tools/implementations/NPCDataTool.ts |
| EventDataTool | `event_data` | 事件 CRUD、条件检查、事件链 | tools/implementations/EventDataTool.ts |
| StoryDataTool | `story_data` | 剧情节点管理、选择记录 | tools/implementations/StoryDataTool.ts |
| UIDataTool | `ui_data` | UI 状态管理、指令队列 | tools/implementations/UIDataTool.ts |
| DialogueDataTool | `dialogue_data` | 对话历史管理、上下文构建 | tools/implementations/DialogueDataTool.ts |
| CombatDataTool | `combat_data` | 战斗状态管理、回合处理 | tools/implementations/CombatDataTool.ts |
| NumericalTool | `numerical` | 属性计算、伤害公式、经验曲线 | tools/implementations/NumericalTool.ts |

#### Tool 调用流程

```
Agent
  │
  │ callTool(toolType, method, params, permission)
  ▼
ToolRegistry
  │
  │ executeTool(toolType, method, params, context)
  ▼
ToolBase
  │
  │ execute(method, params, context)
  ▼
executeMethod (子类实现)
  │
  │ 调用对应 Service
  ▼
ToolResponse
```

---

### 8.2 Agent 层架构

Agent 层负责游戏逻辑决策和 LLM 调用，通过 Tool 层访问数据。

#### AgentBase 基类更新

**文件位置**: `packages/backend/src/agents/AgentBase.ts`

新架构中 AgentBase 的关键变更：
- 移除 `canCallAgents` 和 `dataAccess` 属性
- 新增 `tools` 属性：声明依赖的 Tool 类型
- 新增 `bindings` 属性：声明可调用的 Agent 及其条件
- 提供 `callTool()` 方法调用 Tool
- 提供 `callAgent()` 方法调用其他 Agent

```typescript
abstract class AgentBase implements Agent {
  abstract readonly type: AgentType;
  abstract readonly tools: ToolType[];           // 依赖的 Tool 列表
  abstract readonly bindings: AgentBinding[];    // 可调用的 Agent 绑定
  abstract readonly systemPrompt: string;

  protected toolRegistry: ToolRegistry;

  // Tool 调用
  getTool<T>(toolType: ToolType): T | undefined;
  async callTool<T>(toolType: ToolType, method: string, params: unknown, permission?: ToolPermission): Promise<ToolResponse<T>>;

  // Agent 调用
  async callAgent(agentType: AgentType, message: AgentMessage): Promise<AgentResponse>;

  // LLM 调用
  async callLLM(messages: Message[], options?): Promise<ChatResponse>;
  async *callLLMStream(messages: Message[], options?): AsyncIterable<StreamChunk>;
}
```

#### AgentBinding 配置

定义 Agent 可以调用的其他 Agent 及其条件：

```typescript
interface AgentBinding {
  agentType: AgentType;          // 目标 Agent 类型
  condition?: {
    messageType?: string | string[];
    context?: Record<string, unknown>;
  };
  priority?: number;             // 调用优先级
  enabled?: boolean;             // 是否启用
}
```

#### Agent 示例

```typescript
export class InventoryAgent extends AgentBase {
  readonly type = AgentType.INVENTORY;
  readonly tools: ToolType[] = [
    ToolType.INVENTORY_DATA,
    ToolType.NUMERICAL,
  ];
  readonly bindings: AgentBinding[] = [
    { agentType: AgentType.COORDINATOR, enabled: true },
    { agentType: AgentType.NUMERICAL, enabled: true },
  ];
  readonly systemPrompt = '...';

  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    // 使用 Tool 获取数据
    const inventory = await this.callTool(
      ToolType.INVENTORY_DATA,
      'getInventory',
      { saveId, characterId },
      'read'
    );

    // 使用 Tool 修改数据
    const result = await this.callTool(
      ToolType.INVENTORY_DATA,
      'addItem',
      { saveId, characterId, item },
      'write'
    );

    return { success: true, data: result.data };
  }
}
```

---

### 8.3 Binding 路由系统

Binding 路由系统负责将玩家输入路由到正确的 Agent 处理。

#### BindingRouter

**文件位置**: `packages/backend/src/routing/BindingRouter.ts`

```typescript
class BindingRouter {
  private bindings: Binding[];
  private cache: Map<string, CacheEntry>;
  private defaultAgentId: AgentType;

  // 路由方法
  route(messageType: string, context: Record<string, unknown>): BindingRouteResult;

  // Binding 管理
  setBindings(bindings: Binding[]): void;
  addBinding(binding: Binding): void;
  removeBinding(bindingId: string): boolean;
  getBindings(): Binding[];

  // 测试和统计
  test(request: BindingTestRequest): BindingTestResult;
  getStats(): { bindingCount: number; enabledCount: number; cacheSize: number };
}
```

#### Binding 配置结构

```typescript
interface Binding {
  id: string;                    // Binding 唯一标识
  agentId: AgentType;            // 目标 Agent
  match: BindingMatch;           // 匹配条件
  priority: number;              // 优先级（越高越优先）
  enabled: boolean;              // 是否启用
  description?: string;          // 描述
  createdAt: number;
  updatedAt: number;
}

interface BindingMatch {
  messageType?: string | '*';    // 消息类型匹配
  context?: {                    // 上下文条件
    inCombat?: boolean;
    inDialogue?: boolean;
    location?: string;
    [key: string]: unknown;
  };
  custom?: {                     // 自定义条件
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';
    value: unknown;
  }[];
}
```

#### 路由流程

```
玩家输入
    │
    ▼
┌─────────────────┐
│ BindingRouter   │
│ .route()        │
└─────────────────┘
    │
    │ 1. 检查缓存
    │ 2. 遍历 Bindings（按优先级排序）
    │ 3. 匹配 messageType 和 context
    │ 4. 计算匹配分数
    ▼
┌─────────────────┐
│ BindingRoute    │
│ Result          │
│ - agentId       │
│ - binding       │
│ - matched       │
│ - matchDetails  │
└─────────────────┘
    │
    ▼
目标 Agent 处理
```

#### 默认 Bindings

| ID | Agent | 匹配条件 | 优先级 | 描述 |
|----|-------|----------|--------|------|
| game_init | coordinator | messageType: game_init | 100 | 游戏初始化 |
| dialogue_request | dialogue | messageType: dialogue_request | 10 | 对话请求 |
| npc_interaction | dialogue | messageType: npc_interaction | 8 | NPC 交互 |
| combat_action | combat | messageType: combat_action | 10 | 战斗行动 |
| combat_context | combat | context.inCombat: true | 5 | 战斗上下文 |
| generate_item | inventory | messageType: generate_item | 10 | 生成物品 |
| generate_skill | skill | messageType: generate_skill | 10 | 生成技能 |
| generate_area | map | messageType: generate_area | 10 | 生成地图区域 |
| quest_event | quest | messageType: quest_event | 10 | 任务事件 |
| default_fallback | coordinator | messageType: * | 0 | 默认回退 |

---

### 8.4 上下文管理系统

上下文管理系统负责管理全局游戏状态和各 Agent 的上下文数据。

#### ContextManager

**文件位置**: `packages/backend/src/context/ContextManager.ts`

```typescript
class ContextManager {
  private globalContext: GlobalContext;
  private agentContexts: Map<AgentType, AgentContextManager>;
  private snapshots: ContextSnapshot[];
  private conflictResolutionRules: ConflictResolutionRule[];

  // 全局上下文
  getGlobalContext(): GlobalContext;
  updateGlobalContext(updates: Partial<GlobalContext>): void;

  // Agent 上下文
  getAgentContext(agentId: AgentType): AgentContextManager;
  hasAgentContext(agentId: AgentType): boolean;
  getAllAgentContexts(): Map<AgentType, AgentContextManager>;

  // 快照
  createSnapshot(requestId: string): ContextSnapshot;
  getLatestSnapshot(): ContextSnapshot | undefined;

  // 合并和冲突解决
  mergeContexts(agentIds?: AgentType[]): ContextMergeResult;
  diffContexts(before: GlobalContext, after: GlobalContext): ContextDiff[];

  // 重置
  clearAgentContexts(): void;
  reset(): void;
}
```

#### AgentContextManager

每个 Agent 的独立上下文管理：

```typescript
class AgentContextManager {
  private agentId: AgentType;
  private data: Record<string, unknown>;
  private changes: ContextData[];
  private version: number;

  // 数据访问
  get(path: string): unknown;
  set(path: string, value: unknown, reason: string): void;
  delete(path: string, reason: string): boolean;
  getAll(): Record<string, unknown>;
  setAll(data: Record<string, unknown>, reason: string): void;

  // 变更追踪
  getChanges(since?: number): ContextData[];
  getChangesSince(version: number): ContextData[];
  clearChanges(): void;

  // 快照
  snapshot(): Record<string, unknown>;
  restore(snapshot: Record<string, unknown>): void;

  // 版本
  getVersion(): number;
  toAgentContext(): AgentContext;
}
```

#### GlobalContext 结构

```typescript
interface GlobalContext {
  player: {
    id: string;
    name: string;
    race: string;
    class: string;
    background: string;
    level: number;
    experience: number;
    attributes: Record<string, number>;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    location: string;
  };
  world: {
    id: string;
    name: string;
    currentTime: number;
    weather: string;
    exploredAreas: string[];
    worldState: Record<string, unknown>;
  };
  combat: CombatState | null;
  inventory: InventoryState;
  quests: QuestState;
  npcs: NPCState;
  story: StoryState;
  dialogue: DialogueState;
  metadata: {
    createdAt: number;
    updatedAt: number;
    saveVersion: string;
    templateId: string;
    gameMode: string;
  };
}
```

#### 冲突解决策略

| 策略 | 描述 |
|------|------|
| `timestamp` | 使用最新的修改（默认） |
| `priority` | 按预设的 Agent 优先级选择 |
| `manual` | 需要手动解决，不自动合并 |
| `abort` | 遇到冲突时中止合并 |

---

### 8.5 决策日志系统

决策日志系统记录 Agent 的决策过程，用于调试和审计。

#### DecisionLogService

**文件位置**: `packages/backend/src/services/DecisionLogService.ts`

```typescript
class DecisionLogService {
  private logs: Map<string, DecisionLog>;
  private currentLog: DecisionLog | null;
  private currentAgents: Map<AgentType, DecisionLogAgent>;

  // 日志生命周期
  startLog(requestId: string, playerId: string, saveId: string, playerInput: string, inputType: string): DecisionLog;
  endLog(): DecisionLog | null;

  // Agent 日志
  startAgentLog(agentId: AgentType, contextSnapshot: Record<string, unknown>): void;
  endAgentLog(agentId: AgentType): void;

  // 记录内容
  addDecision(agentId: AgentType, decision: DecisionLogAgentDecision): void;
  addLLMCall(agentId: AgentType, llmCall: DecisionLogLLMCall): void;
  addToolCall(agentId: AgentType, toolCall: DecisionLogToolCall): void;
  addContextChange(agentId: AgentType, change: ContextData): void;
  addConflict(conflict: DecisionLogConflict): void;
  setResult(result: DecisionLogResult): void;

  // 查询
  getLog(logId: string): DecisionLog | undefined;
  getLogByRequestId(requestId: string): DecisionLog | undefined;
  queryLogs(query: DecisionLogQuery): DecisionLogSummary[];
  traceback(logId: string): DecisionLogTraceback | null;

  // 维护
  cleanup(retentionDays?: number): number;
  getStats(): { totalLogs: number; totalSize: number; oldestTimestamp: number | null; newestTimestamp: number | null };
}
```

#### DecisionLog 结构

```typescript
interface DecisionLog {
  id: string;
  timestamp: number;
  requestId: string;
  playerId: string;
  saveId: string;
  playerInput: string;
  inputType: string;
  agents: DecisionLogAgent[];
  conflicts: DecisionLogConflict[];
  result: DecisionLogResult;
  metadata: {
    totalTokens: number;
    totalDuration: number;
    agentCount: number;
    toolCallCount: number;
    conflictCount: number;
    version: string;
  };
}

interface DecisionLogAgent {
  agentId: AgentType;
  contextSnapshot: Record<string, unknown>;
  decisions: DecisionLogAgentDecision[];
  contextChanges: ContextData[];
  duration: number;
}

interface DecisionLogAgentDecision {
  timestamp: number;
  action: string;
  reasoning: string;
  llmCall?: DecisionLogLLMCall;
  toolCalls: DecisionLogToolCall[];
  result: unknown;
}

interface DecisionLogToolCall {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  result: ToolResponse;
  duration: number;
}
```

---

## 九、架构图

### 9.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              前端 (Frontend)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  React UI   │  │  GameStore  │  │ API Client  │  │  WebSocket  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP / WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              后端 (Backend)                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Routing Layer                              │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │   │
│  │  │ BindingRouter │  │ Express Routes│  │ WebSocket Svc │        │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Agent Layer                               │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │   │
│  │  │Coordinator│ │ Dialogue  │ │  Combat   │ │ Inventory │ ...    │   │
│  │  │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │        │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │   │
│  │        │              │              │              │            │   │
│  │        └──────────────┴──────────────┴──────────────┘            │   │
│  │                              │                                    │   │
│  │                              ▼                                    │   │
│  │  ┌─────────────────────────────────────────────────────────┐     │   │
│  │  │              Tool Layer (ToolRegistry)                   │     │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │     │   │
│  │  │  │Inventory│ │  Skill  │ │   Map   │ │  Quest  │ ...    │     │   │
│  │  │  │DataTool │ │DataTool │ │DataTool │ │DataTool │        │     │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │     │   │
│  │  └─────────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Service Layer                              │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │   │
│  │  │ Inventory │ │   Skill   │ │    Map    │ │   Quest   │ ...    │   │
│  │  │  Service  │ │  Service  │ │  Service  │ │  Service  │        │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Infrastructure Layer                          │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │   │
│  │  │    LLM    │ │  Context  │ │ Decision  │ │ Database  │        │   │
│  │  │  Service  │ │  Manager  │ │LogService │ │  Service  │        │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           数据存储 (Storage)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   SQLite    │  │  Game Data  │  │   Prompts   │                     │
│  │  Database   │  │    Files    │  │   Config    │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 数据流

```
玩家输入
    │
    ▼
┌─────────────────┐
│ BindingRouter   │ ─── 路由到目标 Agent
└─────────────────┘
    │
    ▼
┌─────────────────┐
│ Agent.process   │
│ Message()       │
└─────────────────┘
    │
    ├─── callTool() ───▶ ToolRegistry ─── Tool ─── Service
    │
    ├─── callLLM() ───▶ LLMService ─── LLM Provider
    │
    └─── callAgent() ─▶ 其他 Agent
    │
    ▼
┌─────────────────┐
│ AgentResponse   │ ─── 返回前端
└─────────────────┘
```

---

## 十、迁移指南

### 10.1 从旧架构迁移

#### 1. 更新 Agent 导入路径

```typescript
// 旧架构
import { AgentBase } from './agents/AgentBase';

// 新架构（路径不变，但接口有变化）
import { AgentBase } from './agents/AgentBase';
```

#### 2. 更新 Agent 定义

```typescript
// 旧架构
class MyAgent extends AgentBase {
  readonly canCallAgents: AgentType[] = ['coordinator', 'numerical'];
  readonly dataAccess: string[] = ['inventory_state', 'character_state'];
  // ...
}

// 新架构
class MyAgent extends AgentBase {
  readonly tools: ToolType[] = [ToolType.INVENTORY_DATA, ToolType.NUMERICAL];
  readonly bindings: AgentBinding[] = [
    { agentType: AgentType.COORDINATOR, enabled: true },
    { agentType: AgentType.NUMERICAL, enabled: true },
  ];
  // ...
}
```

#### 3. 使用新的 Tool 接口

```typescript
// 旧架构：直接访问 Service
const inventory = this.inventoryService.getInventory(saveId, characterId);

// 新架构：通过 Tool 访问
const result = await this.callTool(
  ToolType.INVENTORY_DATA,
  'getInventory',
  { saveId, characterId },
  'read'
);
if (result.success) {
  const inventory = result.data;
}
```

#### 4. 配置 Binding 规则

```typescript
// 在 BindingConfigService 中配置
const binding: Binding = {
  id: 'my_custom_binding',
  agentId: AgentType.MY_AGENT,
  match: {
    messageType: 'custom_action',
    context: { inCombat: false },
  },
  priority: 10,
  enabled: true,
  description: '自定义绑定',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

#### 5. 更新前端 Store

前端 Store 主要通过 API 与后端交互，无需直接访问 Tool 或 Agent。确保 API 路由正确即可。

### 10.2 类型定义更新

所有共享类型定义位于 `packages/shared/src/types/` 目录：

| 文件 | 内容 |
|------|------|
| `tool.ts` | ToolType, ToolConfig, ToolResponse, ToolCallContext 等 |
| `agent.ts` | AgentType, Agent, AgentBinding, AgentMessage 等 |
| `binding.ts` | Binding, BindingMatch, BindingRouterOptions 等 |
| `context.ts` | GlobalContext, AgentContext, ContextData 等 |
| `decision-log.ts` | DecisionLog, DecisionLogAgent, DecisionLogToolCall 等 |

---

*文档版本: v2.0*
*创建日期: 2026-03-03*
*最后更新: 2026-03-04*
