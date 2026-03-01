# AI驱动的通用RPG游戏系统 - 项目设计文档

## 一、项目概述

### 1.1 项目名称
**AI-RPG Engine** - AI驱动的通用角色扮演游戏引擎

### 1.2 项目定位
一个基于大语言模型(LLM)的通用RPG游戏框架，支持玩家通过AI动态生成故事内容，提供沉浸式的角色扮演体验。系统支持多种游戏模式，从纯文字冒险到复杂的回合制RPG战斗，玩家还可以自定义故事模板创造独特的游戏体验。

**项目性质**：免费开源项目（MIT License），作为AI应用实践的探索。

### 1.3 核心价值
- **无限可能性**：AI动态生成故事内容，每次游戏体验独一无二
- **高度可定制**：玩家可创建自己的故事模板，定义游戏规则
- **多模式支持**：支持恋爱冒险、奇幻RPG、恐怖悬疑等多种游戏类型
- **智能体协作**：多智能体分工协作，确保游戏逻辑的一致性和丰富性

---

## 二、技术架构

### 2.1 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|----------|----------|
| 前端框架 | React 18 + TypeScript | 组件化开发，类型安全，生态丰富 |
| 状态管理 | Zustand / Redux Toolkit | 轻量级状态管理，支持持久化 |
| UI组件库 | Ant Design / 自定义组件 | 经典RPG风格UI，可定制主题 |
| 后端框架 | Node.js + Express / Fastify | 异步处理能力强，与前端技术栈统一 |
| 数据库 | SQLite (better-sqlite3) | 轻量级本地数据库，无需额外服务 |
| AI接口 | 统一适配器模式 | 支持DeepSeek、GLM-5、Kimi等多模型 |
| 实时通信 | WebSocket (可选) | 预留多人扩展接口 |

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户界面层 (UI Layer)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 主菜单   │ │ 游戏界面 │ │ 存档管理 │ │ 设置中心 │ │ 开发者面板│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 任务面板 │ │ 人物面板 │ │ 技能面板 │ │ 装备面板 │ │ 背包面板 │ │ 小地图   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ 战斗状态 │ │ NPC记录  │ │ 故事记录 │ │ 动态UI   │                       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           业务逻辑层 (Business Layer)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        UI管理器 (UI Manager)                         │   │
│  │  • 接收智能体指令  • 解析UI动作  • 更新界面状态  • 渲染Markdown组件   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      游戏状态管理器 (Game State)                      │   │
│  │  • 角色数据  • 任务数据  • 地图数据  • 背包数据  • 战斗数据          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          智能体层 (Agent Layer)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    统筹管理智能体 (Coordinator Agent)                 │   │
│  │  • 任务分配  • 冲突解决  • 结果整合  • 流程控制                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                    │                    │                    │    │
│         ▼                    ▼                    ▼                    ▼    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │故事上下文  │ │ 任务管理   │ │ 地图管理   │ │ NPC/队伍   │               │
│  │ 智能体     │ │ 智能体     │ │ 智能体     │ │ 智能体     │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ 数值管理   │ │ 背包系统   │ │ 技能管理   │ │ UI管理     │               │
│  │ 智能体     │ │ 智能体     │ │ 智能体     │ │ 智能体     │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          服务层 (Service Layer)                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ LLM适配器    │ │ 上下文压缩   │ │ 记忆管理     │ │ 存档服务     │       │
│  │ Service      │ │ Service      │ │ Service      │ │ Service      │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ 文生图服务   │ │ 音频服务     │ │ Token统计    │ │ 模板解析     │       │
│  │ (可选)       │ │ (可选)       │ │ Service      │ │ Service      │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          数据层 (Data Layer)                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        SQLite 数据库                                  │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │存档表   │ │ 角色表  │ │ 任务表  │ │ 地图表  │ │ 背包表  │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │技能表   │ │ NPC表   │ │ 对话表  │ │ 模板表  │ │ 设置表  │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 数据流架构

```
玩家操作 → UI事件捕获 → 事件封装 → 发送给统筹智能体
                                          │
                                          ▼
                              统筹智能体分析意图
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              调用相关智能体         调用相关智能体         调用相关智能体
              (并行处理)             (并行处理)             (并行处理)
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          ▼
                              统筹智能体整合结果
                                          │
                                          ▼
                              发送给UI管理智能体
                                          │
                                          ▼
                              标准化UI指令生成
                                          │
                                          ▼
                              UI渲染更新 → 显示给玩家
```

---

## 三、核心功能模块详细设计

### 3.1 故事模板系统

#### 3.1.1 模板结构定义

```typescript
interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  
  // 游戏模式配置
  gameMode: 'text_adventure' | 'turn_based_rpg' | 'visual_novel' | 'dynamic_combat';
  
  // 世界观设定
  worldSetting: {
    name: string;
    description: string;
    era: string;
    magicSystem?: string;
    technologyLevel: string;
    customFields: Record<string, string>;
  };
  
  // 角色创建规则
  characterCreation: {
    races: RaceDefinition[];
    classes: ClassDefinition[];
    backgrounds: BackgroundDefinition[];
    attributes: AttributeDefinition[];
    customOptions?: CustomOption[];
  };
  
  // 游戏规则
  gameRules: {
    combatSystem: CombatRuleSet;
    skillSystem: SkillRuleSet;
    inventorySystem: InventoryRuleSet;
    questSystem: QuestRuleSet;
    customRules?: CustomRule[];
  };
  
  // AI行为约束
  aiConstraints: {
    tone: 'serious' | 'humorous' | 'dark' | 'romantic' | 'custom';
    contentRating: 'everyone' | 'teen' | 'mature';
    prohibitedTopics: string[];
    requiredElements: string[];
  };
  
  // 初始场景
  startingScene: {
    location: string;
    description: string;
    npcs: string[];
    items: string[];
    quests: string[];
  };
  
  // UI主题配置
  uiTheme: {
    primaryColor: string;
    fontFamily: string;
    backgroundStyle: string;
    customCSS?: string;
  };
}
```

#### 3.1.2 可视化模板编辑器

**编辑器功能模块：**

