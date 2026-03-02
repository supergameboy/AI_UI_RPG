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

**数据存储位置**: `packages/backend/game_data/`
- 数据库文件: `ai-rpg.db`
- 设置文件: `settings.json`

> 注：数据存储位置已从系统 AppData 目录迁移到游戏目录下的 `game_data/` 文件夹，便于便携式使用和备份。

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
- 数据库迁移系统支持表结构升级

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

### 14. 数值系统 (Numerical System)

**实现时间**: 第四阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/numerical.ts`
- 后端服务: `packages/backend/src/services/NumericalService.ts`
- 后端路由: `packages/backend/src/routes/numericalRoutes.ts`
- 智能体: `packages/backend/src/agents/NumericalAgent.ts`

#### 14.1 核心功能

- **属性计算**: 基础属性 + 种族加成 + 职业加成 + 装备加成
- **派生属性**: HP/MP/攻击/防御/速度/暴击率/闪避率/格挡率
- **伤害计算**: 物理/魔法/真实伤害，支持暴击、闪避、格挡
- **治疗计算**: 基础治疗 + 属性加成 + 过量治疗
- **等级系统**: 经验值曲线（线性/指数/自定义）、升级奖励

#### 14.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/numerical/attributes/calculate` | POST | 计算基础属性 |
| `/api/numerical/attributes/derived` | POST | 计算派生属性 |
| `/api/numerical/damage/calculate` | POST | 计算伤害 |
| `/api/numerical/healing/calculate` | POST | 计算治疗 |
| `/api/numerical/experience/add` | POST | 添加经验值 |
| `/api/numerical/level/set` | POST | 设置等级 |

---

### 15. 背包系统 (Inventory System)

**实现时间**: 第四阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/item.ts`
- 数据仓库: `packages/backend/src/models/ItemRepository.ts`
- 后端服务: `packages/backend/src/services/InventoryService.ts`
- 后端路由: `packages/backend/src/routes/inventoryRoutes.ts`
- 智能体: `packages/backend/src/agents/InventoryAgent.ts`

#### 15.1 核心功能

- **物品管理**: 添加/移除/使用/丢弃物品
- **堆叠系统**: 相同物品自动堆叠，支持拆分和合并
- **装备系统**: 穿戴/卸下装备，装备槽位管理
- **交易系统**: 购买/出售物品，价格计算
- **容量管理**: 背包容量限制，扩展功能

#### 15.2 物品类型

- 武器 (weapon)
- 防具 (armor)
- 饰品 (accessory)
- 消耗品 (consumable)
- 材料 (material)
- 任务物品 (quest)
- 其他 (other)

#### 15.3 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/inventory/:saveId/:characterId` | GET | 获取背包状态 |
| `/api/inventory/:saveId/:characterId/items` | POST | 添加物品 |
| `/api/inventory/:saveId/:characterId/items/:itemId` | DELETE | 移除物品 |
| `/api/inventory/:saveId/:characterId/items/:itemId/use` | POST | 使用物品 |
| `/api/inventory/:saveId/:characterId/equipment/equip` | POST | 装备物品 |
| `/api/inventory/:saveId/:characterId/trade/buy` | POST | 购买物品 |

---

### 16. 技能系统 (Skill System)

**实现时间**: 第四阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/skill.ts`
- 数据仓库: `packages/backend/src/models/SkillRepository.ts`
- 后端服务: `packages/backend/src/services/SkillService.ts`
- 后端路由: `packages/backend/src/routes/skillRoutes.ts`
- 智能体: `packages/backend/src/agents/SkillAgent.ts`

#### 16.1 核心功能

- **技能学习**: 条件检查、技能点消耗
- **技能升级**: 提升技能等级和效果
- **技能使用**: 消耗资源、应用效果
- **冷却管理**: 回合制冷却系统
- **模板系统**: 预定义技能模板

#### 16.2 技能类型

- 主动技能 (active)
- 被动技能 (passive)
- 切换技能 (toggle)

#### 16.3 技能分类

- 战斗 (combat)
- 魔法 (magic)
- 工艺 (craft)
- 社交 (social)
- 探索 (exploration)

#### 16.4 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/skills/:characterId` | GET | 获取角色技能 |
| `/api/skills/learn` | POST | 学习技能 |
| `/api/skills/upgrade` | POST | 升级技能 |
| `/api/skills/use` | POST | 使用技能 |
| `/api/skills/:characterId/cooldowns/all` | GET | 获取冷却状态 |

