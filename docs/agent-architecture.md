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

*文档版本: v1.0*
*创建日期: 2026-03-03*
*最后更新: 2026-03-03*