| 模块 | 功能描述 |
|------|----------|
| 基础信息编辑 | 模板名称、描述、版本、作者、标签、游戏模式 |
| 世界观构建器 | 可视化编辑世界设定，支持自定义字段，支持 AI 自动生成 |
| 种族编辑器 | 定义种族属性加成/惩罚、特性、可选职业，支持 AI 自动生成 |
| 职业编辑器 | 定义职业主属性、生命骰、技能熟练、初始装备，支持 AI 自动生成 |
| 背景编辑器 | 定义背景故事、技能熟练、语言、背景特性，支持 AI 自动生成 |
| 属性编辑器 | 自定义角色属性系统，支持添加/编辑/删除属性 |
| 规则配置器 | 配置战斗规则、技能规则、物品规则、任务规则、数值复杂度、特殊规则 |
| AI约束设置 | 设置AI行为边界、内容过滤、风格指导、AI行为配置（响应风格/详细程度/玩家自由度） |
| 场景设计器 | 设计初始场景、NPC布局、物品、任务，支持 AI 自动生成完整场景 |
| UI主题定制 | 自定义UI颜色、字体、背景样式、自定义CSS |
| 界面布局 | 小地图、战斗面板、技能栏、队伍面板显示控制 |
| 预览测试 | 实时预览角色创建流程和初始场景，快速测试模板效果 |

#### 3.1.3 预设模板示例

**模板1：中世纪奇幻冒险**
- 游戏模式：回合制RPG
- 种族：人类、精灵、矮人（含完整属性加成和特殊能力）
- 职业：战士、法师、盗贼、圣骑士、游侠（含技能熟练和初始装备）
- 背景：贵族后裔、农夫之子、流浪孤儿
- 特色：魔法系统、装备强化、副本探索
- AI风格：叙事风格、详细描述、平衡自由度
- UI风格：羊皮纸风格、古典字体

**模板2：现代都市恋爱**
- 游戏模式：视觉小说（叙事型战斗）
- 种族：无（固定人类）
- 职业：学生、上班族、自由职业者
- 背景：转校生、青梅竹马、职场新人
- 特色：好感度系统、多结局、日常事件
- AI风格：叙事风格、详细描述、引导式体验
- UI风格：现代简约、粉色主色调

**模板3：克苏鲁恐怖调查**
- 游戏模式：纯文字冒险（KP模式）
- 种族：无（固定人类）
- 职业：侦探、记者、医生、学者
- 背景：私家侦探、考古学家、精神科医生
- 特色：SAN值系统、线索收集、多分支剧情、永久死亡
- 特殊规则：KP模式、永久死亡、仅检查点存档
- AI风格：叙事风格、详细描述、引导式体验
- UI风格：暗黑风格、深色主色调

**模板4：赛博朋克佣兵**
- 游戏模式：动态战斗（混合型）
- 种族：自然人、改造人、仿生人
- 职业：黑客、佣兵、医生、商人
- 背景：街头孤儿、企业叛逃者、退伍军人
- 特色：义体系统、黑客战斗、派系声望
- AI风格：自适应风格、正常详细度、自由形式
- UI风格：赛博朋克风格、霓虹色主色调

#### 3.1.4 AI 辅助生成功能

模板编辑器支持 AI 辅助生成以下内容：
- 世界观设定：根据模板名称和描述自动生成完整世界观
- 种族定义：根据世界观生成种族（含属性加成、特殊能力）
- 职业定义：根据世界观和种族生成职业（含主属性、技能、装备）
- 背景定义：根据世界观、种族、职业生成背景故事
- 起始场景：生成完整起始场景（含NPC、物品、任务）

#### 3.1.5 属性系统

支持自定义角色属性系统：
- 默认 6 种属性：力量(STR)、敏捷(DEX)、体质(CON)、智力(INT)、感知(WIS)、魅力(CHA)
- 可添加自定义属性
- 属性 ID 用于种族加成和职业主属性配置

---

### 3.2 角色创建系统

#### 3.2.1 创建流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      角色创建流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 输入角色名称                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  玩家输入角色名 → AI生成符合背景的3个种族选项            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Step 2: 选择种族                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  显示3个种族选项（含描述、特性、外观）                   │   │
│  │  玩家选择 → AI生成符合种族的3个职业选项                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Step 3: 选择职业                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  显示3个职业选项（含技能、定位、初始装备）               │   │
│  │  玩家选择 → AI生成符合种族+职业的3个背景选项             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Step 4: 选择个人背景                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  显示3个背景选项（含故事、属性加成、特殊技能）           │   │
│  │  玩家选择 → AI生成完整角色卡                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Step 5: 角色确认与初始化                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  显示完整角色卡 → 玩家确认/重新生成                      │   │
│  │  确认后 → 初始化场景、地图、背包、技能等                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 角色数据结构

```typescript
interface Character {
  id: string;
  name: string;
  race: Race;
  class: Class;
  background: Background;
  
  // 基础属性
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    customAttributes?: Record<string, number>;
  };
  
  // 派生属性
  derivedStats: {
    maxHealth: number;
    currentHealth: number;
    maxMana: number;
    currentMana: number;
    attack: number;
    defense: number;
    speed: number;
    luck: number;
    customStats?: Record<string, number>;
  };
  
  // 技能
  skills: Skill[];
  
  // 装备槽位（引用inventory中已装备物品的id）
  equipment: {
    weapon?: string;      // 武器槽 - 对应inventory中物品的id
    head?: string;        // 头部槽
    body?: string;        // 身体槽
    feet?: string;        // 脚部槽
    accessory?: string[]; // 饰品槽（可多个）
    customSlots?: Record<string, string>;  // 自定义槽位
  };
  
  // 背包（所有物品存储在这里）
  inventory: InventoryItem[];
  
  // 金钱
  currency: Record<string, number>;
  
  // 状态效果
  statusEffects: StatusEffect[];
  
  // 角色描述
  appearance: string;
  personality: string;
  backstory: string;
  
  // 统计数据
  statistics: {
    battlesWon: number;
    questsCompleted: number;
    distanceTraveled: number;
    itemsCrafted: number;
    npcsMet: number;
    playTime: number;
  };
}
```

---

### 3.3 智能体系统设计

#### 3.3.1 智能体架构总览

```typescript
interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  
  // 能力定义
  capabilities: string[];
  
  // 可调用的其他智能体
  canCallAgents: AgentType[];
  
  // 可访问的数据
  dataAccess: string[];
  
  // 记忆系统
  memory: AgentMemory;
  
  // 提示词模板
  systemPrompt: string;
  
  // 调用配置
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  };
}

enum AgentType {
  COORDINATOR = 'coordinator',           // 统筹管理
  STORY_CONTEXT = 'story_context',       // 故事上下文
  QUEST = 'quest',                       // 任务管理
  MAP = 'map',                           // 地图管理
  NPC_PARTY = 'npc_party',               // NPC和队伍
  NUMERICAL = 'numerical',               // 数值管理
  INVENTORY = 'inventory',               // 背包系统
  SKILL = 'skill',                       // 技能管理
  UI = 'ui',                             // UI管理
  COMBAT = 'combat',                     // 战斗管理
  DIALOGUE = 'dialogue',                 // 对话管理
  EVENT = 'event'                        // 事件管理
}
```