---

### 17. 前端面板组件

**实现时间**: 第四阶段  
**文件位置**: `packages/frontend/src/components/panels/`

#### 17.1 CharacterPanel

- 显示角色基础信息（名称、种族、职业、等级）
- 经验值进度条
- HP/MP 状态条
- 基础属性显示（力量、敏捷、体质、智力、感知、魅力）
- 派生属性计算显示

#### 17.2 InventoryPanel

- 背包容量显示
- 物品分类筛选（全部、武器、防具、消耗品、材料、任务物品）
- 网格/列表视图切换
- 物品详情悬浮显示
- 使用/丢弃按钮
- 稀有度颜色标识

#### 17.3 SkillsPanel

- 技能统计显示
- 技能分类标签（战斗、魔法、工艺、社交、探索）
- 技能卡片列表
- 技能详情面板（描述、消耗、冷却、效果）
- 技能使用按钮

---

### 18. 装备系统 (Equipment System)

**实现时间**: 第五阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/item.ts` (EquipmentState, EquipResult)
- 后端服务: `packages/backend/src/services/EquipmentService.ts`
- 后端路由: `packages/backend/src/routes/equipmentRoutes.ts`

#### 18.1 核心功能

- **装备槽位**: weapon(武器)、head(头部)、body(身体)、feet(脚部)、accessory(饰品，支持多个)
- **装备穿戴**: 检查需求、处理替换、从背包移除
- **装备卸下**: 检查背包空间、返回背包
- **属性加成**: 计算所有装备的属性总计

#### 18.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/equipment/:characterId` | GET | 获取装备信息 |
| `/api/equipment/:characterId/stats` | GET | 计算装备属性加成 |
| `/api/equipment/:characterId/equip` | POST | 穿戴装备 |
| `/api/equipment/:characterId/unequip` | POST | 卸下装备 |
| `/api/equipment/:characterId/check/:itemId` | GET | 检查装备需求 |

---

### 19. 任务系统 (Quest System)

**实现时间**: 第五阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/quest.ts`
- 数据仓库: `packages/backend/src/models/QuestRepository.ts`
- 后端服务: `packages/backend/src/services/QuestService.ts`
- 后端路由: `packages/backend/src/routes/questRoutes.ts`

#### 19.1 核心功能

- **任务类型**: main(主线)、side(支线)、hidden(隐藏)、daily(日常)、chain(任务链)
- **任务状态**: locked、available、in_progress、completed、failed
- **目标追踪**: kill(击杀)、collect(收集)、talk(对话)、explore(探索)、custom(自定义)
- **奖励系统**: 经验、金币、物品、声望
- **任务链**: 前置任务解锁后续任务

#### 19.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/quests/:characterId` | GET | 获取任务列表 |
| `/api/quests/:characterId/:questId` | GET | 获取任务详情 |
| `/api/quests/:characterId/available` | GET | 获取可接取任务 |
| `/api/quests/:characterId/accept` | POST | 接取任务 |
| `/api/quests/:characterId/complete` | POST | 完成任务 |
| `/api/quests/:characterId/progress` | POST | 更新进度 |
| `/api/quests/:characterId/abandon` | POST | 放弃任务 |

---

### 20. 前端面板组件 (Phase 2)

**实现时间**: 第五阶段  
**文件位置**: `packages/frontend/src/components/panels/`

#### 20.1 EquipmentPanel

- 装备槽位布局（左侧/中间/右侧）
- 已装备物品显示（名称、稀有度颜色）
- 空槽位状态显示
- 卸下装备按钮
- 属性加成总计显示

#### 20.2 QuestPanel

- 任务统计栏（进行中/可接取/已完成）
- 按类型/状态筛选
- 任务列表（名称、类型图标、进度）
- 任务详情（目标进度条、奖励预览）
- 操作按钮（接取/放弃/完成）

---

### 21. 世界系统 (World System) - Phase 3

