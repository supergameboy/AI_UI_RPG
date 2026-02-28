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

*文档版本: v1.2*
*创建日期: 2025-02-28*
*最后更新: 2026-02-28*
*项目版本: 0.2.0*