#### 3.3.2 各智能体详细设计

##### 3.3.2.1 统筹管理智能体 (Coordinator Agent)

**职责定义：**
- 接收玩家输入，分析意图
- 分配任务给合适的智能体
- 协调智能体之间的协作
- 解决智能体之间的冲突
- 整合所有智能体的输出结果
- 控制游戏整体流程

**能力清单：**
| 能力 | 描述 |
|------|------|
| 意图分析 | 分析玩家输入的真实意图 |
| 任务分配 | 将复杂任务拆分并分配给合适的智能体 |
| 冲突检测 | 检测智能体输出之间的逻辑冲突 |
| 冲突解决 | 通过重新调用或协商解决冲突 |
| 结果整合 | 将多个智能体的输出合并为完整响应 |
| 流程控制 | 控制游戏的阶段转换 |

**可调用智能体：** 所有其他智能体

**数据访问权限：** 全部游戏数据（只读）

**系统提示词模板：**
```
你是游戏的主控制器和协调者。你的职责是：
1. 分析玩家输入，理解其真实意图
2. 决定需要调用哪些智能体来处理
3. 协调智能体之间的工作
4. 解决智能体输出之间的冲突
5. 整合最终结果

你通过JSON格式与其他智能体通信。所有输出必须遵循标准协议。

当前游戏状态：
{{gameState}}

玩家输入：
{{playerInput}}

请分析并决定如何处理。
```

##### 3.3.2.2 故事上下文管理智能体 (Story Context Agent)

**职责定义：**
- 维护故事的主线剧情
- 记录玩家的重大选择
- 管理故事的分支和收敛
- 确保故事的一致性
- 生成剧情摘要

**记忆系统：**
```typescript
interface StoryMemory {
  // 主线剧情节点
  mainPlotPoints: PlotPoint[];
  
  // 玩家选择记录
  playerChoices: {
    id: string;
    timestamp: number;
    choice: string;
    consequence: string;
    impact: string[];
  }[];
  
  // 重要事件记录
  keyEvents: {
    id: string;
    description: string;
    involvedNPCs: string[];
    location: string;
    significance: 'minor' | 'major' | 'critical';
  }[];
  
  // 剧情摘要（压缩后）
  summary: {
    shortTerm: string;    // 最近10轮对话的摘要
    midTerm: string;      // 最近50轮对话的摘要
    longTerm: string;     // 整体故事摘要
  };
  
  // 世界状态变化
  worldChanges: {
    id: string;
    change: string;
    reason: string;
    timestamp: number;
  }[];
}
```

##### 3.3.2.3 任务管理智能体 (Quest Agent)

**职责定义：**
- 生成主线/支线任务
- 追踪任务进度
- 处理任务完成和失败
- 生成任务奖励
- 管理任务链

**任务数据结构：**
```typescript
interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'hidden' | 'daily' | 'chain';
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'failed';
  
  // 任务目标
  objectives: {
    id: string;
    description: string;
    type: 'kill' | 'collect' | 'talk' | 'explore' | 'custom';
    target: string;
    current: number;
    required: number;
    isCompleted: boolean;
  }[];
  
  // 前置任务
  prerequisites: string[];
  
  // 奖励
  rewards: {
    experience?: number;
    currency?: Record<string, number>;
    items?: { itemId: string; quantity: number }[];
    reputation?: Record<string, number>;
    custom?: Record<string, any>;
  };
  
  // 时间限制
  timeLimit?: number;
  
  // 任务日志
  log: {
    timestamp: number;
    event: string;
  }[];
}
```

##### 3.3.2.4 地图管理智能体 (Map Agent)

**职责定义：**
- 管理游戏世界地图
- 生成新区域和地点
- 处理玩家移动
- 管理地点事件
- 维护地点之间的连接关系

**地图数据结构：**
```typescript
interface GameMap {
  id: string;
  name: string;
  description: string;
  
  // 地图层级
  layers: {
    world: WorldMap;      // 世界地图
    region: RegionMap[];  // 区域地图
    location: Location[]; // 具体地点
  };
  
  // 当前位置
  currentLocation: {
    worldId: string;
    regionId: string;
    locationId: string;
  };
  
  // 已探索区域
  exploredAreas: string[];
  
  // 地点连接
  connections: {
    from: string;
    to: string;
    type: 'road' | 'portal' | 'hidden';
    travelTime: number;
    requirements?: Condition[];
  }[];
}

interface Location {
  id: string;
  name: string;
  description: string;
  type: 'city' | 'village' | 'dungeon' | 'wilderness' | 'building' | 'custom';
  
  // 地点特性
  features: string[];
  
  // 存在的NPC
  npcs: string[];
  
  // 可交互对象
  interactables: {
    id: string;
    name: string;
    type: string;
    description: string;
  }[];
  
  // 可获取物品
  items: string[];
  
  // 可触发事件
  events: string[];
  
  // 环境状态
  environment: {
    time: 'day' | 'night' | 'dawn' | 'dusk';
    weather: string;
    atmosphere: string;
  };
}
```

##### 3.3.2.5 NPC和队伍管理智能体 (NPC & Party Agent)

**职责定义：**
- 管理所有NPC的信息
- 控制NPC的行为和对话
- 管理玩家队伍成员
- 处理NPC关系和好感度
- 生成NPC互动事件

**NPC数据结构：**
```typescript
interface NPC {
  id: string;
  name: string;
  title?: string;
  
  // 基本信息
  race: string;
  occupation: string;
  age: number;
  gender: string;
  
  // 外观描述
  appearance: {
    description: string;
    imagePrompt?: string;
    generatedImage?: string;
  };
  
  // 性格特征
  personality: {
    traits: string[];
    values: string[];
    fears: string[];
    desires: string[];
  };
  
  // 与玩家的关系
  relationship: {
    type: 'neutral' | 'friendly' | 'hostile' | 'romantic' | 'custom';
    level: number;  // -100 到 100
    trustLevel: number;
    interactionCount: number;
    lastInteraction: number;
  };
  
  // 对话历史
  dialogueHistory: {
    id: string;
    timestamp: number;
    topic: string;
    summary: string;
  }[];
  
  // NPC状态
  status: {
    health: number;
    mood: string;
    currentLocation: string;
    isAvailable: boolean;
    schedule?: ScheduleItem[];
  };
  
  // 特殊标记
  flags: {
    isCompanion: boolean;
    isMerchant: boolean;
    isQuestGiver: boolean;
    isRomanceable: boolean;
    customFlags: Record<string, boolean>;
  };
}
```