**实现时间**: 第六阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/world.ts`
- 数据仓库: `packages/backend/src/models/MapRepository.ts`
- 后端服务: `packages/backend/src/services/MapService.ts`
- 后端路由: `packages/backend/src/routes/mapRoutes.ts`

#### 21.1 核心功能

- **世界层级**: World(世界) → Region(区域) → Location(地点)
- **地点类型**: city、village、dungeon、wilderness、building
- **移动系统**: 条件检查、移动时间、事件触发
- **探索系统**: 发现特征、事件、物品、NPC
- **场景事件**: 进入/离开/探索事件触发

#### 21.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/map/:characterId` | GET | 获取地图状态 |
| `/api/map/:characterId/location` | GET | 获取当前位置 |
| `/api/map/:characterId/move` | POST | 移动到目标地点 |
| `/api/map/:characterId/explore` | POST | 探索当前区域 |
| `/api/map/:characterId/connections` | GET | 获取可用连接 |
| `/api/map/worlds` | POST | 创建世界 |
| `/api/map/worlds/:worldId` | GET | 获取世界详情 |
| `/api/map/worlds/:worldId/regions` | GET | 获取区域列表 |
| `/api/map/regions` | POST | 创建区域 |
| `/api/map/regions/:regionId/locations` | GET | 获取地点列表 |
| `/api/map/locations` | POST | 创建地点 |
| `/api/map/locations/:locationId` | GET | 获取地点详情 |
| `/api/map/connections` | POST | 创建地点连接 |

---

### 22. NPC系统 (NPC System) - Phase 3

**实现时间**: 第六阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/npc.ts`
- 数据仓库: `packages/backend/src/models/NPCRepository.ts`
- 后端服务: `packages/backend/src/services/NPCService.ts`
- 后端路由: `packages/backend/src/routes/npcRoutes.ts`

#### 22.1 核心功能

- **NPC数据**: 基本信息、性格、外观、状态、属性
- **关系系统**: 类型(友好/敌对/浪漫)、好感度(-100~100)、信任度
- **互动系统**: 对话、交易、送礼、招募、攻击
- **队伍系统**: 队员管理、角色分配、跟随移动

#### 22.2 NPC角色类型

- merchant (商人)
- quest_giver (任务发布者)
- enemy (敌人)
- ally (盟友)
- neutral (中立)
- romance (恋爱对象)
- companion (同伴)

#### 22.3 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/npc/:characterId` | GET | 获取NPC列表 |
| `/api/npc/:characterId/:npcId` | GET | 获取NPC详情 |
| `/api/npc/:characterId/:npcId/relationship` | GET | 获取关系状态 |
| `/api/npc/:characterId/:npcId/interact` | POST | 与NPC互动 |
| `/api/npc/:characterId/party` | GET | 获取队伍状态 |
| `/api/npc/:characterId/party/add` | POST | 添加队员 |
| `/api/npc/:characterId/party/remove` | POST | 移除队员 |
| `/api/npc` | POST | 创建NPC |
| `/api/npc/:npcId` | PUT | 更新NPC |
| `/api/npc/:npcId` | DELETE | 删除NPC |

---

### 23. 面板组件集成修复

**实现时间**: 第六阶段  
**文件位置**: `packages/frontend/src/components/layout/PanelContainer.tsx`

#### 23.1 问题描述

EquipmentPanel 和 QuestPanel 组件已实现完成，但 PanelContainer.tsx 未导入和使用它们，导致用户看到的是占位符文本。

#### 23.2 修复内容

- 导入 EquipmentPanel 和 QuestPanel 组件
- 替换 equipment case 的占位符为 `<EquipmentPanel />`
- 替换 quests case 的占位符为 `<QuestPanel />`

#### 23.3 当前状态

- 装备面板：显示装备槽位、已装备物品、属性加成（使用模拟数据）
- 任务面板：显示任务列表、筛选器、任务详情（使用模拟数据）
- 后续工作：连接后端API获取真实数据

---

### 24. 对话系统 (Dialogue System)

