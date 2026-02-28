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

```typescript
class DatabaseService {
  private db: Database;
  
  async initialize(): Promise<void> {
    this.db = new sqlite.Database();
    await this.createTables();
  }
  
  run(sql: string, params: unknown[] = []): DatabaseStatement {
    return this.db.run(sql, params as Parameters<typeof this.db.run>[1]);
  }
}
```

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

**接口定义** (`packages/backend/src/services/llm/types.ts`):

```typescript
interface LLMAdapter {
  name: string;
  chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse>;
  chatStream?(messages: LLMMessage[], options?: LLMChatOptions): AsyncIterable<LLMStreamChunk>;
  getCapabilities(): LLMCapabilities;
}
```

#### 3.2 DeepSeek 适配器实现

**文件位置**: `packages/backend/src/services/llm/DeepSeekAdapter.ts`

**实现要点**:
- 支持 DeepSeek Chat 和 DeepSeek Reasoner 模型
- 实现流式响应 (SSE)
- 错误处理和重试机制

```typescript
class DeepSeekAdapter implements LLMAdapter {
  name = 'deepseek';
  
  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || 'deepseek-chat',
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });
    
    const data = await response.json() as DeepSeekChatResponse;
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
    };
  }
}
```

#### 3.3 LLM 服务统一管理

**文件位置**: `packages/backend/src/services/llm/LLMService.ts`

**功能**:
- 多提供商注册和管理
- 统一的 API 调用接口
- 配置管理和持久化

```typescript
class LLMService {
  private providers: Map<string, LLMAdapter> = new Map();
  private defaultProvider: string = 'deepseek';
  
  registerProvider(name: string, config: LLMProviderConfig): void {
    const adapter = this.createAdapter(name, config);
    this.providers.set(name, adapter);
  }
  
  async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) throw new Error('No provider configured');
    return provider.chat(messages, options);
  }
}
```

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
│   └── MainLayout.tsx       # 主布局
├── game/
│   ├── GameContainer.tsx    # 游戏主容器
│   ├── StoryPanel.tsx       # 故事显示面板
│   ├── InputPanel.tsx       # 输入面板
│   └── QuickActions.tsx     # 快捷操作
├── panels/
│   ├── CharacterPanel.tsx   # 角色面板
│   ├── InventoryPanel.tsx   # 背包面板
│   ├── QuestPanel.tsx       # 任务面板
│   └── SettingsPanel.tsx    # 设置面板
├── save/
│   ├── SaveManager.tsx      # 存档管理器
│   ├── SaveList.tsx         # 存档列表
│   ├── SaveCard.tsx         # 存档卡片
│   └── SaveForm.tsx         # 存档表单
└── menu/
    └── MainMenu.tsx         # 主菜单
```

#### 4.3 状态管理 (Zustand)

**文件位置**: `packages/frontend/src/stores/gameStore.ts`

**状态结构**:

```typescript
interface GameState {
  // 游戏状态
  currentScene: string;
  storyHistory: StoryMessage[];
  character: Character | null;
  quests: Quest[];
  inventory: InventoryItem[];
  
  // UI状态
  activePanel: string | null;
  isLoading: boolean;
  notification: { type: string; message: string } | null;
  