##### 3.3.2.6 数值管理智能体 (Numerical Agent)

**职责定义：**
- 管理角色属性计算
- 处理战斗数值
- 管理经验值和等级
- 计算伤害和治疗效果
- 平衡游戏数值

**数值系统：**
```typescript
interface NumericalSystem {
  // 等级系统
  leveling: {
    currentLevel: number;
    currentExp: number;
    expToNextLevel: number;
    levelCurve: 'linear' | 'exponential' | 'custom';
    levelRewards: {
      level: number;
      attributePoints: number;
      skillPoints: number;
      unlocks: string[];
    }[];
  };
  
  // 属性计算公式
  formulas: {
    health: string;      // 例如: "10 + constitution * 5 + level * 2"
    mana: string;
    attack: string;
    defense: string;
    damage: string;
    healing: string;
    custom: Record<string, string>;
  };
  
  // 成长系统
  growth: {
    attributeGrowth: Record<string, number>;
    skillGrowth: Record<string, number>;
  };
}
```

##### 3.3.2.7 背包系统管理智能体 (Inventory Agent)

**职责定义：**
- 管理玩家背包（消耗品、材料、任务物品等）
- 处理物品获取和消耗
- 管理装备系统（装备槽位、装备穿戴/卸下、属性加成计算）
- 处理物品交易
- 生成物品描述

**物品数据结构：**
```typescript
interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';
  
  // 物品属性
  stats: Record<string, number>;
  
  // 特殊效果
  effects: {
    type: string;
    value: number;
    duration?: number;
    condition?: string;
  }[];
  
  // 使用要求
  requirements: {
    level?: number;
    class?: string[];
    attributes?: Record<string, number>;
    custom?: string[];
  };
  
  // 价值
  value: {
    buy: number;
    sell: number;
    currency: string;
  };
  
  // 堆叠
  stackable: boolean;
  maxStack: number;
  
  // 图像
  imagePrompt?: string;
  generatedImage?: string;
}

interface InventoryItem {
  item: Item;
  quantity: number;
  equipped: boolean;        // 是否已装备
  equipmentSlot?: string;   // 装备槽位类型：'weapon' | 'head' | 'body' | 'feet' | 'accessory' | custom
  obtainedAt: number;
  customData?: Record<string, any>;
}

// 装备槽位类型
type EquipmentSlotType = 'weapon' | 'head' | 'body' | 'feet' | 'accessory' | string;
```

##### 3.3.2.8 技能管理智能体 (Skill Agent)

**职责定义：**
- 管理角色技能
- 处理技能学习和升级
- 计算技能效果
- 管理技能冷却
- 生成技能描述