**实现时间**: 第七阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/dialogue.ts`
- 后端路由: `packages/backend/src/routes/dialogueRoutes.ts`
- 前端服务: `packages/frontend/src/services/dialogueService.ts`
- 前端组件: `packages/frontend/src/components/game/StoryDisplay.tsx`, `QuickOptions.tsx`, `ChatInput.tsx`

#### 24.1 核心功能

- **初始场景生成**: 角色创建后自动调用 LLM 生成开场场景
- **玩家输入处理**: 发送玩家行动到后端，获取叙事响应
- **快速选项**: 动态生成 2-5 个行动选项
- **状态变化**: 支持健康、魔力、金币、经验等状态变化

#### 24.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/dialogue/initial` | POST | 生成初始场景 |
| `/api/dialogue/send` | POST | 发送玩家输入 |
| `/api/dialogue/options` | POST | 获取当前选项 |
| `/api/dialogue/history/:characterId` | GET | 获取对话历史 |

#### 24.3 类型定义

```typescript
interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'narrator';
  content: string;
  type: 'normal' | 'quest' | 'trade' | 'combat' | 'romance' | 'system';
  timestamp: number;
}

interface DialogueOption {
  id: string;
  text: string;
  type: DialogueType;
  disabled?: boolean;
}
```

#### 24.4 前端集成

- gameStore 新增 `dialogueOptions`、`isLoadingDialogue` 状态
- `onCharacterCreated` 自动调用 `generateInitialScene`
- StoryDisplay 从 gameStore 读取消息并渲染
- QuickOptions 显示动态选项，点击发送选项内容
- ChatInput 支持自由输入，发送到后端

#### 24.5 API 密钥安全

- `game_data/settings.json` 已在 `.gitignore` 中，不会上传到 GitHub
- 提供了 `settings.example.json` 示例配置文件
- 支持多个 LLM 提供商：DeepSeek、GLM、Kimi、OpenAI

---

### 25. 战斗系统 (Combat System)

**实现时间**: 第八阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/combat.ts`
- 后端服务: `packages/backend/src/services/CombatService.ts`
- 后端路由: `packages/backend/src/routes/combatRoutes.ts`
- 智能体: `packages/backend/src/agents/CombatAgent.ts`
- 前端服务: `packages/frontend/src/services/combatService.ts`
- 前端组件: `packages/frontend/src/components/combat/`

#### 25.1 核心功能

- **回合制战斗**: 基于速度属性的回合顺序
- **战斗行动**: 攻击、技能、物品、防御、逃跑
- **伤害计算**: 物理伤害、魔法伤害、暴击、闪避、防御减伤
- **战斗AI**: 三种难度（简单/普通/困难），困难模式使用 LLM 决策
- **状态效果**: 持续伤害、治疗、属性修正
- **战斗奖励**: 经验值、金币、物品掉落

#### 25.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/combat/initiate` | POST | 初始化战斗 |
| `/api/combat/start` | POST | 开始战斗 |
| `/api/combat/action` | POST | 执行玩家行动 |
| `/api/combat/ai-turn` | POST | 执行AI回合 |
| `/api/combat/end` | POST | 结束战斗 |
| `/api/combat/:combatId` | GET | 获取战斗状态 |
| `/api/combat/player/:playerId` | GET | 获取玩家当前战斗 |

#### 25.3 类型定义

```typescript
enum CombatState {
  PREPARING = 'preparing',
  IN_PROGRESS = 'in_progress',
  PLAYER_TURN = 'player_turn',
  ENEMY_TURN = 'enemy_turn',
  ENDED = 'ended',
}

enum ActionType {
  ATTACK = 'attack',
  SKILL = 'skill',
  ITEM = 'item',
  DEFEND = 'defend',
  FLEE = 'flee',
}

interface CombatUnit {
  id: string;
  name: string;
  type: 'player' | 'ally' | 'enemy';
  level: number;
  stats: CombatUnitStats;
  skills: string[];
  statusEffects: StatusEffect[];
  isDefending: boolean;
  isAlive: boolean;
}
```

#### 25.4 前端组件

- **CombatPanel**: 战斗主面板，整合所有战斗组件
- **CombatUnitCard**: 显示单个战斗单位信息（HP/MP条、状态效果）
- **ActionMenu**: 玩家行动菜单（攻击、技能、物品、防御、逃跑）
- **CombatLog**: 战斗日志滚动显示
- **TurnOrder**: 回合顺序显示

#### 25.5 战斗触发