  // 存档状态
  saves: Save[];
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  saveGame: (name: string) => Promise<void>;
  loadGame: (id: string) => Promise<void>;
  completeQuest: (questId: string) => void;
}
```

---

### 5. 存档系统

#### 5.1 功能概述

**实现时间**: 第一阶段完成  
**设计决策**:
- **存档槽位**: 无限存档 + 分页查找 + 按模板过滤
- **自动存档**: 任务完成时、关键选择后
- **导入/导出**: JSON 文件格式

#### 5.2 后端实现

**文件位置**: `packages/backend/src/models/SaveRepository.ts`

**核心方法**:

```typescript
class SaveRepository {
  create(data: CreateSaveData): Save {
    const stmt = this.db.prepare(`
      INSERT INTO saves (name, template_id, game_mode, game_state, story_progress)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([data.name, data.templateId, data.gameMode, data.gameState, data.storyProgress]);
    return this.findById(this.db.lastInsertRowId);
  }
  
  findWithPagination(options: { page?: number; limit?: number; template_id?: string }): {
    saves: Save[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const { page = 1, limit = 10, template_id } = options;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM saves';
    const params: unknown[] = [];
    
    if (template_id) {
      sql += ' WHERE template_id = ?';
      params.push(template_id);
    }
    
    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const saves = this.db.prepare(sql).all(params) as Save[];
    const total = this.getCount(template_id);
    
    return { saves, total, page, totalPages: Math.ceil(total / limit) };
  }
  
  exportToJSON(id: string): string {
    const save = this.findById(id);
    const snapshot = this.getSnapshot(id);
    return JSON.stringify({ save, snapshot }, null, 2);
  }
  
  importFromJSON(jsonData: string): Save {
    const { save, snapshot } = JSON.parse(jsonData);
    const newSave = this.create(save);
    if (snapshot) {
      this.createSnapshot(newSave.id, snapshot);
    }
    return newSave;
  }
}
```

#### 5.3 前端服务

**文件位置**: `packages/frontend/src/services/saveService.ts`

**API 封装**:

```typescript
class SaveService {
  private baseUrl = '/api/saves';
  
  async getSaves(options: SaveQueryOptions = {}): Promise<SaveListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.templateId) params.set('template_id', options.templateId);
    
    const response = await fetch(`${this.baseUrl}?${params}`);
    return response.json() as Promise<SaveListResponse>;
  }
  
  async createSave(data: CreateSaveData): Promise<Save> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json() as Promise<Save>;
  }
  
  async exportSave(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/export`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `save_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  async importSave(file: File): Promise<Save> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      body: formData,
    });
    return response.json() as Promise<Save>;
  }
}

export const saveService = new SaveService();
```

#### 5.4 存档组件

**文件位置**: `packages/frontend/src/components/save/`

**SaveManager.tsx** - 主管理组件:
```typescript
const SaveManager: React.FC = () => {
  const [saves, setSaves] = useState<Save[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const loadSaves = async () => {
    const response = await saveService.getSaves({ page, limit: 10 });
    setSaves(response.saves);
    setTotalPages(response.totalPages);
  };
  
  return (
    <div className={styles.saveManager}>
      <SaveList saves={saves} onLoad={handleLoad} onDelete={handleDelete} />
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <SaveForm onSubmit={handleCreate} />
    </div>
  );
};
```

---

### 6. 上下文管理系统

#### 6.1 四层上下文压缩机制

**实现时间**: 第一阶段  
**文件位置**: `packages/backend/src/services/ContextService.ts`

**设计理念**:
- **Layer 1 (实时上下文)**: 最近 5-10 轮对话，保持完整内容
- **Layer 2 (短期记忆)**: 最近 20-50 轮，压缩为摘要
- **Layer 3 (中期记忆)**: 最近 100-200 轮，高度压缩
- **Layer 4 (长期记忆)**: 整个游戏历程，世界状态快照

**实现代码**:

```typescript
interface ContextState {
  layer1: {
    messages: Array<{ role: string; content: string }>;
  };
  layer2: {
    summary: string;
    keyEvents: string[];
  };
  layer3: {
    summary: string;
    mainPlot: string[];
  };
  layer4: {
    worldState: Record<string, unknown>;
    characterGrowth: Record<string, unknown>;
    majorEvents: Array<{ timestamp: number; description: string }>;
  };
}

class ContextService {
  async addMessage(message: { role: string; content: string }): Promise<void> {
    this.state.layer1.messages.push(message);
    
    if (this.state.layer1.messages.length > this.config.layer1MaxMessages) {
      await this.compress();
    }
  }
  
  async compress(): Promise<void> {
    const overflow = this.state.layer1.messages.slice(0, -this.config.layer1MaxMessages);
    const summary = await this.generateSummary(overflow);
    
    this.state.layer2.summary = summary;
    this.state.layer2.keyEvents = this.extractKeyEvents(overflow);
    
    if (this.shouldCompressLayer2()) {
      await this.compressLayer2ToLayer3();
    }
  }
  
  async saveSnapshot(saveId: string): Promise<void> {
    const snapshot: SaveSnapshot = {
      save_id: saveId,
      context_state: JSON.stringify(this.state),
      story_state: JSON.stringify(this.getStoryState()),
      created_at: Date.now(),
    };
    this.saveRepository.createSnapshot(snapshot);
  }
  
  async loadSnapshot(saveId: string): Promise<void> {
    const snapshot = this.saveRepository.getSnapshot(saveId);
    if (snapshot) {
      this.state = JSON.parse(snapshot.context_state);
    }
  }
}
```

#### 6.2 自动存档触发机制

**触发条件**:
1. **任务完成时** - `completeQuest` 方法调用后
2. **关键选择后** - 标记为关键的选择节点

**实现位置**: `packages/frontend/src/stores/gameStore.ts`

```typescript
completeQuest: (questId: string) => {
  const quest = state.quests.find(q => q.id === questId);
  if (quest) {
    quest.status = 'completed';
    
    if (state.autoSaveEnabled) {
      saveService.autoSave({
        trigger: 'quest_complete',
        questId,
      });
    }
  }
},
```

---

### 7. API 路由设计

#### 7.1 后端路由

**文件位置**: `packages/backend/src/routes/`

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/saves` | GET | 获取存档列表（支持分页、过滤） |
| `/api/saves` | POST | 创建新存档 |
| `/api/saves/:id` | GET | 获取单个存档 |
| `/api/saves/:id` | PUT | 更新存档 |
| `/api/saves/:id` | DELETE | 删除存档 |
| `/api/saves/:id/export` | GET | 导出存档为 JSON |
| `/api/saves/import` | POST | 导入存档 |
| `/api/saves/stats` | GET | 获取存档统计信息 |
| `/api/llm/config` | GET | 获取 LLM 配置 |
| `/api/llm/config` | POST | 更新 LLM 配置 |
| `/api/llm/chat` | POST | 发送聊天消息 |

---

### 8. TypeScript 类型安全实践

#### 8.1 常见类型错误及解决方案

**问题1: API 响应类型断言**
```typescript
const data = await response.json() as ExpectedType;
```

**问题2: 动态参数类型化**
```typescript
fn(params as Parameters<typeof fn>[0]);
```

**问题3: 接口必需属性**
```typescript
registerProvider(name, {
  provider: name,
  apiKey,
  baseURL,
});
```

#### 8.2 类型检查配置

**文件位置**: `.trae/rules/project_rules.md`

- 提交前必须运行 `npm run typecheck`
- CI 流程中包含类型检查步骤
- 保持 `tsconfig.json` 中 `strict: true`
- 开发时使用 `tsc --watch` 实时检查

---

## 待实现功能

### 第二阶段: 智能体系统
- [ ] 智能体框架和通信协议
- [ ] 统筹智能体
- [ ] 故事智能体
- [ ] UI 智能体

### 第三阶段: 核心玩法
- [ ] 角色创建流程
- [ ] 对话系统
- [ ] 任务系统
- [ ] 背包系统
- [ ] 装备系统
- [ ] 数值系统

### 第四阶段: 完善优化
- [ ] 模板系统
- [ ] 设置系统完善
- [ ] UI 各面板实现
- [ ] 测试和优化

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

*文档版本: v1.0*
*创建日期: 2025-02-28*
*最后更新: 2025-02-28*