**技能数据结构：**
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive' | 'toggle';
  category: 'combat' | 'magic' | 'craft' | 'social' | 'exploration' | 'custom';
  
  // 技能等级
  level: number;
  maxLevel: number;
  upgradeCost: {
    skillPoints: number;
    requirements?: string[];
  };
  
  // 技能效果
  effects: {
    type: string;
    baseValue: number;
    scaling: {
      attribute: string;
      coefficient: number;
    };
    levelScaling: number;
  }[];
  
  // 消耗
  cost: {
    type: 'mana' | 'health' | 'stamina' | 'custom';
    baseValue: number;
    levelScaling: number;
  };
  
  // 冷却
  cooldown: {
    base: number;
    levelReduction: number;
  };
  
  // 使用条件
  requirements: {
    weapons?: string[];
    stance?: string;
    custom?: string[];
  };
  
  // 前置技能
  prerequisites: string[];
  
  // 视觉效果
  visualEffect: {
    animation: string;
    particles: string;
    sound: string;
  };
}
```

##### 3.3.2.9 UI管理智能体 (UI Agent)

**职责定义：**
- 解析其他智能体的输出
- 生成标准化UI指令
- 管理动态UI组件
- 处理UI交互事件
- 格式化文本显示

**UI指令协议：**
```typescript
interface UIInstruction {
  type: 'update' | 'show' | 'hide' | 'animate' | 'notify' | 'dialog' | 'custom';
  target: string;  // 目标UI组件
  action: string;
  data: any;
  options?: {
    duration?: number;
    easing?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

// 示例：更新角色血量
const updateHealthInstruction: UIInstruction = {
  type: 'update',
  target: 'character_panel.health',
  action: 'setValue',
  data: {
    current: 85,
    max: 100,
    change: -15,
    reason: '受到攻击'
  },
  options: {
    priority: 'high'
  }
};

// 示例：显示通知
const notifyInstruction: UIInstruction = {
  type: 'notify',
  target: 'notification_area',
  action: 'show',
  data: {
    type: 'success',
    title: '任务完成',
    message: '你成功完成了【新手教程】任务！',
    duration: 5000
  }
};
```

#### 3.3.3 智能体通信协议

**消息格式：**
```typescript
interface AgentMessage {
  id: string;
  timestamp: number;
  
  // 发送者和接收者
  from: AgentType;
  to: AgentType | AgentType[];
  
  // 消息类型
  type: 'request' | 'response' | 'notification' | 'error';
  
  // 消息内容
  payload: {
    action: string;
    data: any;
    context?: any;
  };
  
  // 元数据
  metadata: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    requiresResponse: boolean;
    timeout?: number;
    retryCount?: number;
  };
  
  // 关联消息ID（用于追踪请求-响应链）
  correlationId?: string;
}
```

**通信流程示例：**
```
玩家输入："我想装备这把剑"
    │
    ▼
统筹智能体分析意图
    │
    ├──► 发送消息给背包智能体
    │    { from: 'coordinator', to: 'inventory', 
    │      type: 'request', payload: { action: 'equip', data: { itemId: 'sword_001' } } }
    │
    ├──► 背包智能体处理
    │    │
    │    ├──► 发送消息给数值智能体（计算属性变化）
    │    │    { from: 'inventory', to: 'numerical', ... }
    │    │
    │    └──► 返回结果给统筹智能体
    │         { from: 'inventory', to: 'coordinator',
    │           type: 'response', payload: { success: true, changes: {...} } }
    │
    └──► 统筹智能体整合结果
         │
         └──► 发送消息给UI智能体
              { from: 'coordinator', to: 'ui',
                type: 'request', payload: { action: 'updateMultiple', data: {...} } }
```

---

### 3.4 上下文压缩机制

#### 3.4.1 压缩策略

```
┌─────────────────────────────────────────────────────────────────┐
│                     上下文压缩策略                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: 实时上下文 (最近 5-10 轮对话)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 保持完整对话内容                                        │   │
│  │ • 包含所有细节和描述                                      │   │
│  │ • 用于即时响应生成                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Layer 2: 短期记忆 (最近 20-50 轮对话)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 压缩为摘要形式                                          │   │
│  │ • 保留关键决策和事件                                      │   │
│  │ • 保留重要NPC互动                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Layer 3: 中期记忆 (最近 100-200 轮对话)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 高度压缩的剧情摘要                                      │   │
│  │ • 只保留主线和重要支线                                    │   │
│  │ • 关键数值变化记录                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  Layer 4: 长期记忆 (整个游戏历程)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 世界状态快照                                            │   │
│  │ • 角色成长记录                                            │   │
│  │ • 重大事件时间线                                          │   │
│  │ • 存储在数据库中，按需检索                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.4.2 压缩触发条件

| 条件 | 触发阈值 | 压缩操作 |
|------|----------|----------|
| 对话轮数 | 每10轮 | 更新短期摘要 |
| Token数量 | 超过阈值80% | 执行层级压缩 |
| 场景切换 | 每次切换 | 压缩当前场景 |
| 任务完成 | 每次完成 | 压缩任务相关对话 |
| 存档时 | 每次存档 | 全量压缩并持久化 |

#### 3.4.3 压缩算法

```typescript
interface CompressionResult {
  // 压缩后的摘要
  summary: string;
  
  // 提取的关键信息
  keyInfo: {
    decisions: Decision[];
    events: Event[];
    npcs: string[];
    items: string[];
    locations: string[];
  };
  
  // 压缩统计
  stats: {
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
  };
}

async function compressContext(
  messages: Message[],
  level: 'short' | 'medium' | 'long'
): Promise<CompressionResult> {
  // 1. 提取关键信息
  const keyInfo = extractKeyInformation(messages);
  
  // 2. 生成摘要
  const summary = await generateSummary(messages, level, keyInfo);
  
  // 3. 返回压缩结果
  return {
    summary,
    keyInfo,
    stats: calculateStats(messages, summary)
  };
}
```

---

### 3.5 动态UI生成系统

#### 3.5.1 Markdown UI组件规范

**基础组件：**

| 组件类型 | Markdown语法 | 渲染效果 |
|----------|--------------|----------|
| 标题 | `## 标题` | 系统通知标题 |
| 分割线 | `---` | 视觉分隔 |
| 列表 | `- 项目` | 选项列表 |
| 表格 | `| 列1 | 列2 |` | 属性展示 |
| 引用 | `> 引用内容` | NPC对话/系统提示 |
| 代码块 | ` ```类型 ` | 特殊格式内容 |

**扩展组件：**

```markdown
<!-- 选项按钮 -->
:::options
[选项A](action:choose_a) [选项B](action:choose_b) [选项C](action:choose_c)
:::

<!-- 进度条 -->
:::progress{value=75 max=100}
生命值: 75/100
:::

<!-- 标签页 -->
:::tabs
[属性](tab:attributes) [技能](tab:skills) [装备](tab:equipment)
:::

<!-- 悬浮提示 -->
[神秘宝箱](tooltip:里面似乎装着珍贵的东西...)

<!-- 条件显示 -->
:::if{condition="has_skill:appraisal"}
你使用鉴定技能，发现这是一个古老的魔法物品。
:::

<!-- 徽章 -->
:::badge{type=rarity color=gold}
传说级
:::
```

#### 3.5.2 特殊UI场景示例

**场景1：系统通知**
```markdown
:::system-notify{type=achievement}
## 🏆 成就解锁！
**首次击杀**
你成功击败了第一个敌人，迈出了冒险的第一步！

---
奖励：
- 经验值 +50
- 金币 +10
- 称号：【初出茅庐】
:::
```

**场景2：装备强化**
```markdown
:::enhancement
## ⚒️ 装备强化

当前装备：**精钢长剑** (Lv.3)
成功率：**65%**

| 属性 | 当前 | 强化后 |
|------|------|--------|
| 攻击力 | 25 | 32 |
| 暴击率 | 5% | 8% |

所需材料：
- 强化石 x3 ✓
- 金币 x100 ✓

:::options
[确认强化](action:confirm_enhance) [取消](action:cancel)
:::
:::
```

**场景3：银行/仓库**
```markdown
:::warehouse
## 🏦 仓库管理

**背包空间**: 45/50
**仓库空间**: 120/200

:::tabs
[全部](tab:all) [装备](tab:equipment) [材料](tab:material) [任务](tab:quest)
:::

| 物品 | 数量 | 操作 |
|------|------|------|
| 强化石 | 15 | [存入](action:deposit:stone) [取出](action:withdraw:stone) |
| 治疗药水 | 8 | [存入](action:deposit:potion) [取出](action:withdraw:potion) |

:::options
[整理仓库](action:organize) [关闭](action:close)
:::
:::
```

---

### 3.6 游戏模式系统

#### 3.6.1 模式定义

```typescript
interface GameMode {
  id: string;
  name: string;
  description: string;
  
  // 战斗系统类型
  combatType: 'narrative' | 'turn_based' | 'real_time' | 'hybrid';
  
  // UI布局配置
  uiLayout: {
    showMinimap: boolean;
    showCombatPanel: boolean;
    showSkillBar: boolean;
    showPartyPanel: boolean;
    customLayout?: string;
  };
  
  // 数值系统复杂度
  numericalComplexity: 'simple' | 'medium' | 'complex';
  
  // AI行为模式
  aiBehavior: {
    responseStyle: 'narrative' | 'mechanical' | 'adaptive';
    detailLevel: 'brief' | 'normal' | 'detailed';
    playerAgency: 'guided' | 'balanced' | 'freeform';
  };
  
  // 特殊规则
  specialRules: {
    hasKP: boolean;           // 是否有KP/GM角色
    permadeath: boolean;      // 是否永久死亡
    saveRestriction: string;  // 存档限制
    customRules: string[];
  };
}
```

#### 3.6.2 预设游戏模式

**模式1：纯文字冒险（KP模式）**
- 战斗类型：叙事式
- UI布局：极简，隐藏战斗面板
- 数值复杂度：简单
- AI行为：叙事风格，详细描述，自由度高
- 特殊规则：有KP角色，无存档限制

**模式2：回合制RPG**
- 战斗类型：回合制
- UI布局：完整RPG界面
- 数值复杂度：复杂
- AI行为：机械风格，正常细节，引导式
- 特殊规则：无KP，存档点限制

**模式3：视觉小说**
- 战斗类型：无战斗
- UI布局：对话为主，隐藏地图
- 数值复杂度：简单（好感度为主）
- AI行为：叙事风格，详细情感描述
- 特殊规则：多结局系统

**模式4：动态战斗冒险**
- 战斗类型：混合式
- UI布局：动态切换
- 数值复杂度：中等
- AI行为：自适应风格
- 特殊规则：动态难度调整

---

### 3.7 存档系统

#### 3.7.1 存档数据结构

```typescript
interface SaveData {
  id: string;
  name: string;
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
    character: Character;
    quests: Quest[];
    inventory: InventoryItem[];
    map: GameMap;
    npcs: NPC[];
    story: StoryMemory;
    settings: GameSettings;
  };
  
