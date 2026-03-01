# AI-RPG Engine 开发日志

## 项目概述

**项目名称**: AI-RPG Engine  
**技术栈**: React 18 + Vite 5 + TypeScript (前端) | Node.js + Express + TypeScript (后端) | SQLite (sql.js)  
**项目结构**: Monorepo + pnpm workspace

---

## 已实现功能

### 1. 项目基础架构

#### 1.1 Monorepo 项目结构

**实现时间**: 第一阶段  
**文件位置**: 根目录配置

```
AI_UI_RPG/
├── packages/
│   ├── frontend/          # React 前端应用
│   │   ├── src/
│   │   │   ├── components/   # UI组件
│   │   │   ├── services/     # API服务
│   │   │   ├── stores/       # Zustand状态管理
│   │   │   └── types/        # TypeScript类型定义
│   │   └── package.json
│   └── backend/           # Express 后端服务
│       ├── src/
│       │   ├── models/       # 数据模型
│       │   ├── services/     # 业务服务
│       │   ├── routes/       # API路由
│       │   └── types/        # TypeScript类型定义
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

**实现要点**:
- 使用 pnpm workspace 管理多包依赖
- 前后端共享 TypeScript 配置
- 统一的代码风格和 lint 规则

#### 1.2 TypeScript 配置

**关键配置**:
- `strict: true` - 严格类型检查
- `esModuleInterop: true` - ES模块兼容
- 前端目标: `ES2020`, 模块: `ESNext`
- 后端目标: `ES2020`, 模块: `CommonJS`

---

### 2. 数据库设计

#### 2.1 SQLite 数据库 (sql.js)

**实现时间**: 第一阶段  
**文件位置**: `packages/backend/src/services/DatabaseService.ts`

**核心表结构**:

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `saves` | 存档主表 | id, name, template_id, game_mode, game_state |
| `save_snapshots` | 存档快照 | save_id, context_state, story_state |
| `characters` | 角色数据 | id, name, race, class, attributes |
| `quests` | 任务数据 | id, name, type, status, objectives |
| `inventory` | 背包物品 | id, character_id, item_id, quantity |
| `items` | 物品定义 | id, name, type, rarity, stats |
| `skills` | 技能定义 | id, name, type, effects, cost |
| `npcs` | NPC数据 | id, name, race, personality, relationship |
| `dialogues` | 对话记录 | id, character_id, npc_id, content |
| `templates` | 故事模板 | id, name, world_setting, game_rules |
| `settings` | 游戏设置 | key, value |

**实现要点**:
- 使用 sql.js (纯JavaScript SQLite) 实现本地存储
- DatabaseService 封装所有数据库操作
- 支持事务和批量操作
- 自动初始化表结构

---

### 3. LLM 适配器系统

#### 3.1 适配器架构

**实现时间**: 第一阶段  
**文件位置**: `packages/backend/src/services/llm/`

**架构设计**:
```
LLMService (统一入口)
    ├── LLMAdapter (接口定义)
    ├── DeepSeekAdapter
    ├── GLMAdapter
    ├── KimiAdapter
    └── OpenAIAdapter
```

**实现要点**:
- 支持 DeepSeek、GLM、Kimi、OpenAI 等多个提供商
- 实现流式响应 (SSE)
- 错误处理和重试机制
- 统一的 API 调用接口

---

### 4. 前端 UI 框架

#### 4.1 技术栈

**实现时间**: 第一阶段  
**文件位置**: `packages/frontend/`

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **状态管理**: Zustand
- **样式方案**: CSS Modules

#### 4.2 核心组件结构

```
components/
├── layout/
│   ├── Header.tsx           # 顶部导航栏
│   ├── Footer.tsx           # 底部状态栏
│   └── GameLayout.tsx       # 主布局
├── game/
│   ├── StoryDisplay.tsx     # 故事显示面板
│   ├── QuickOptions.tsx     # 快捷选项
│   └── ChatInput.tsx        # 输入面板
├── panels/
│   └── PanelContainer.tsx   # 面板容器
├── save/
│   ├── SaveManager.tsx      # 存档管理器
│   ├── SaveList.tsx         # 存档列表
│   └── SaveCard.tsx         # 存档卡片
├── menu/
│   ├── MainMenu.tsx         # 主菜单
│   └── Settings.tsx         # 设置面板
├── settings/
│   └── LLMConfigModal.tsx   # LLM配置弹窗
├── developer/
│   ├── DeveloperPanel.tsx   # 开发者面板
│   ├── RequestMonitor.tsx   # 请求监控
│   ├── AgentCommunication.tsx # 智能体通信
│   ├── LogViewer.tsx        # 日志查看
│   └── StateInspector.tsx   # 状态检查
└── common/
    ├── Button.tsx           # 按钮组件
    ├── Input.tsx            # 输入组件
    ├── Panel.tsx            # 面板组件
    ├── Icon.tsx             # 图标组件
    └── ConfirmDialog.tsx    # 确认对话框