- 通过对话系统触发战斗（LLM 返回 `combatTrigger` 字段）
- 支持两种触发格式：
  - `[COMBAT_START]...[/COMBAT_START]` 标记格式
  - JSON 中的 `combatTrigger` 字段格式
- 战斗结束后自动发放奖励并更新角色状态

#### 25.6 gameStore 集成

新增状态：
- `combat`: 当前战斗实例数据
- `combatLog`: 战斗日志记录
- `isInCombat`: 是否在战斗中
- `isPlayerTurn`: 是否玩家回合

新增 Actions：
- `initiateCombat(enemies, allies?)`: 初始化并开始战斗
- `executeCombatAction(action, targetId?, skillId?, itemId?)`: 执行玩家行动
- `executeAITurn()`: 执行AI回合
- `endCombat()`: 结束战斗，处理奖励

---

### 26. Token 计费系统 (Token Usage System)

**实现时间**: 第九阶段  
**文件位置**: 
- 共享类型: `packages/shared/src/types/developer.ts`
- 后端服务: `packages/backend/src/services/TokenUsageService.ts`
- 后端路由: `packages/backend/src/routes/tokenRoutes.ts`
- 前端服务: `packages/frontend/src/services/tokenService.ts`
- 前端组件: `packages/frontend/src/components/developer/TokenUsagePanel.tsx`

#### 26.1 核心功能

- **Token 使用记录**: 记录每次 LLM 调用的 Token 使用量
- **费用计算**: 根据提供商和模型计算预估费用
- **统计分析**: 按智能体和提供商分类统计
- **价格配置**: 支持自定义各模型的价格

#### 26.2 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/token/statistics` | GET | 获取统计信息 |
| `/api/token/usage` | GET | 获取使用记录 |
| `/api/token/pricing` | GET | 获取价格配置 |
| `/api/token/pricing` | POST | 更新价格配置 |
| `/api/token/reset` | POST | 重置统计 |

#### 26.3 支持的提供商价格

| 提供商 | 模型 | 输入价格 ($/1k tokens) | 输出价格 ($/1k tokens) |
|--------|------|------------------------|------------------------|
| DeepSeek | deepseek-chat | 0.0005 | 0.001 |
| GLM | glm-4 | 0.014 | 0.014 |
| Kimi | moonshot-v1-8k | 0.012 | 0.012 |
| OpenAI | gpt-4o | 0.005 | 0.015 |

---

### 27. 增强日志系统 (Enhanced Logging System)

**实现时间**: 第九阶段  
**文件位置**: 
- 类型定义: `packages/shared/src/types/log.ts`
- 后端日志服务: `packages/backend/src/services/GameLogService.ts`
- 前端日志组件: `packages/frontend/src/components/developer/LogViewer.tsx`

#### 27.1 核心功能

- **详细日志记录**: 记录完整的输入输出内容
- **内容截断**: 超长内容自动截断（默认 2000 字符）
- **多来源分类**: dialogue, llm, combat, backend, agent, system, frontend
- **多级别日志**: debug, info, warn, error
- **实时推送**: 通过 WebSocket 实时推送到前端

#### 27.2 日志来源

| 来源 | 用途 |
|------|------|
| `dialogue` | 对话系统相关日志 |
| `llm` | LLM 调用相关日志 |
| `combat` | 战斗系统相关日志 |
| `backend` | 后端通用服务日志 |
| `agent` | 智能体相关日志 |
| `system` | 系统级日志 |
| `frontend` | 前端日志 |

#### 27.3 日志级别规范

| 级别 | 用途 |
|------|------|
| `debug` | 完整的输入输出内容、详细数据 |
| `info` | 操作摘要、关键节点 |
| `warn` | 可恢复异常、降级处理 |
| `error` | 错误、异常、失败 |

#### 27.4 已添加日志的服务

- `dialogueRoutes.ts` - 请求、响应、战斗触发
- `LLMService.ts` - LLM 调用输入输出
- `CombatService.ts` - 战斗初始化、行动、AI决策
- `NumericalService.ts` - 属性计算、伤害计算
- `InventoryService.ts` - 物品操作
- `QuestService.ts` - 任务操作
- `MapService.ts` - 位置变更

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

*文档版本: v2.5*
*创建日期: 2026-02-28*
*最后更新: 2026-03-03*
*项目版本: 0.9.0*