  // 元数据
  metadata: {
    version: string;
    template: string;
    checksum: string;
  };
}
```

#### 3.7.2 存档管理功能

| 功能 | 描述 |
|------|------|
| 快速存档 | 一键存档到快速存档槽 |
| 快速读档 | 一键读取快速存档 |
| 手动存档 | 选择存档槽位存档 |
| 自动存档 | 场景切换/任务完成时自动存档 |
| 存档导出 | 导出存档为文件 |
| 存档导入 | 从文件导入存档 |
| 存档删除 | 删除指定存档 |
| 存档对比 | 对比两个存档的差异 |

---

### 3.8 设置系统

#### 3.8.1 设置分类

```typescript
interface GameSettings {
  // AI模型设置
  ai: {
    // 主模型配置
    primaryModel: {
      provider: 'deepseek' | 'glm' | 'kimi' | 'openai' | 'custom';
      model: string;
      apiKey: string;
      baseUrl?: string;
    };
    
    // 智能体模型分配
    agentModels: Record<AgentType, {
      provider: string;
      model: string;
      temperature: number;
      maxTokens: number;
    }>;
    
    // 高级参数
    advanced: {
      temperature: number;
      topP: number;
      frequencyPenalty: number;
      presencePenalty: number;
    };
  };
  
  // 显示设置
  display: {
    theme: 'light' | 'dark' | 'custom';
    customTheme?: CustomTheme;
    fontSize: number;
    fontFamily: string;
    animationSpeed: 'slow' | 'normal' | 'fast' | 'none';
    language: string;
  };
  
  // 游戏设置
  gameplay: {
    textSpeed: number;
    autoSave: boolean;
    autoSaveInterval: number;
    showTutorial: boolean;
    difficulty: 'easy' | 'normal' | 'hard' | 'custom';
  };
  
  // 音频设置
  audio: {
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    voiceVolume: number;
  };
  
  // 开发者设置
  developer: {
    enabled: boolean;
    showDebugPanel: boolean;
    showAgentCommunication: boolean;
    showTokenUsage: boolean;
    showPerformanceMetrics: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  
  // 扩展功能
  extensions: {
    imageGeneration: {
      enabled: boolean;
      provider: 'stable_diffusion' | 'dalle' | 'midjourney' | 'custom';
      model: string;
      style: string;
    };
    audioGeneration: {
      enabled: boolean;
      provider: string;
      model: string;
    };
  };
}
```

#### 3.8.2 主题定制系统

```typescript
interface CustomTheme {
  id: string;
  name: string;
  
  // 颜色方案
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // 字体
  fonts: {
    heading: string;
    body: string;
    monospace: string;
  };
  
  // 边框和阴影
  effects: {
    borderRadius: number;
    shadowIntensity: 'none' | 'light' | 'medium' | 'heavy';
    glowEffects: boolean;
  };
  
  // 背景
  background: {
    type: 'color' | 'gradient' | 'image';
    value: string;
    overlay?: string;
  };
  
