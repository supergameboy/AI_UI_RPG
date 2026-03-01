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
│   ├── backend/           # Express 后端服务
│   │   ├── src/
│   │   │   ├── models/       # 数据模型
│   │   │   ├── services/     # 业务服务
│   │   │   ├── routes/       # API路由
│   │   │   └── types/        # TypeScript类型定义
│   │   └── package.json
│   └── shared/            # 共享类型定义
│       ├── src/types/
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
- 启动时自动加载已保存的配置

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
│   ├── GlobalDeveloperTools.tsx # 全局开发者工具
│   ├── RequestMonitor.tsx   # 请求监控
│   ├── AgentCommunication.tsx # 智能体通信
│   ├── LogViewer.tsx        # 日志查看
│   └── StateInspector.tsx   # 状态检查
├── character/
│   ├── CharacterCreation.tsx # 角色创建主组件
│   ├── NameInputStep.tsx    # 名称输入
│   ├── RaceSelectionStep.tsx # 种族选择
│   ├── ClassSelectionStep.tsx # 职业选择
│   ├── BackgroundSelectionStep.tsx # 背景选择
│   ├── CharacterConfirmStep.tsx # 角色确认
│   └── OptionCard.tsx       # 选项卡片
├── template/
│   ├── TemplateManager.tsx  # 模板管理器
│   ├── TemplateSelect.tsx   # 模板选择
│   └── editors/             # 模板编辑器
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

#### 7.2 已实现的12个智能体

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
    aiRandomGeneration: boolean;      // AI随机生成角色选项
    generateImagePrompt: boolean;     // 生成文生图提示词
  };
  developer: {
    developerMode: boolean;
  };
}
```

#### 8.2 配置持久化

- 设置自动保存到系统应用数据目录
- 后端启动时自动加载已保存的 LLM 配置
- 支持多提供商配置

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

#### 9.2 全局日志服务

**后端**: `packages/backend/src/services/GameLogService.ts`
- 自动捕获所有 `console.log/error/warn` 调用
- 通过 WebSocket 实时广播到前端
- 日志写入文件 `logs/game-YYYY-MM-DD.log`
- 支持日志级别过滤和搜索

**前端**: `packages/frontend/src/stores/developerStore.ts`
- 接收后端广播的日志
- 实时显示在开发者工具中

#### 9.3 全局开发者工具

**文件位置**: `packages/frontend/src/components/developer/GlobalDeveloperTools.tsx`

- WebSocket 连接在全局级别建立
- 开发者面板在所有界面都可用
- 不受屏幕切换影响

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
| `/api/templates` | GET/POST | 模板列表/创建 |
| `/api/templates/:id` | GET/PUT/DELETE | 模板操作 |
| `/api/templates/generate/*` | POST | AI生成各种内容 |
| `/api/character/generate-races` | POST | 生成种族选项 |
| `/api/character/generate-classes` | POST | 生成职业选项 |
| `/api/character/generate-backgrounds` | POST | 生成背景选项 |
| `/api/character/calculate-attributes` | POST | 计算属性 |
| `/api/character/finalize` | POST | 完成角色创建 |
| `/api/logs/game` | GET | 获取游戏日志 |
| `/api/logs/game/file` | GET | 获取日志文件路径 |

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

---

### 12. 故事模板系统

**实现时间**: 第二阶段  
**文件位置**: 
- 后端 Repository: `packages/backend/src/models/TemplateRepository.ts`
- 后端 Service: `packages/backend/src/services/TemplateService.ts`
- 后端路由: `packages/backend/src/routes/templateRoutes.ts`
- 前端 Service: `packages/frontend/src/services/templateService.ts`
- 前端 Store: `packages/frontend/src/stores/templateStore.ts`
- 前端组件: `packages/frontend/src/components/template/`

#### 12.1 功能概述

故事模板定义了游戏的世界观、种族、职业、背景等核心规则，是角色创建流程的前置依赖。

#### 12.2 预设模板

| 模板名称 | 游戏模式 | 特色 |
|----------|----------|------|
| 中世纪奇幻冒险 | 回合制RPG | 种族：人类/精灵/矮人，职业：战士/法师/盗贼/圣骑士/游侠 |
| 现代都市恋爱 | 视觉小说 | 职业：学生/上班族/自由职业者，好感度系统 |
| 克苏鲁恐怖调查 | 文字冒险 | 职业：侦探/记者/医生/学者，SAN值系统 |
| 赛博朋克佣兵 | 动态战斗 | 种族：自然人/改造人/仿生人，义体系统 |

---

### 13. 角色创建系统

**实现时间**: 第三阶段  
**文件位置**: 
- 后端 Service: `packages/backend/src/services/CharacterGenerationService.ts`
- 后端路由: `packages/backend/src/routes/characterRoutes.ts`
- 前端 Store: `packages/frontend/src/stores/characterCreationStore.ts`
- 前端组件: `packages/frontend/src/components/character/`
- 共享类型: `packages/shared/src/types/characterCreation.ts`

#### 13.1 创建流程

```
主菜单 → 模板选择 → 角色创建 → 游戏界面
                     ├── 名称输入
                     ├── 种族选择
                     ├── 职业选择
                     ├── 背景选择
                     └── 角色确认
```

#### 13.2 AI 生成功能

- **批量生成**: 一次 API 调用生成 3 个选项
- **种族生成**: 包含属性加成/惩罚、特性、可选职业
- **职业生成**: 包含主属性、生命骰、技能熟练、初始装备
- **背景生成**: 包含技能熟练、语言、装备、背景特性
- **外观生成**: AI 生成外观描述和文生图提示词

#### 13.3 属性计算

- 基础值 + 种族加成/惩罚 + 职业加成
- 支持自定义属性系统
- 属性 ID 标准化（strength, dexterity, constitution, intelligence, wisdom, charisma）

#### 13.4 请求防抖

- Store 层: `isLoading` 检查防止并发请求
- 组件层: `useRef` 防止重复调用
- 缓存检查: 已有结果时不重复请求

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

## 相关文档

- [项目设计文档](./project_design.md) - 完整的系统设计
- [待办事项](./todo.md) - 开发计划和任务列表
- [架构决策记录](./architecture-decisions.md) - 关键架构决策

---

*文档版本: v1.6*
*创建日期: 2025-02-28*
*最后更新: 2026-03-02*
*项目版本: 0.4.0*