```

---

### 5. 存档系统

**实现时间**: 第一阶段完成  
**文件位置**: `packages/backend/src/models/SaveRepository.ts`, `packages/frontend/src/services/saveService.ts`

**功能特性**:
- 无限存档 + 分页查找 + 按模板过滤
- 自动存档：任务完成时、关键选择后
- 导入/导出：JSON 文件格式

---

### 6. 上下文管理系统

**实现时间**: 第一阶段  
**文件位置**: `packages/backend/src/services/ContextService.ts`

**四层上下文压缩机制**:
- **Layer 1 (实时上下文)**: 最近 5-10 轮对话，保持完整内容
- **Layer 2 (短期记忆)**: 最近 20-50 轮，压缩为摘要
- **Layer 3 (中期记忆)**: 最近 100-200 轮，高度压缩
- **Layer 4 (长期记忆)**: 整个游戏历程，世界状态快照

---

### 7. 智能体系统

**实现时间**: 第二阶段  
**文件位置**: `packages/backend/src/agents/`

#### 7.1 智能体架构

```
agents/
├── AgentBase.ts           # 智能体基类
├── CoordinatorAgent.ts    # 统筹智能体
├── StoryContextAgent.ts   # 故事上下文智能体
├── UIAgent.ts             # UI智能体
├── QuestAgent.ts          # 任务智能体
├── MapAgent.ts            # 地图智能体
├── NPCAgent.ts            # NPC智能体
├── NumericalAgent.ts      # 数值智能体
├── InventoryAgent.ts      # 背包智能体
├── SkillAgent.ts          # 技能智能体
├── CombatAgent.ts         # 战斗智能体
├── DialogueAgent.ts       # 对话智能体
├── EventAgent.ts          # 事件智能体
└── index.ts               # 导出
```

#### 7.2 AgentBase 基类

```typescript
export abstract class AgentBase {
  abstract readonly type: AgentType;
  abstract readonly name: string;
  
  protected messageQueue: AgentMessage[] = [];
  protected priority: number = 5;
  
  abstract initialize(): Promise<void>;
  abstract processMessage(message: AgentMessage): Promise<AgentResponse>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  
  async sendMessage(to: AgentType, action: string, payload?: unknown): Promise<void> {
    const message: AgentMessage = {
      id: generateId(),
      from: this.type,
      to,
      action,
      payload,
      timestamp: Date.now(),
      status: 'pending',
    };
    await agentCommunication.send(message);
  }
}
```

#### 7.3 已实现的12个智能体

| 智能体 | 职责 |
|--------|------|
| CoordinatorAgent | 统筹协调其他智能体 |
| StoryContextAgent | 管理故事上下文 |
| UIAgent | 生成UI指令 |
| QuestAgent | 任务生成和追踪 |
| MapAgent | 地点和移动管理 |
| NPCAgent | NPC和队伍管理 |
| NumericalAgent | 属性和伤害计算 |
| InventoryAgent | 物品和装备管理 |
| SkillAgent | 技能管理和冷却 |
| CombatAgent | 回合制战斗系统 |
| DialogueAgent | NPC对话生成 |
| EventAgent | 随机事件管理 |

#### 7.4 AgentService 服务

**文件位置**: `packages/backend/src/services/AgentService.ts`

```typescript
export class AgentService {
  private agents: Map<AgentType, AgentBase> = new Map();
  
  async initialize(): Promise<void> {
    this.agents.set('coordinator', new CoordinatorAgent());
    this.agents.set('storyContext', new StoryContextAgent());
    // ... 其他智能体
    
    for (const agent of this.agents.values()) {
      await agent.initialize();
    }
  }
  