  // 自定义CSS
  customCSS?: string;
}
```

---

### 3.9 开发者工具

#### 3.9.1 调试面板功能

| 功能模块 | 描述 |
|----------|------|
| 请求监控 | 显示所有LLM API请求和响应 |
| 智能体通信 | 实时显示智能体之间的消息流 |
| Token统计 | 显示各智能体的Token消耗明细 |
| 性能监控 | 显示响应时间、内存使用等指标 |
| 状态检查 | 查看和修改游戏状态 |
| 日志查看 | 查看系统日志，支持过滤 |
| 测试工具 | 快速测试AI响应、触发事件等 |

#### 3.9.2 开发者面板UI

```
┌─────────────────────────────────────────────────────────────────┐
│ 开发者工具                                              [─][□][×] │
├─────────────────────────────────────────────────────────────────┤
│ [请求] [智能体] [Token] [性能] [状态] [日志] [测试]              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 请求列表                                    Token: 1,234 │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ 14:32:15 [统筹智能体] → DeepSeek                     │ │   │
│  │ │ 状态: 成功  耗时: 2.3s  Token: 456/123              │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ 14:32:18 [故事智能体] → GLM-5                        │ │   │
│  │ │ 状态: 成功  耗时: 1.8s  Token: 234/89               │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 请求详情                                                 │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ Prompt: [查看]  Response: [查看]  Raw: [查看]       │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.10 多模型支持

#### 3.10.1 模型适配器架构

```typescript
interface LLMAdapter {
  name: string;
  
  // 初始化
  initialize(config: ModelConfig): Promise<void>;
  
  // 发送请求
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  
  // 流式响应
  chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  
  // 能力查询
  getCapabilities(): ModelCapabilities;
}

interface ModelCapabilities {
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCall: boolean;
  supportsVision: boolean;
  supportsJSON: boolean;
  contextWindow: number;
}

// 适配器实现示例
class DeepSeekAdapter implements LLMAdapter {
  name = 'deepseek';
  
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    // DeepSeek API调用实现
  }
  
  // ... 其他方法实现
}

class GLMAdapter implements LLMAdapter {
  name = 'glm';
  
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    // GLM API调用实现
  }
  
  // ... 其他方法实现
}
```

#### 3.10.2 支持的模型列表

| 提供商 | 模型 | 特点 | 推荐用途 |
|--------|------|------|----------|
| DeepSeek | deepseek-chat | 性价比高，中文能力强 | 通用场景 |
| DeepSeek | deepseek-reasoner | 推理能力强 | 复杂决策 |
| GLM | glm-4 | 多模态，长上下文 | 故事生成 |
| Kimi | moonshot-v1 | 超长上下文 | 长篇故事 |
| OpenAI | gpt-4 | 综合能力强 | 高质量生成 |
| 本地 | Ollama | 隐私保护，无费用 | 离线使用 |

---

## 四、UI界面设计

### 4.1 主界面布局

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [菜单] [存档] [设置] [开发者]                              AI-RPG Engine    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │                          主游戏区域                                      │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │                                                                 │   │ │
│ │  │                     故事/对话显示区域                            │   │ │
│ │  │                                                                 │   │ │
│ │  │  你走进了一座古老的城堡，石墙上爬满了藤蔓。                      │   │ │
│ │  │  一位身穿银色铠甲的骑士从阴影中走出...                           │   │ │
│ │  │                                                                 │   │ │
│ │  │  > "欢迎来到艾尔德里克城堡，旅行者。"                           │   │ │
│ │  │                                                                 │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ 快速选项:                                                       │   │ │
│ │  │ [询问城堡的历史] [询问骑士的身份] [观察周围环境] [自定义回复]   │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│ │  │ [输入你的行动...]                                    [发送]    │   │ │
│ │  └─────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ [角色]   │ │ [技能]   │ │ [装备]   │ │ [背包]   │ │ [任务]   │ │ [地图]   │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│ │ 小地图           │ │ 队伍状态        │ │ 快捷栏                       │ │
│ │ ┌──────────────┐ │ │ ┌──────────────┐ │ │ [1][2][3][4][5][6][7][8][9] │ │
│ │ │    城堡      │ │ │ │ 艾琳(你)     │ │ │                              │ │
│ │ │   ○→●      │ │ │ │ HP: 85/100   │ │ │ 药水 | 技能 | 技能 | ...    │ │
│ │ │    森林      │ │ │ │ MP: 45/60    │ │ │                              │ │
│ │ │              │ │ │ └──────────────┘ │ └──────────────────────────────┘ │
│ │ └──────────────┘ │ │ ┌──────────────┐ │                                  │
│ │                  │ │ │ 凯尔(队友)   │ │                                  │
│ │ [世界地图]       │ │ │ HP: 92/100   │ │                                  │
│ └──────────────────┘ │ └──────────────┘ │                                  │
│                       └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 各面板详细设计

#### 4.2.1 角色面板

```
┌─────────────────────────────────────────────────────────────────┐
│ 角色信息                                              [关闭]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [角色头像]                                              │   │
│  │                                                          │   │
│  │  艾琳·夜风                                               │   │
│  │  种族: 半精灵  职业: 游侠  等级: Lv.5                    │   │
│  │  背景: 森林守望者                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 基础属性                                    [加点: 3]    │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ 力量(STR): 12  [+]  敏捷(DEX): 18  [+]              │ │   │
│  │ │ 体质(CON): 14  [+]  智力(INT): 10  [+]              │ │   │
│  │ │ 感知(WIS): 16  [+]  魅力(CHA): 13  [+]              │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 派生属性                                                │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │ 生命值: 85/100  ████████░░  魔法值: 45/60  ██████░░ │ │   │
│  │ │ 攻击力: 24      防御力: 18     速度: 22            │ │   │
│  │ │ 暴击率: 15%     暴击伤害: 180%  闪避率: 12%        │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 经验值: 1,250 / 2,000  ██████░░░░░  (62.5%)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 技能面板

```
┌─────────────────────────────────────────────────────────────────┐
│ 技能                                                [关闭]       │
├─────────────────────────────────────────────────────────────────┤
│ [战斗技能] [被动技能] [生活技能] [特殊技能]                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🏹 穿刺射击                                    Lv.3     │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 对单个敌人造成 150% 攻击力的伤害                         │   │
│  │ 有 25% 概率造成流血效果                                  │   │
│  │                                                          │   │
│  │ 消耗: 15 MP  冷却: 2回合                                 │   │
│  │                                                          │   │
│  │ [升级] (需要: 技能点 x1, 金币 x50)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🌿 自然感知                                    Lv.2     │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 被动: 在森林地形时，闪避率 +10%，追踪能力 +20%           │   │
│  │                                                          │   │
│  │ [升级] (需要: 技能点 x1, 金币 x30)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🐺 召唤狼伙伴                                  Lv.1     │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 召唤一只狼为你战斗，持续 5 回合                           │   │
│  │ 狼的属性基于你的感知值                                    │   │
│  │                                                          │   │
│  │ 消耗: 30 MP  冷却: 10回合                                │   │
│  │                                                          │   │
│  │ [升级] (需要: 技能点 x2, 金币 x100)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  技能点: 2  可用                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 装备面板

```
┌─────────────────────────────────────────────────────────────────┐
│ 装备                                                [关闭]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    当前装备槽位                          │   │
│  │                                                         │   │
│  │       ┌────┐                                            │   │
│  │       │👑  │  头部: 猎人帽                              │   │
│  │       └────┘  防御+5, 感知+2                            │   │
│  │                                                         │   │
│  │  ┌────┐      ┌────┐      ┌────┐                        │   │
│  │  │💍  │      │⚔️  │      │💍  │                        │   │
│  │  │饰品│      │武器│      │饰品│                        │   │
│  │  └────┘      └────┘      └────┘                        │   │
│  │  力量戒指    精钢长剑    幸运护符                       │   │
│  │  力量+3      攻击+25     幸运+5                         │   │
│  │                                                         │   │
│  │       ┌────┐                                            │   │
│  │       │🛡️  │  身体: 皮甲                               │   │
│  │       └────┘  防御+15, 闪避+3%                          │   │
│  │                                                         │   │
│  │       ┌────┐                                            │   │
│  │       │👢  │  脚部: 轻便靴                              │   │
│  │       └────┘  速度+5, 闪避+2%                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 装备属性加成汇总                                        │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 攻击力: +25  防御力: +20  速度: +5                      │   │
│  │ 力量: +3     感知: +2     幸运: +5                      │   │
│  │ 闪避率: +5%                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 选中装备详情: 精钢长剑                                  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 稀有度: ★★★☆☆ 稀有                                     │   │
│  │ 类型: 单手武器                                          │   │
│  │                                                         │   │
│  │ 属性: 攻击力 +25, 暴击率 +5%                            │   │
│  │ 特效: 对野兽类敌人伤害 +10%                             │   │
│  │ 需求: 等级 5, 力量 10                                   │   │
│  │                                                         │   │
│  │ [卸下装备] [强化] [详细信息]                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.4 背包面板

```
┌─────────────────────────────────────────────────────────────────┐
│ 背包                                                [关闭]       │
├─────────────────────────────────────────────────────────────────┤
│ [全部] [装备] [消耗品] [材料] [任务物品]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  容量: 35/50                                                    │
│                                                                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │🧪  │ │🧪  │ │�  │ │📜  │ │🍖  │ │🌿  │ │�️  │ │    │     │
│  │治疗│ │魔力│ │强华│ │地图│ │干粮│ │草药│ │古钥│ │    │     │
│  │药水│ │药水│ │石  │ │    │ │    │ │    │ │匙  │ │    │     │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │ │    │     │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │ │    │     │
│  │    │ │    │ │    │ │    │ │    │ │    │ │    │ │    │     │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 物品详情: 铁剑                                           │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 稀有度: ★★☆☆☆ 普通                                      │   │
│  │ 类型: 单手武器                                           │   │
│  │                                                          │   │
│  │ 属性: 攻击力 +15                                         │   │
│  │                                                          │   │
│  │ 描述: 一把普通的铁制长剑，结实耐用。                     │   │
│  │                                                          │   │
│  │ [装备] [丢弃] [详细信息]                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  金币: 1,234  银币: 56                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**设计说明：**
- 背包面板显示所有物品，包括未装备的装备类物品
- 装备面板专注于管理当前已装备的物品（显示在各槽位中）
- 物品存储在统一的物品池（inventory）中，通过 `equipmentSlot` 字段区分是否已装备
- 玩家可在背包面板点击装备类物品进行穿戴，或从装备面板卸下装备

#### 4.2.5 任务面板

```
┌─────────────────────────────────────────────────────────────────┐
│ 任务                                                [关闭]       │
├─────────────────────────────────────────────────────────────────┤
│ [主线] [支线] [已完成] [已失败]                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⭐ 城堡的秘密                                    进行中  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 调查艾尔德里克城堡中发生的怪事。                          │   │
│  │                                                          │   │
│  │ 目标:                                                    │   │
│  │   ✓ 与城堡守卫交谈                                       │   │
│  │   ○ 调查地下室 (0/1)                                     │   │
│  │   ○ 找到失踪的村民 (0/3)                                 │   │
│  │                                                          │   │
│  │ 奖励: 经验 +500, 金币 +200, 声望 +10                     │   │
│  │                                                          │   │
│  │ [追踪任务] [放弃任务]                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📜 猎狼者的请求                                  进行中  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 帮助村民消灭威胁农场的狼群。                              │   │
│  │                                                          │   │
│  │ 目标:                                                    │   │
│  │   ○ 击杀森林狼 (3/10)                                    │   │
│  │                                                          │   │
│  │ 奖励: 经验 +150, 金币 +50                                │   │
│  │                                                          │   │
│  │ [追踪任务] [放弃任务]                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、开发计划

### 5.1 MVP阶段 (核心功能版本 - 3-4个月)

#### 第一阶段：基础架构 (第1-4周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| 项目初始化 | 搭建React+Node.js项目框架 | P0 |
| 数据库设计 | SQLite数据库表结构设计与实现 | P0 |
| LLM适配器 | 实现DeepSeek/GLM/Kimi适配器 | P0 |
| 基础UI框架 | 主界面布局、主题系统 | P0 |
| 存档系统 | 存档/读档功能实现 | P0 |

#### 第二阶段：智能体系统 (第5-8周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| 智能体框架 | 智能体基类和通信协议 | P0 |
| 统筹智能体 | 核心协调逻辑 | P0 |
| 故事智能体 | 故事上下文管理 | P0 |
| UI智能体 | UI指令生成 | P0 |
| 智能体通信 | 消息队列和路由 | P0 |

#### 第三阶段：核心玩法 (第9-12周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| 角色创建 | 完整的角色创建流程 | P0 |
| 对话系统 | 玩家-AI对话交互 | P0 |
| 任务系统 | 任务生成和追踪 | P0 |
| 背包系统 | 物品管理功能 | P1 |
| 装备系统 | 装备槽位、穿戴/卸下、属性加成 | P1 |
| 数值系统 | 属性计算和战斗 | P1 |

#### 第四阶段：完善优化 (第13-16周)

| 任务 | 描述 | 优先级 |
|------|------|--------|
| 模板系统 | 故事模板编辑器 | P1 |
| 设置系统 | 完整设置界面 | P1 |
| 上下文压缩 | 记忆管理优化 | P1 |
| UI完善 | 各面板完整实现 | P1 |
| 测试优化 | Bug修复和性能优化 | P1 |

### 5.2 后续迭代计划

**版本1.1：战斗增强**
- 完整回合制战斗系统
- 战斗动画效果
- 更多战斗技能

**版本1.2：社交系统**
- NPC好感度系统
- 恋爱系统
- 派系声望

**版本1.3：扩展功能**
- 文生图集成
- 音频生成
- 成就系统

**版本2.0：多人模式**
- 多人联机支持
- 房间系统
- 协作冒险

---

## 六、技术风险与解决方案

| 风险 | 影响 | 解决方案 |
|------|------|----------|
| LLM响应延迟 | 用户体验差 | 流式输出、预加载、缓存机制 |
| Token消耗过大 | 成本高 | 上下文压缩、智能缓存、模型选择优化 |
| 上下文丢失 | 故事不一致 | 多层记忆系统、关键信息提取 |
| 智能体冲突 | 逻辑矛盾 | 冲突检测机制、优先级系统 |
| 数值平衡 | 游戏体验差 | 动态调整、玩家反馈收集 |
| 本地存储限制 | 存档丢失 | 云端备份、多存档槽 |

---

## 七、附录

### 7.1 名词解释

| 术语 | 定义 |
|------|------|
| 智能体(Agent) | 具有特定职责的AI模块，负责处理特定领域的任务 |
| Token | LLM处理文本的基本单位，约等于0.75个英文单词 |
| 上下文压缩 | 将长对话历史压缩为简短摘要，减少Token消耗 |
| 故事模板 | 定义游戏世界观、规则、AI行为约束的配置文件 |
| 动态UI | 由AI生成并通过Markdown渲染的特殊界面组件 |

### 7.2 参考资料

- OpenAI API文档
- DeepSeek API文档
- GLM API文档
- Kimi API文档
- React官方文档
- SQLite文档

### 7.3 项目定位确认

| 事项 | 决策 | 设计影响 |
|------|------|----------|
| 商业模式 | 免费开源 | 无需付费功能、内购系统；代码需考虑开源协议 |
| 内容审核 | 不需要 | 简化系统设计，减少审核相关模块 |
| 多语言支持 | 不需要 | 仅支持中文界面和内容 |
| 移动端适配 | 不需要 | 专注桌面端体验，无需响应式设计 |
| 社区功能 | 不需要 | 无需用户系统、分享平台、评论功能 |

### 7.4 开源规划

**开源协议**：MIT License

**项目目标**：
- 作为AI应用实践的探索项目
- 展示多智能体协作在游戏领域的应用
- 提供可学习的完整项目案例
- 欢迎社区贡献和改进

**代码规范**：
- 完善的代码注释
- 清晰的项目结构
- 详细的开发文档
- 单元测试覆盖

---

*文档版本: v1.1*
*创建日期: 2025-02-28*
*最后更新: 2025-02-28*