  async start(): Promise<void> {
    for (const agent of this.agents.values()) {
      await agent.start();
    }
  }
}
```

---

### 8. 设置系统

**实现时间**: 第二阶段  
**文件位置**: 
- 前端: `packages/frontend/src/stores/settingsStore.ts`
- 后端: `packages/backend/src/services/SettingsService.ts`

#### 8.1 设置类型

```typescript
interface GameSettings {
  ai: {
    defaultProvider: string;
    providers: Record<string, ProviderConfig>;
  };
  gameplay: {
    autoSaveEnabled: boolean;
    textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  };
  developer: {
    developerMode: boolean;
  };
}
```

#### 8.2 LLM配置功能

**文件位置**: `packages/frontend/src/components/settings/LLMConfigModal.tsx`

- 支持配置多个AI提供商（DeepSeek、GLM、Kimi）
- API密钥输入和保存
- 模型选择
- 测试连接功能

---

### 9. 开发者工具系统

**实现时间**: 第二阶段  
**文件位置**: `packages/frontend/src/components/developer/`

#### 9.1 功能概述

开发者工具是一个浮动窗口式的调试面板，包含四个Tab：

| Tab | 功能 |
|-----|------|
| 请求监控 | 显示所有LLM API请求和响应 |
| 智能体通信 | 实时显示智能体之间的消息流 |
| 日志查看 | 系统日志查看，支持过滤和导出 |
| 状态检查 | 查看和修改游戏状态 |

#### 9.2 日志服务

**前端**: `packages/frontend/src/services/logService.ts`
- 多级别日志（DEBUG、INFO、WARN、ERROR）
- 来源标记（frontend、backend、agent）
- 日志过滤和搜索
- 日志导出（JSON/文本格式）

**后端**: `packages/backend/src/services/LogService.ts`
- 日志收集和存储
- 自动写入日志文件到 `logs/` 目录
- 按日期分割日志文件

#### 9.3 开发者面板组件

```typescript
// DeveloperPanel.tsx - 浮动窗口
- 可拖拽移动位置
- 可调整窗口大小
- 可最小化/展开
- 仅在开发者模式启用时显示
```

---

### 10. API 路由设计

**文件位置**: `packages/backend/src/routes/`

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/saves` | GET/POST | 存档列表/创建 |
| `/api/saves/:id` | GET/PUT/DELETE | 存档操作 |
| `/api/saves/:id/export` | GET | 导出存档 |
| `/api/saves/import` | POST | 导入存档 |
| `/api/llm/config` | GET/POST | LLM配置 |
| `/api/llm/chat` | POST | 聊天消息 |
| `/api/agent/status` | GET | 智能体状态 |
| `/api/agent/config` | GET/PUT | 智能体配置 |
| `/api/settings` | GET/PUT | 游戏设置 |

---

### 11. 提示词工程系统

**实现时间**: 第二阶段  
**文件位置**: 
- 类型定义: `packages/shared/src/types/prompt.ts`
- 服务: `packages/backend/src/services/PromptService.ts`
- 数据访问: `packages/backend/src/models/PromptRepository.ts`
- 路由: `packages/backend/src/routes/promptRoutes.ts`
- 前端组件: `packages/frontend/src/components/developer/PromptEditor.tsx`

#### 11.1 核心功能

- 提示词模板管理：支持 12 个智能体的提示词模板
- 变量注入：支持 `{{variable_name}}` 格式的变量替换
- 版本控制：每次修改自动创建版本快照
- 测试框架：支持测试提示词效果

#### 11.2 提示词模板文件

```
packages/backend/src/prompts/
├── coordinator.md      # 统筹智能体
├── story_context.md    # 故事上下文智能体
├── dialogue.md         # 对话智能体
├── quest.md            # 任务智能体
├── combat.md           # 战斗智能体
├── map.md              # 地图智能体
├── npc_party.md        # NPC/队伍智能体
├── numerical.md        # 数值智能体
├── inventory.md        # 背包智能体
├── skill.md            # 技能智能体
├── ui.md               # UI智能体
└── event.md            # 事件智能体
```

#### 11.3 数据库表

| 表名 | 用途 |
|------|------|
| `prompt_templates` | 存储提示词模板 |
| `prompt_versions` | 存储版本历史 |
| `prompt_test_results` | 存储测试结果 |

#### 11.4 API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/prompts/:agentType` | GET | 获取提示词模板 |
| `/api/prompts/:agentType` | PUT | 更新提示词模板 |
| `/api/prompts/test` | POST | 测试提示词 |
| `/api/prompts/:agentType/versions` | GET | 获取版本历史 |
| `/api/prompts/:agentType/rollback/:version` | POST | 回滚版本 |

---

### 14. 故事模板系统

**实现时间**: 第二阶段  
**文件位置**: 
- 后端 Repository: `packages/backend/src/models/TemplateRepository.ts`
- 后端 Service: `packages/backend/src/services/TemplateService.ts`
- 后端路由: `packages/backend/src/routes/templateRoutes.ts`
- 前端 Service: `packages/frontend/src/services/templateService.ts`
- 前端 Store: `packages/frontend/src/stores/templateStore.ts`
- 前端组件: `packages/frontend/src/components/template/`

#### 14.1 功能概述

故事模板定义了游戏的世界观、种族、职业、背景等核心规则，是角色创建流程的前置依赖。

#### 14.2 编辑器模块

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

#### 14.3 预设模板

| 模板名称 | 游戏模式 | 特色 |
|----------|----------|------|
| 中世纪奇幻冒险 | 回合制RPG | 种族：人类/精灵/矮人，职业：战士/法师/盗贼/圣骑士/游侠，背景：贵族后裔/农夫之子/流浪孤儿 |
| 现代都市恋爱 | 视觉小说 | 职业：学生/上班族/自由职业者，好感度系统，叙事型战斗 |
| 克苏鲁恐怖调查 | 文字冒险 | 职业：侦探/记者/医生/学者，SAN值系统，KP模式，永久死亡 |
| 赛博朋克佣兵 | 动态战斗 | 种族：自然人/改造人/仿生人，职业：黑客/佣兵/医生/商人，义体系统 |

#### 14.4 API 路由

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/templates` | GET | 获取模板列表 |
| `/api/templates/:id` | GET | 获取单个模板 |
| `/api/templates` | POST | 创建新模板 |
| `/api/templates/:id` | PUT | 更新模板 |
| `/api/templates/:id` | DELETE | 删除模板 |
| `/api/templates/generate/npc` | POST | AI生成NPC |
| `/api/templates/generate/item` | POST | AI生成物品 |
| `/api/templates/generate/quest` | POST | AI生成任务 |
| `/api/templates/generate/scene` | POST | AI生成场景 |
| `/api/templates/generate/race` | POST | AI生成种族 |
| `/api/templates/generate/class` | POST | AI生成职业 |
| `/api/templates/generate/background` | POST | AI生成背景 |
| `/api/templates/generate/worldSetting` | POST | AI生成世界观 |

#### 14.5 模板数据结构

```typescript
interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  gameMode: 'text_adventure' | 'turn_based_rpg' | 'visual_novel' | 'dynamic_combat';
  worldSetting: WorldSetting;
  characterCreation: CharacterCreationRules;
  gameRules: GameRules;
  aiConstraints: AIConstraints;
  startingScene: StartingScene;
  uiTheme: UITheme;
  uiLayout: UILayout;
  numericalComplexity: 'simple' | 'medium' | 'complex';
  specialRules: SpecialRules;
}

interface AIBehavior {
  responseStyle: 'narrative' | 'mechanical' | 'adaptive';
  detailLevel: 'brief' | 'normal' | 'detailed';
  playerAgency: 'guided' | 'balanced' | 'freeform';
}

interface AttributeDefinition {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}
```

#### 14.6 初始化流程

后端启动时自动初始化预设模板：
1. 检查数据库中是否存在内置模板
2. 使用 `INSERT OR REPLACE` 更新已存在的模板
3. 插入新模板并标记为内置模板

---

### 15. 模板编辑器增强功能

**实现时间**: 第三阶段  
**文件位置**: 
- 前端编辑器: `packages/frontend/src/components/template/editors/`
- 后端 AI 服务: `packages/backend/src/services/AIGenerateService.ts`

#### 15.1 AI 辅助生成功能

支持 AI 自动生成以下内容：
- 世界观设定：根据模板名称和描述自动生成完整世界观
- 种族定义：根据世界观生成种族（含属性加成、特殊能力）
- 职业定义：根据世界观和种族生成职业（含主属性、技能、装备）
- 背景定义：根据世界观、种族、职业生成背景故事
- 起始场景：生成完整起始场景（含NPC、物品、任务）

#### 15.2 属性系统

支持自定义角色属性系统：
- 默认 6 种属性：力量(STR)、敏捷(DEX)、体质(CON)、智力(INT)、感知(WIS)、魅力(CHA)
- 可添加自定义属性
- 属性 ID 用于种族加成和职业主属性配置
- 支持动态属性传递给种族/职业编辑器

#### 15.3 预览测试功能

- 角色创建流程预览：显示种族、职业、背景选项
- 初始场景预览：显示地点、NPC、物品、任务
- 快速验证模板效果

---

## 开发规范

### 代码风格
- 组件命名: PascalCase (如 `SaveManager`)
- 函数/变量: camelCase (如 `fetchSaves`)
- 常量: UPPER_SNAKE_CASE (如 `API_BASE`)
- 类型/接口: PascalCase (如 `SaveState`)

### 文件结构
```
ComponentName/
├── index.ts              # 导出
├── ComponentName.tsx     # 组件
└── ComponentName.module.css  # 样式
```

### 导入顺序
1. 外部库导入
2. 内部模块导入
3. 类型导入 (使用 `import type`)

---

*文档版本: v1.3*
*创建日期: 2025-02-28*
*最后更新: 2026-03-01*
*项目版本: 0.3.0*
