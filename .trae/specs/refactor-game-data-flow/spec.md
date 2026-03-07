# 游戏数据流与初始化重构 Spec

## Why

当前游戏界面中的角色、技能、装备、背包、任务、NPC、记录、地图等面板显示的都是硬编码的模拟数据，而不是从后端初始化流程获取的真实数据。日志显示初始化流程确实执行了，但数据没有正确传递到前端面板。需要：
1. 统一游戏界面数据更新方法（打包成 Tool 供智能体调用，支持动态 UI 数据）
2. 实现模拟游戏界面功能（开发者模式，纯前端模拟数据）
3. 重构初始化流程为总分总 Agent 架构模式（CoordinatorAgent 使用预制方法）
4. 正确使用游戏模板数据
5. **实现通用动态 UI 生成系统**（Markdown 动态 UI 组件，支持多种场景）

## 设计原则

### 统一数据更新原则

**核心原则**: 所有前端状态更新必须通过 `updateGameState` 方法，不创建冗余方法。

```typescript
// gameStore.updateGameState 支持的数据类型
interface GameState {
  // 角色数据
  character: Character | null;
  
  // 游戏状态数据
  skills: Skill[];
  inventory: InventoryItem[];
  equipment: EquipmentState;
  quests: Quest[];
  npcs: NPC[];
  mapData: MapData | null;
  journalEntries: JournalEntry[];
  
  // 动态 UI 数据（通用，支持多种场景）
  dynamicUI: DynamicUIData | null;
}

// 动态 UI 数据类型（通用，无类型区分）
interface DynamicUIData {
  id: string;           // UI 实例 ID
  markdown: string;     // Markdown 内容（决定展示形式）
  context?: Record<string, unknown>;  // 上下文数据
}

// 统一更新方法
updateGameState(data: Partial<GameState>): void;
```

### 数据流架构

```
后端 Agent/Tool
      ↓
WebSocket 推送
      ↓
前端 gameStore.updateGameState()
      ↓
React 组件自动更新
```

## 当前状态分析

### 已实现
- UIAgent 基础框架（解析其他智能体输出、生成 UI 指令）
- 基础 UI 指令类型（update, show, hide, animate, notify, dialog）
- PromptService 提示词管理服务
- 各 Agent 基础提示词模板（coordinator.md, ui.md 等）

### 未实现（本次需要实现）
- **Markdown 动态 UI 渲染器**（支持所有扩展组件）
- **DynamicUIPanel 通用组件**（替代专门的 WelcomeScreen）
- **UIAgent.generateDynamicUI** 方法
- **UIDataTool** 统一数据更新方法
- **gameStore.updateGameState** 统一更新方法
- **各 Agent 提示词更新**（支持新的工具调用方式和数据格式）

## What Changes

- **BREAKING**: 重构初始化流程为 Agent 架构，CoordinatorAgent 使用预制初始化方法
- **BREAKING**: 统一游戏界面数据更新为单一 `updateGameState` 方法，支持所有数据类型
- **NEW**: 实现通用 Markdown 动态 UI 渲染器（支持所有扩展组件）
- **NEW**: 实现 DynamicUIPanel 通用组件（替代所有专门的 UI 组件）
- 新增纯前端模拟数据服务，供开发者模式使用
- 修复面板数据与后端初始化数据的同步问题

## Impact

- Affected specs: `implement-game-initialization`, `refactor-initialization-flow`, `implement-agent-system`
- Affected code:
  - `packages/backend/src/agents/CoordinatorAgent.ts` - 添加预制初始化方法
  - `packages/backend/src/agents/UIAgent.ts` - 添加动态 UI 生成方法
  - `packages/backend/src/tools/implementations/UIDataTool.ts` - 统一数据更新方法
  - `packages/frontend/src/stores/gameStore.ts` - 统一 `updateGameState` 方法
  - `packages/frontend/src/components/ui/MarkdownRenderer.tsx` - **新建** Markdown 动态 UI 渲染器
  - `packages/frontend/src/components/ui/DynamicUIPanel.tsx` - **新建** 通用动态 UI 面板
  - `packages/frontend/src/data/mockGameData.ts` - **新建** 模拟数据
  - `packages/frontend/src/services/mockGameService.ts` - **新建** 模拟数据服务
  - `packages/frontend/src/components/panels/*.tsx` - 所有面板组件

## ADDED Requirements

### Requirement: 统一游戏界面数据更新方法

系统 SHALL 提供统一的 `updateGameState` 方法，支持所有数据类型的更新。

#### Scenario: 更新角色数据
- **WHEN** 调用 `updateGameState({ character: newCharacter })`
- **THEN** character 状态更新
- **AND** CharacterPanel 自动重新渲染

#### Scenario: 更新技能列表
- **WHEN** 调用 `updateGameState({ skills: newSkills })`
- **THEN** skills 状态更新
- **AND** SkillsPanel 自动重新渲染

#### Scenario: 显示动态 UI
- **WHEN** 调用 `updateGameState({ dynamicUI: { markdown: '...' } })`
- **THEN** dynamicUI 状态更新
- **AND** DynamicUIPanel 组件显示对应内容

#### Scenario: 关闭动态 UI
- **WHEN** 调用 `updateGameState({ dynamicUI: null })`
- **THEN** dynamicUI 状态清空
- **AND** DynamicUIPanel 组件隐藏

#### Scenario: 部分更新
- **WHEN** 调用 `updateGameState({ skills: newSkills })`
- **THEN** 只更新 skills 状态
- **AND** 其他状态保持不变

#### Scenario: 批量更新
- **WHEN** 调用 `updateGameState({ character, skills, inventory })`
- **THEN** 所有传入的状态同时更新
- **AND** 只触发一次重新渲染

### Requirement: UIDataTool 统一数据更新

系统 SHALL 实现 UIDataTool 作为 Agent 更新前端数据的统一接口。

#### Scenario: 智能体调用 UI 更新
- **WHEN** 任何 Agent 需要更新前端数据
- **THEN** 调用 UIDataTool 的 `updateGameState` 方法
- **AND** 通过 WebSocket 推送更新到前端
- **AND** 前端 gameStore 接收并更新状态

#### Scenario: 显示动态 UI
- **WHEN** 调用 `UIDataTool.updateGameState({ dynamicUI: { markdown: '...' } })`
- **THEN** 前端显示对应的动态 UI

### Requirement: Markdown 动态 UI 渲染器

系统 SHALL 实现 Markdown 动态 UI 渲染器，支持所有扩展组件语法。

#### Scenario: 渲染标准 Markdown
- **WHEN** 接收标准 Markdown 内容
- **THEN** 正确渲染标题、段落、列表、表格、引用等

#### Scenario: 渲染扩展组件 - 选项按钮
- **WHEN** 解析到 `:::options` 块
- **THEN** 渲染为可点击的按钮组
- **AND** 点击按钮触发 `onAction` 回调

```markdown
:::options
[选项A](action:choose_a) [选项B](action:choose_b)
:::
```

#### Scenario: 渲染扩展组件 - 进度条
- **WHEN** 解析到 `:::progress` 块
- **THEN** 渲染为可视化进度条

```markdown
:::progress{value=75 max=100 label="生命值"}
:::
```

#### Scenario: 渲染扩展组件 - 标签页
- **WHEN** 解析到 `:::tabs` 块
- **THEN** 渲染为可切换的标签页组件

```markdown
:::tabs
[属性](tab:attributes) [技能](tab:skills)
:::
```

#### Scenario: 渲染扩展组件 - 系统通知
- **WHEN** 解析到 `:::system-notify` 块
- **THEN** 渲染为带样式的通知框

```markdown
:::system-notify{type=achievement}
## 🏆 成就解锁！
内容...
:::
```

#### Scenario: 渲染扩展组件 - 徽章
- **WHEN** 解析到 `:::badge` 块
- **THEN** 渲染为徽章标签

```markdown
:::badge{type=rarity color=gold}
传说级
:::
```

#### Scenario: 渲染扩展组件 - 悬浮提示
- **WHEN** 解析到 `[文本](tooltip:提示内容)` 格式
- **THEN** 渲染为带悬浮提示的文本

#### Scenario: 渲染扩展组件 - 条件显示
- **WHEN** 解析到 `:::if{condition="..."} ` 块
- **THEN** 根据条件决定是否渲染内容

#### Scenario: 渲染扩展组件 - 装备强化
- **WHEN** 解析到 `:::enhancement` 块
- **THEN** 渲染为装备强化界面

#### Scenario: 渲染扩展组件 - 仓库/银行
- **WHEN** 解析到 `:::warehouse` 块
- **THEN** 渲染为仓库管理界面

#### Scenario: 处理 action 链接
- **WHEN** 解析到 `[文本](action:xxx)` 格式的链接
- **THEN** 渲染为可点击按钮
- **AND** 点击时调用 `onAction` 回调

### Requirement: DynamicUIPanel 通用组件

系统 SHALL 实现 DynamicUIPanel 通用组件，根据 Markdown 内容渲染动态 UI。

#### Scenario: 渲染动态 UI
- **WHEN** `dynamicUI` 存在
- **THEN** 使用 MarkdownRenderer 渲染 Markdown 内容
- **AND** 根据内容中的扩展组件语法应用对应样式

#### Scenario: 处理用户操作
- **WHEN** 用户点击 action 链接
- **THEN** 调用 `onAction` 回调
- **AND** 根据需要调用 `updateGameState({ dynamicUI: null })` 关闭面板

### Requirement: CoordinatorAgent 预制初始化方法

系统 SHALL 为 CoordinatorAgent 提供预制的初始化方法，因为初始化流程是固定的。

#### Scenario: 调用预制初始化方法
- **WHEN** 收到游戏初始化请求
- **THEN** CoordinatorAgent 调用 `initializeNewGame()` 预制方法
- **AND** 按固定顺序执行初始化步骤

#### Scenario: 预制初始化流程
- **GIVEN** 固定的初始化流程
- **WHEN** 执行初始化
- **THEN** 按以下顺序执行：
  1. 并行初始化各模块（NumericalAgent, SkillAgent, InventoryAgent 等）
  2. 整合结果
  3. 调用 UIDataTool.updateGameState 更新前端
  4. 调用 UIAgent 生成欢迎界面 Markdown
  5. 调用 UIDataTool.updateGameState({ dynamicUI: { markdown } }) 显示

### Requirement: UIAgent 动态 UI 生成

系统 SHALL 扩展 UIAgent，支持根据自然语言描述生成动态 UI Markdown。

#### Scenario: 生成动态 UI
- **WHEN** 调用 `UIAgent.generateDynamicUI(description)`
- **THEN** 使用 LLM 生成动态 UI Markdown
- **AND** 返回 DynamicUIData

### Requirement: 模拟游戏界面功能

系统 SHALL 在开发者模式下提供模拟游戏界面入口，使用纯前端模拟数据。

#### Scenario: 进入模拟游戏界面
- **WHEN** 开发者模式开启
- **AND** 用户点击"模拟游戏界面"按钮
- **THEN** 前端直接加载 mockGameData
- **AND** 调用 `updateGameState` 更新所有面板
- **AND** 不经过后端 API

### Requirement: 正确使用游戏模板数据

系统 SHALL 确保初始化流程正确使用模板中定义的数据。

#### Scenario: 使用模板初始技能
- **WHEN** SkillAgent 初始化角色技能
- **THEN** 根据角色职业从模板 `initialData.skills[classId]` 获取技能列表

#### Scenario: 使用模板初始物品
- **WHEN** InventoryAgent 初始化背包
- **THEN** 优先使用 `startingScene.items`
- **AND** 其次使用 `initialData.items[backgroundId]`

#### Scenario: 使用模板初始装备
- **WHEN** EquipmentAgent 初始化装备
- **THEN** 根据角色职业从模板 `initialData.equipment[classId]` 获取装备

#### Scenario: 使用模板初始任务
- **WHEN** QuestAgent 初始化任务
- **THEN** 从模板 `initialQuests` 获取任务列表

#### Scenario: 使用模板初始NPC
- **WHEN** NPCAgent 初始化NPC
- **THEN** 从模板 `initialNPCs` 获取NPC列表

## MODIFIED Requirements

### Requirement: 前端数据状态管理

系统 SHALL 在 gameStore 中维护完整的游戏状态数据，提供统一的更新方法。

**修改内容**:
- 新增所有游戏状态字段（skills, inventory, equipment, mapData, journalEntries, dynamicUI 等）
- **移除** 所有独立的 setter 方法
- **新增** `updateGameState(data: Partial<GameState>)` 统一更新方法
- 支持 WebSocket 监听，自动调用 updateGameState

### Requirement: 面板组件数据绑定

系统 SHALL 确保所有面板组件从 gameStore 获取数据。

**修改内容**:
- 所有面板从 gameStore 获取数据
- 所有面板处理空数据状态
- 移除所有硬编码的模拟数据

### Requirement: Agent 提示词更新

系统 SHALL 更新各 Agent 的提示词，支持新的工具调用方式和数据格式。

#### Scenario: CoordinatorAgent 提示词更新
- **WHEN** CoordinatorAgent 需要调用工具更新前端状态
- **THEN** 使用 UIDataTool.updateGameState 方法
- **AND** 提示词包含预制初始化方法说明

#### Scenario: UIAgent 提示词更新
- **WHEN** UIAgent 需要生成动态 UI
- **THEN** 使用 generateDynamicUI 方法
- **AND** 提示词包含 Markdown 动态 UI 组件语法说明
- **AND** 提示词包含 UIDataTool.updateGameState 工具使用说明

#### Scenario: 各专业 Agent 提示词更新
- **WHEN** 各专业 Agent 需要初始化数据
- **THEN** 提示词包含从模板获取数据的说明
- **AND** 提示词包含初始化方法调用示例

#### Scenario: 动态 UI 提示词模块
- **WHEN** 任何 Agent 需要生成动态 UI
- **THEN** 可引用 `modules/dynamic-ui.md` 模块
- **AND** 模块包含所有 Markdown 扩展组件语法

## REMOVED Requirements

### Requirement: 面板硬编码模拟数据

**Reason**: 所有面板应从统一数据源获取数据
**Migration**: 将硬编码数据迁移到 `mockGameData.ts`

### Requirement: 独立的状态 setter 方法

**Reason**: 统一使用 `updateGameState` 方法
**Migration**: 所有调用改为 `updateGameState({ field: value })`

### Requirement: 专门的欢迎界面组件

**Reason**: 使用通用的 DynamicUIPanel 组件替代
**Migration**: 欢迎界面作为 `dynamicUI` 的一种场景，由 Markdown 内容决定展示形式

## 技术设计

### gameStore 统一更新方法

```typescript
// packages/frontend/src/stores/gameStore.ts
interface GameState {
  character: Character | null;
  skills: Skill[];
  inventory: InventoryItem[];
  equipment: EquipmentState;
  quests: Quest[];
  npcs: NPC[];
  mapData: MapData | null;
  journalEntries: JournalEntry[];
  dynamicUI: DynamicUIData | null;
}

interface DynamicUIData {
  id: string;
  markdown: string;
  context?: Record<string, unknown>;
}

interface GameActions {
  updateGameState: (data: Partial<GameState>) => void;
}

export const useGameStore = create<GameState & GameActions>((set) => ({
  // 初始状态
  character: null,
  skills: [],
  inventory: [],
  equipment: { weapon: null, head: null, body: null, feet: null, accessories: [] },
  quests: [],
  npcs: [],
  mapData: null,
  journalEntries: [],
  dynamicUI: null,

  // 统一更新方法
  updateGameState: (data) => set((state) => ({ ...state, ...data })),
}));
```

### UIDataTool 统一方法

```typescript
// packages/backend/src/tools/implementations/UIDataTool.ts
export class UIDataTool extends ToolBase {
  protected registerMethods(): void {
    this.registerMethod('updateGameState', '更新游戏状态', false, { data: 'object' }, 'void');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    switch (method) {
      case 'updateGameState':
        return this.handleUpdateGameState(params.data as Partial<GameState>);
      default:
        return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found`);
    }
  }

  private async handleUpdateGameState(data: Partial<GameState>): Promise<ToolResponse<void>> {
    // 通过 WebSocket 推送到前端
    this.webSocketService.broadcast('game_state_update', data);
    return this.createSuccess(undefined);
  }
}
```

### 欢迎界面数据流

```
CoordinatorAgent.initializeNewGame()
      ↓
并行初始化各 Agent
      ↓
整合游戏状态数据
      ↓
UIDataTool.updateGameState(gameState)
      ↓ (WebSocket)
前端 gameStore.updateGameState(gameState)
      ↓
UIAgent.generateDynamicUI(description)
      ↓
UIDataTool.updateGameState({ dynamicUI: { markdown } })
      ↓ (WebSocket)
前端 gameStore.updateGameState({ dynamicUI: ... })
      ↓
DynamicUIPanel 组件渲染 MarkdownRenderer
```

### MarkdownRenderer 组件设计

```typescript
// packages/frontend/src/components/ui/MarkdownRenderer.tsx
interface MarkdownRendererProps {
  content: string;
  onAction?: (action: string, data?: unknown) => void;
}

// 支持的扩展组件
const customComponents = {
  options: OptionsComponent,
  progress: ProgressComponent,
  tabs: TabsComponent,
  'system-notify': SystemNotifyComponent,
  badge: BadgeComponent,
  tooltip: TooltipComponent,
  if: ConditionalComponent,
  enhancement: EnhancementComponent,
  warehouse: WarehouseComponent,
};
```

### DynamicUIPanel 通用组件

```typescript
// packages/frontend/src/components/ui/DynamicUIPanel.tsx
interface DynamicUIPanelProps {
  data: DynamicUIData;
  onAction?: (action: string, data?: unknown) => void;
  onClose?: () => void;
}

export const DynamicUIPanel: React.FC<DynamicUIPanelProps> = ({ data, onAction, onClose }) => {
  const { type, markdown, context } = data;
  
  // 根据类型应用不同样式
  const panelClassName = `dynamic-ui-panel dynamic-ui-${type}`;
  
  // 处理 action
  const handleAction = (action: string, actionData?: unknown) => {
    if (action === 'close') {
      gameStore.updateGameState({ dynamicUI: null });
      onClose?.();
    } else {
      onAction?.(action, actionData);
    }
  };
  
  return (
    <div className={panelClassName}>
      <MarkdownRenderer content={markdown} onAction={handleAction} />
    </div>
  );
};
```

### 欢迎界面 Markdown 示例

```markdown
:::system-notify{type=welcome}
## 🌟 欢迎来到星城市

**{character.name}**，你的故事即将开始！

---

### 角色信息
| 属性 | 值 |
|------|-----|
| 种族 | {character.race} |
| 职业 | {character.class} |
| 背景 | {character.background} |

### 初始状态
- 💰 金币: {gameState.inventory.gold}
- 📦 物品: {gameState.inventory.items.length} 件
- ⚔️ 技能: {gameState.skills.length} 个

---

> {template.worldSetting.description}

:::options
[开始冒险](action:start_game) [查看详情](action:view_details)
:::
:::
```

### 装备强化界面 Markdown 示例

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
[确认强化](action:confirm_enhance) [取消](action:close)
:::
:::
```

### 仓库界面 Markdown 示例

```markdown
:::warehouse
## 🏦 仓库管理

**背包空间**: 45/50
**仓库空间**: 120/200

:::tabs
[全部](tab:all) [装备](tab:equipment) [材料](tab:material)
:::

| 物品 | 数量 | 操作 |
|------|------|------|
| 强化石 | 15 | [存入](action:deposit:stone) [取出](action:withdraw:stone) |

:::options
[整理仓库](action:organize) [关闭](action:close)
:::
:::
```

## 前端细化设计

### 动态 UI 生成流程（关键约束）

**重要约束**: 动态 UI 只能由 UIAgent 调用 AI 生成，其他 Agent（包括 CoordinatorAgent）只能通过自然语言描述需求，由 UIAgent 生成动态 UI 结构化数据。

```
CoordinatorAgent（自然语言描述需求）
      ↓ Agent 间直接调用
UIAgent.generateDynamicUI(naturalLanguageDescription)
      ↓ 调用 LLM 生成 Markdown
返回 DynamicUIData
      ↓ 调用 UIDataTool
UIDataTool.updateGameState({ dynamicUI: data })
      ↓ WebSocket 推送
前端 gameStore 接收并更新
```

### gameStore 扩展设计

```typescript
// packages/frontend/src/stores/gameStore.ts
interface GameState {
  character: Character | null;
  skills: Skill[];
  inventory: InventoryItem[];
  equipment: EquipmentState;
  quests: Quest[];
  npcs: NPC[];
  mapData: MapData | null;
  journalEntries: JournalEntry[];
  dynamicUI: DynamicUIData | null;
}

interface GameActions {
  updateGameState: (data: Partial<GameState>) => void;
  sendDynamicUIAction: (action: string, data?: unknown) => void;
  initWebSocket: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // 初始状态
  character: null,
  skills: [],
  inventory: [],
  equipment: { weapon: null, head: null, body: null, feet: null, accessories: [] },
  quests: [],
  npcs: [],
  mapData: null,
  journalEntries: [],
  dynamicUI: null,

  // 统一更新方法
  updateGameState: (data) => set((state) => ({ ...state, ...data })),

  // 发送动态 UI 操作消息
  sendDynamicUIAction: (action, data) => {
    const { dynamicUI } = get();
    if (!dynamicUI) return;
    
    const message = {
      type: 'dynamic_ui_action',
      action,
      dynamicUIId: dynamicUI.id,
      context: dynamicUI.context,
      data,
    };
    
    // 通过 WebSocket 发送消息
    webSocketService.send(message);
    
    // 如果是关闭操作，清空 dynamicUI 状态
    if (action === 'close') {
      set({ dynamicUI: null });
    }
  },

  // 初始化 WebSocket 监听
  initWebSocket: () => {
    webSocketService.on('game_state_update', (data: Partial<GameState>) => {
      get().updateGameState(data);
    });
  },
}));
```

### MarkdownRenderer 实现设计

**技术选型**: 使用 `react-markdown` 库，通过 `components` 配置处理扩展组件。

**扩展组件解析方式**: 
1. 预处理 Markdown，将 `:::component-name` 转换为 `<div class="dynamic-ui-component-name">`
2. 在 react-markdown 的 components 配置中，根据 className 判断组件类型并渲染

```typescript
// packages/frontend/src/components/ui/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  onAction?: (action: string, data?: unknown) => void;
}

// 预处理：将 :::component-name 转换为 <div class="dynamic-ui-component-name">
const preprocessMarkdown = (content: string): string => {
  return content.replace(
    /:::(\w+)(?:\{([^}]*)\})?([\s\S]*?):::/g,
    (match, componentName, attrs, innerContent) => {
      const className = `dynamic-ui-${componentName}`;
      return `<div class="${className}" data-attrs="${attrs || ''}">${innerContent}</div>`;
    }
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onAction }) => {
  const processedContent = preprocessMarkdown(content);
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        div: ({ node, className, children, ...props }) => {
          // 根据 className 判断组件类型
          if (className?.startsWith('dynamic-ui-')) {
            const componentName = className.replace('dynamic-ui-', '');
            const attrs = (props as any)['data-attrs'] || '';
            
            switch (componentName) {
              case 'options':
                return <OptionsComponent content={children as string} onAction={onAction} />;
              case 'progress':
                return <ProgressComponent attrs={attrs} content={children as string} />;
              case 'tabs':
                return <TabsComponent content={children as string} />;
              case 'system-notify':
                return <SystemNotifyComponent attrs={attrs} content={children as string} />;
              case 'badge':
                return <BadgeComponent attrs={attrs} content={children as string} />;
              case 'enhancement':
                return <EnhancementComponent content={children as string} onAction={onAction} />;
              case 'warehouse':
                return <WarehouseComponent content={children as string} onAction={onAction} />;
              default:
                return <div className={className}>{children}</div>;
            }
          }
          return <div className={className}>{children}</div>;
        },
        a: ({ href, children }) => {
          // 处理 action:xxx 格式的链接
          if (href?.startsWith('action:')) {
            const action = href.replace('action:', '');
            return (
              <button onClick={() => onAction?.(action)}>
                {children}
              </button>
            );
          }
          // 处理 tooltip:xxx 格式的链接
          if (href?.startsWith('tooltip:')) {
            const tooltip = href.replace('tooltip:', '');
            return (
              <span title={tooltip} className="tooltip-text">
                {children}
              </span>
            );
          }
          return <a href={href}>{children}</a>;
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};
```

### DynamicUIPanel 窗口化设计

**窗口功能**: 支持拖拽移动、缩放大小

```typescript
// packages/frontend/src/components/ui/DynamicUIPanel.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores';

interface DynamicUIPanelProps {
  data: DynamicUIData;
}

export const DynamicUIPanel: React.FC<DynamicUIPanelProps> = ({ data }) => {
  const { id, markdown } = data;
  const sendDynamicUIAction = useGameStore((state) => state.sendDynamicUIAction);
  
  // 窗口状态
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  
  // 处理 action
  const handleAction = (action: string, actionData?: unknown) => {
    sendDynamicUIAction(action, actionData);
  };
  
  // 关闭窗口
  const handleClose = () => {
    sendDynamicUIAction('close');
  };
  
  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.dynamic-ui-panel-close')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
    if (isResizing && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setSize({
        width: Math.max(300, e.clientX - rect.left),
        height: Math.max(200, e.clientY - rect.top),
      });
    }
  }, [isDragging, isResizing, dragOffset]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);
  
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  return (
    <div
      ref={panelRef}
      className="dynamic-ui-panel"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div className="dynamic-ui-panel-header" onMouseDown={handleMouseDown}>
        <span className="dynamic-ui-panel-title">动态界面</span>
        <button className="dynamic-ui-panel-close" onClick={handleClose}>×</button>
      </div>
      <div className="dynamic-ui-panel-content">
        <MarkdownRenderer content={markdown} onAction={handleAction} />
      </div>
      <div
        className="dynamic-ui-panel-resize"
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
};
```

### 动态 UI 操作消息格式

```typescript
// 前端发送的动态 UI 操作消息
interface DynamicUIActionMessage {
  type: 'dynamic_ui_action';
  action: string;           // 操作类型：'close', 'start_game', 'confirm_enhance' 等
  dynamicUIId: string;      // 动态 UI 实例 ID
  context?: Record<string, unknown>;  // 上下文数据
  data?: unknown;           // 操作附加数据
}

// 后端响应流程
// 1. CoordinatorAgent 接收消息
// 2. 根据 action 和 context 决定如何响应
// 3. 可能调用 UIAgent 生成新的动态 UI
// 4. 通过 UIDataTool.updateGameState 更新前端
```

## 开发者工具细化设计

### 新增标签页

在现有开发者工具面板中添加三个独立标签页：

```typescript
// 更新 TABS 配置
const TABS = [
  // ... 现有标签页
  { id: 'ui-agent-test', label: 'UIAgent测试', icon: 'ui' },
  { id: 'mock-dynamic-ui', label: '模拟动态UI', icon: 'mock' },
  { id: 'dynamic-ui-state', label: '动态UI状态', icon: 'state' },
];
```

### UIAgent 测试工具

```typescript
// packages/frontend/src/components/developer/UIAgentTestPanel.tsx
interface UIAgentTestPanelProps {}

export const UIAgentTestPanel: React.FC<UIAgentTestPanelProps> = () => {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<DynamicUIData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTest = async () => {
    setIsLoading(true);
    try {
      // 调用后端 API 测试 UIAgent
      const response = await fetch('/api/developer/test-ui-agent', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
      const data = await response.json();
      setResult(data.dynamicUI);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="ui-agent-test-panel">
      <div className="test-input">
        <label>自然语言描述：</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例如：生成一个欢迎界面，显示角色创建摘要和初始状态"
        />
        <button onClick={handleTest} disabled={isLoading}>
          {isLoading ? '生成中...' : '测试生成'}
        </button>
      </div>
      
      {result && (
        <div className="test-result">
          <h4>生成结果：</h4>
          <div className="result-meta">
            <span>ID: {result.id}</span>
            <span>类型: {result.type}</span>
          </div>
          <div className="result-preview">
            <MarkdownRenderer content={result.markdown} />
          </div>
          <div className="result-markdown">
            <h5>Markdown 源码：</h5>
            <pre>{result.markdown}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 模拟动态 UI 数据生成器

```typescript
// packages/frontend/src/components/developer/MockDynamicUIPanel.tsx
export const MockDynamicUIPanel: React.FC = () => {
  const updateGameState = useGameStore((state) => state.updateGameState);
  
  const [markdown, setMarkdown] = useState('');
  
  const presetTemplates: Record<string, string> = {
    welcome: `:::system-notify{type=welcome}\n## 欢迎\n...\n:::`,
    notification: `:::system-notify{type=achievement}\n## 成就解锁\n...\n:::`,
    dialog: `:::system-notify\n## NPC对话\n...\n:::`,
    enhancement: `:::enhancement\n## 装备强化\n...\n:::`,
    warehouse: `:::warehouse\n## 仓库管理\n...\n:::`,
    shop: `:::warehouse\n## 商店\n...\n:::`,
    custom: '',
  };
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome');
  
  const handleGenerate = () => {
    const dynamicUI: DynamicUIData = {
      id: `mock-${Date.now()}`,
      markdown,
      context: {},
    };
    updateGameState({ dynamicUI });
  };
  
  return (
    <div className="mock-dynamic-ui-panel">
      <div className="mock-controls">
        <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
          <option value="welcome">欢迎界面</option>
          <option value="notification">系统通知</option>
          <option value="dialog">对话框</option>
          <option value="enhancement">装备强化</option>
          <option value="warehouse">仓库</option>
          <option value="shop">商店</option>
          <option value="custom">自定义</option>
        </select>
        <button onClick={() => setMarkdown(presetTemplates[selectedTemplate])}>
          加载模板
        </button>
      </div>
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="输入 Markdown 内容..."
      />
      <button onClick={handleGenerate}>生成动态 UI</button>
    </div>
  );
};
```

### 动态 UI 状态查看器

```typescript
// packages/frontend/src/components/developer/DynamicUIStatePanel.tsx
export const DynamicUIStatePanel: React.FC = () => {
  const dynamicUI = useGameStore((state) => state.dynamicUI);
  
  return (
    <div className="dynamic-ui-state-panel">
      {dynamicUI ? (
        <>
          <div className="state-info">
            <h4>当前动态 UI 状态</h4>
            <div className="info-item">
              <label>ID:</label>
              <span>{dynamicUI.id}</span>
            </div>
            <div className="info-item">
              <label>上下文:</label>
              <pre>{JSON.stringify(dynamicUI.context, null, 2)}</pre>
            </div>
          </div>
          <div className="state-preview">
            <h4>预览</h4>
            <MarkdownRenderer content={dynamicUI.markdown} />
          </div>
          <div className="state-markdown">
            <h4>Markdown 源码</h4>
            <pre>{dynamicUI.markdown}</pre>
          </div>
        </>
      ) : (
        <div className="no-dynamic-ui">
          当前没有显示动态 UI
        </div>
      )}
    </div>
  );
};
```

### 数据模拟面板（新增）

**功能概述**: 模拟后端向前端发送的界面数据更新（updateGameState），支持多种数据模板测试前端渲染。

**组织方式**: 新标签页包含所有功能

**数据模板分类**: 按面板分类，每个面板下有正常数据、残缺数据、错误数据三种类型

**数据发送方式**: 模拟 WebSocket 推送，发送完 console.log 方便调试

**模板存储**: 独立数据文件 `mockDataTemplates.ts`

**模板编辑**: 支持临时编辑，修改不会保存（刷新后恢复）

**发送历史**: 记录最近 10 条发送历史，可以重新发送

```typescript
// packages/frontend/src/data/mockDataTemplates.ts

// ==================== 角色数据模板 ====================
export const characterTemplates = {
  normal: [
    {
      name: '战士角色',
      data: {
        character: {
          id: 'char-001',
          name: '铁血战士',
          race: 'human',
          class: 'warrior',
          background: 'soldier',
          level: 5,
          experience: 1250,
          attributes: {
            strength: 16,
            dexterity: 12,
            constitution: 14,
            intelligence: 10,
            wisdom: 8,
            charisma: 10,
          },
          health: { current: 80, max: 80 },
          mana: { current: 30, max: 30 },
        },
      },
    },
    {
      name: '法师角色',
      data: {
        character: {
          id: 'char-002',
          name: '星语者',
          race: 'elf',
          class: 'mage',
          background: 'scholar',
          level: 5,
          experience: 1250,
          attributes: {
            strength: 8,
            dexterity: 12,
            constitution: 10,
            intelligence: 16,
            wisdom: 14,
            charisma: 10,
          },
          health: { current: 50, max: 50 },
          mana: { current: 100, max: 100 },
        },
      },
    },
    {
      name: '盗贼角色',
      data: {
        character: {
          id: 'char-003',
          name: '暗影行者',
          race: 'halfling',
          class: 'rogue',
          background: 'criminal',
          level: 5,
          experience: 1250,
          attributes: {
            strength: 10,
            dexterity: 16,
            constitution: 12,
            intelligence: 12,
            wisdom: 10,
            charisma: 14,
          },
          health: { current: 60, max: 60 },
          mana: { current: 40, max: 40 },
        },
      },
    },
  ],
  
  incomplete: [
    {
      name: '缺少 name 字段',
      data: {
        character: {
          id: 'char-004',
          race: 'human',
          class: 'warrior',
          level: 5,
        },
      },
    },
    {
      name: 'attributes 为空对象',
      data: {
        character: {
          id: 'char-005',
          name: '测试角色',
          race: 'human',
          class: 'warrior',
          attributes: {},
        },
      },
    },
    {
      name: 'health.current 为 null',
      data: {
        character: {
          id: 'char-006',
          name: '受伤角色',
          race: 'human',
          class: 'warrior',
          health: { current: null, max: 80 },
        },
      },
    },
  ],
  
  error: [
    {
      name: 'level 为字符串',
      data: {
        character: {
          id: 'char-007',
          name: '错误角色',
          level: 'five',
        },
      },
    },
    {
      name: 'attributes 字段类型错误',
      data: {
        character: {
          id: 'char-008',
          name: '错误角色',
          attributes: 'invalid',
        },
      },
    },
    {
      name: '嵌套对象不完整',
      data: {
        character: {
          id: 'char-009',
          name: '错误角色',
          health: { current: 80 },
        },
      },
    },
  ],
};

// ==================== 技能数据模板 ====================
export const skillsTemplates = {
  normal: [
    {
      name: '战士技能组',
      data: {
        skills: [
          { id: 'skill-001', name: '猛击', type: 'active', level: 3, cooldown: 2, description: '造成 150% 武器伤害' },
          { id: 'skill-002', name: '盾击', type: 'active', level: 2, cooldown: 3, description: '眩晕敌人 1 回合' },
          { id: 'skill-003', name: '战斗怒吼', type: 'buff', level: 2, cooldown: 5, description: '增加攻击力 20%' },
        ],
      },
    },
    {
      name: '法师技能组',
      data: {
        skills: [
          { id: 'skill-004', name: '火球术', type: 'active', level: 4, cooldown: 1, description: '造成 80 点火焰伤害' },
          { id: 'skill-005', name: '冰霜护盾', type: 'buff', level: 3, cooldown: 4, description: '吸收 50 点伤害' },
          { id: 'skill-006', name: '传送', type: 'active', level: 2, cooldown: 3, description: '传送到指定位置' },
        ],
      },
    },
    {
      name: '盗贼技能组',
      data: {
        skills: [
          { id: 'skill-007', name: '背刺', type: 'active', level: 4, cooldown: 2, description: '造成 200% 暴击伤害' },
          { id: 'skill-008', name: '潜行', type: 'buff', level: 3, cooldown: 5, description: '隐身 3 回合' },
          { id: 'skill-009', name: '毒刃', type: 'active', level: 2, cooldown: 3, description: '附加毒素伤害' },
        ],
      },
    },
  ],
  
  incomplete: [
    {
      name: '技能缺少 description',
      data: {
        skills: [
          { id: 'skill-010', name: '测试技能', type: 'active', level: 1 },
        ],
      },
    },
    {
      name: 'skills 为空数组',
      data: {
        skills: [],
      },
    },
    {
      name: 'cooldown 为 null',
      data: {
        skills: [
          { id: 'skill-011', name: '测试技能', type: 'active', level: 1, cooldown: null },
        ],
      },
    },
  ],
  
  error: [
    {
      name: 'level 为负数',
      data: {
        skills: [
          { id: 'skill-012', name: '错误技能', level: -1 },
        ],
      },
    },
    {
      name: 'skills 为字符串',
      data: {
        skills: 'invalid',
      },
    },
    {
      name: '技能对象缺少 id',
      data: {
        skills: [
          { name: '无ID技能', type: 'active' },
        ],
      },
    },
  ],
};

// ==================== 背包数据模板 ====================
export const inventoryTemplates = {
  normal: [
    {
      name: '新手背包',
      data: {
        inventory: {
          gold: 100,
          items: [
            { id: 'item-001', name: '治疗药水', type: 'consumable', quantity: 5, rarity: 'common' },
            { id: 'item-002', name: '铁剑', type: 'weapon', quantity: 1, rarity: 'common', stats: { attack: 10 } },
            { id: 'item-003', name: '皮甲', type: 'armor', quantity: 1, rarity: 'common', stats: { defense: 5 } },
          ],
        },
      },
    },
    {
      name: '中级背包',
      data: {
        inventory: {
          gold: 500,
          items: [
            { id: 'item-004', name: '精钢剑', type: 'weapon', quantity: 1, rarity: 'uncommon', stats: { attack: 25 } },
            { id: 'item-005', name: '锁子甲', type: 'armor', quantity: 1, rarity: 'uncommon', stats: { defense: 15 } },
            { id: 'item-006', name: '魔法药水', type: 'consumable', quantity: 10, rarity: 'uncommon' },
          ],
        },
      },
    },
    {
      name: '高级背包',
      data: {
        inventory: {
          gold: 2000,
          items: [
            { id: 'item-007', name: '龙鳞剑', type: 'weapon', quantity: 1, rarity: 'rare', stats: { attack: 50 } },
            { id: 'item-008', name: '暗影斗篷', type: 'armor', quantity: 1, rarity: 'rare', stats: { defense: 30 } },
            { id: 'item-009', name: '复活石', type: 'consumable', quantity: 1, rarity: 'legendary' },
          ],
        },
      },
    },
  ],
  
  incomplete: [
    {
      name: '缺少 gold 字段',
      data: {
        inventory: {
          items: [
            { id: 'item-010', name: '测试物品', quantity: 1 },
          ],
        },
      },
    },
    {
      name: 'items 为空数组',
      data: {
        inventory: {
          gold: 100,
          items: [],
        },
      },
    },
    {
      name: '物品缺少 rarity',
      data: {
        inventory: {
          gold: 100,
          items: [
            { id: 'item-011', name: '测试物品', type: 'consumable', quantity: 1 },
          ],
        },
      },
    },
  ],
  
  error: [
    {
      name: 'gold 为负数',
      data: {
        inventory: {
          gold: -100,
          items: [],
        },
      },
    },
    {
      name: 'quantity 为 0',
      data: {
        inventory: {
          gold: 100,
          items: [
            { id: 'item-012', name: '错误物品', quantity: 0 },
          ],
        },
      },
    },
    {
      name: 'items 包含重复 id',
      data: {
        inventory: {
          gold: 100,
          items: [
            { id: 'item-013', name: '物品1', quantity: 1 },
            { id: 'item-013', name: '物品2', quantity: 1 },
          ],
        },
      },
    },
  ],
};

// ==================== 装备数据模板 ====================
export const equipmentTemplates = {
  normal: [
    {
      name: '战士装备',
      data: {
        equipment: {
          weapon: { id: 'equip-001', name: '铁剑', rarity: 'common', stats: { attack: 10 } },
          head: { id: 'equip-002', name: '铁头盔', rarity: 'common', stats: { defense: 3 } },
          body: { id: 'equip-003', name: '铁甲', rarity: 'common', stats: { defense: 8 } },
          feet: { id: 'equip-004', name: '铁靴', rarity: 'common', stats: { defense: 2 } },
          accessories: [
            { id: 'equip-005', name: '力量戒指', rarity: 'uncommon', stats: { strength: 2 } },
          ],
        },
      },
    },
    {
      name: '法师装备',
      data: {
        equipment: {
          weapon: { id: 'equip-006', name: '法杖', rarity: 'uncommon', stats: { magic: 20 } },
          head: { id: 'equip-007', name: '法师帽', rarity: 'uncommon', stats: { mana: 20 } },
          body: { id: 'equip-008', name: '法袍', rarity: 'uncommon', stats: { defense: 5 } },
          feet: null,
          accessories: [],
        },
      },
    },
    {
      name: '空装备',
      data: {
        equipment: {
          weapon: null,
          head: null,
          body: null,
          feet: null,
          accessories: [],
        },
      },
    },
  ],
  
  incomplete: [
    {
      name: '缺少 accessories 字段',
      data: {
        equipment: {
          weapon: { id: 'equip-009', name: '测试武器' },
        },
      },
    },
    {
      name: 'weapon 为 undefined',
      data: {
        equipment: {
          weapon: undefined,
          head: null,
          body: null,
          feet: null,
          accessories: [],
        },
      },
    },
  ],
  
  error: [
    {
      name: 'equipment 为 null',
      data: {
        equipment: null,
      },
    },
    {
      name: 'accessories 不是数组',
      data: {
        equipment: {
          weapon: null,
          accessories: 'invalid',
        },
      },
    },
  ],
};

// ==================== 任务数据模板 ====================
export const questsTemplates = {
  normal: [
    {
      name: '主线任务',
      data: {
        quests: [
          { id: 'quest-001', name: '拯救村庄', type: 'main', status: 'in_progress', objectives: [{ id: 'obj-001', description: '击败强盗首领', completed: false }] },
          { id: 'quest-002', name: '寻找草药', type: 'side', status: 'available', objectives: [{ id: 'obj-002', description: '收集 5 个草药', completed: false }] },
        ],
      },
    },
    {
      name: '已完成任务',
      data: {
        quests: [
          { id: 'quest-003', name: '新手教程', type: 'main', status: 'completed', objectives: [{ id: 'obj-003', description: '完成教程', completed: true }] },
        ],
      },
    },
    {
      name: '多任务',
      data: {
        quests: [
          { id: 'quest-004', name: '主线任务1', type: 'main', status: 'in_progress', objectives: [] },
          { id: 'quest-005', name: '支线任务1', type: 'side', status: 'in_progress', objectives: [] },
          { id: 'quest-006', name: '支线任务2', type: 'side', status: 'available', objectives: [] },
          { id: 'quest-007', name: '日常任务', type: 'daily', status: 'available', objectives: [] },
        ],
      },
    },
  ],
  
  incomplete: [
    {
      name: '任务缺少 objectives',
      data: {
        quests: [
          { id: 'quest-008', name: '测试任务', type: 'main', status: 'in_progress' },
        ],
      },
    },
    {
      name: 'quests 为空数组',
      data: {
        quests: [],
      },
    },
  ],
  
  error: [
    {
      name: 'status 为无效值',
      data: {
        quests: [
          { id: 'quest-009', name: '错误任务', status: 'invalid' },
        ],
      },
    },
    {
      name: 'type 为无效值',
      data: {
        quests: [
          { id: 'quest-010', name: '错误任务', type: 'invalid', status: 'in_progress' },
        ],
      },
    },
  ],
};

// ==================== NPC 数据模板 ====================
export const npcsTemplates = {
  normal: [
    {
      name: '村庄NPC',
      data: {
        npcs: [
          { id: 'npc-001', name: '村长', type: 'quest_giver', location: 'village_center', disposition: 'friendly' },
          { id: 'npc-002', name: '铁匠', type: 'merchant', location: 'blacksmith', disposition: 'neutral' },
          { id: 'npc-003', name: '药剂师', type: 'merchant', location: 'alchemy_shop', disposition: 'friendly' },
        ],
      },
    },
    {
      name: '战斗NPC',
      data: {
        npcs: [
          { id: 'npc-004', name: '强盗首领', type: 'enemy', location: 'bandit_camp', disposition: 'hostile', health: { current: 100, max: 100 } },
          { id: 'npc-005', name: '强盗', type: 'enemy', location: 'bandit_camp', disposition: 'hostile', health: { current: 50, max: 50 } },
        ],
      },
    },
    {
      name: '友好NPC',
      data: {
        npcs: [
          { id: 'npc-006', name: '旅行商人', type: 'merchant', location: 'road', disposition: 'friendly' },
          { id: 'npc-007', name: '神秘老人', type: 'quest_giver', location: 'forest', disposition: 'neutral' },
        ],
      },
    },
  ],
  
  incomplete: [
    {
      name: 'NPC缺少 location',
      data: {
        npcs: [
          { id: 'npc-008', name: '测试NPC', type: 'merchant' },
        ],
      },
    },
    {
      name: 'npcs 为空数组',
      data: {
        npcs: [],
      },
    },
  ],
  
  error: [
    {
      name: 'disposition 为无效值',
      data: {
        npcs: [
          { id: 'npc-009', name: '错误NPC', disposition: 'invalid' },
        ],
      },
    },
    {
      name: 'type 为无效值',
      data: {
        npcs: [
          { id: 'npc-010', name: '错误NPC', type: 'invalid' },
        ],
      },
    },
  ],
};

// ==================== 日志数据模板 ====================
export const journalTemplates = {
  normal: [
    {
      name: '游戏日志',
      data: {
        journalEntries: [
          { id: 'journal-001', timestamp: Date.now() - 3600000, type: 'quest', content: '接受了拯救村庄的任务' },
          { id: 'journal-002', timestamp: Date.now() - 1800000, type: 'combat', content: '击败了强盗' },
          { id: 'journal-003', timestamp: Date.now(), type: 'discovery', content: '发现了隐藏的宝箱' },
        ],
      },
    },
    {
      name: '空日志',
      data: {
        journalEntries: [],
      },
    },
    {
      name: '大量日志',
      data: {
        journalEntries: Array.from({ length: 50 }, (_, i) => ({
          id: `journal-${i + 4}`,
          timestamp: Date.now() - i * 60000,
          type: ['quest', 'combat', 'discovery', 'dialog'][i % 4],
          content: `日志条目 ${i + 4}`,
        })),
      },
    },
  ],
  
  incomplete: [
    {
      name: '日志缺少 timestamp',
      data: {
        journalEntries: [
          { id: 'journal-054', type: 'quest', content: '测试日志' },
        ],
      },
    },
    {
      name: '日志缺少 content',
      data: {
        journalEntries: [
          { id: 'journal-055', timestamp: Date.now(), type: 'quest' },
        ],
      },
    },
  ],
  
  error: [
    {
      name: 'type 为无效值',
      data: {
        journalEntries: [
          { id: 'journal-056', timestamp: Date.now(), type: 'invalid', content: '测试' },
        ],
      },
    },
    {
      name: 'timestamp 为字符串',
      data: {
        journalEntries: [
          { id: 'journal-057', timestamp: 'invalid', type: 'quest', content: '测试' },
        ],
      },
    },
  ],
};

// ==================== 地图数据模板 ====================
export const mapTemplates = {
  normal: [
    {
      name: '村庄地图',
      data: {
        mapData: {
          id: 'map-001',
          name: '新手村',
          width: 20,
          height: 15,
          playerPosition: { x: 10, y: 7 },
          tiles: [
            { x: 0, y: 0, type: 'grass' },
            { x: 1, y: 0, type: 'grass' },
          ],
          npcs: ['npc-001', 'npc-002'],
          exits: [{ x: 19, y: 7, targetMap: 'map-002' }],
        },
      },
    },
    {
      name: '地牢地图',
      data: {
        mapData: {
          id: 'map-002',
          name: '强盗巢穴',
          width: 30,
          height: 20,
          playerPosition: { x: 0, y: 10 },
          tiles: [
            { x: 0, y: 0, type: 'wall' },
            { x: 1, y: 0, type: 'floor' },
          ],
          npcs: ['npc-004', 'npc-005'],
          exits: [{ x: 0, y: 10, targetMap: 'map-001' }],
        },
      },
    },
    {
      name: '空地图',
      data: {
        mapData: null,
      },
    },
  ],
  
  incomplete: [
    {
      name: '地图缺少 playerPosition',
      data: {
        mapData: {
          id: 'map-003',
          name: '测试地图',
          width: 10,
          height: 10,
        },
      },
    },
    {
      name: '地图缺少 tiles',
      data: {
        mapData: {
          id: 'map-004',
          name: '测试地图',
          playerPosition: { x: 5, y: 5 },
        },
      },
    },
  ],
  
  error: [
    {
      name: 'playerPosition 超出边界',
      data: {
        mapData: {
          id: 'map-005',
          name: '错误地图',
          width: 10,
          height: 10,
          playerPosition: { x: 100, y: 100 },
        },
      },
    },
    {
      name: 'width 为负数',
      data: {
        mapData: {
          id: 'map-006',
          name: '错误地图',
          width: -10,
          height: 10,
        },
      },
    },
  ],
};

// ==================== 动态 UI 数据模板 ====================
export const dynamicUITemplates = {
  normal: [
    {
      name: '欢迎界面',
      data: {
        dynamicUI: {
          id: 'dynamic-ui-001',
          markdown: `:::system-notify{type=welcome}
## 🌟 欢迎来到星城市

**测试角色**，你的故事即将开始！

---

### 角色信息
| 属性 | 值 |
|------|-----|
| 种族 | 人类 |
| 职业 | 战士 |
| 背景 | 士兵 |

:::options
[开始冒险](action:start_game)
:::
:::`,
          context: { characterId: 'char-001' },
        },
      },
    },
    {
      name: '系统通知',
      data: {
        dynamicUI: {
          id: 'dynamic-ui-002',
          markdown: `:::system-notify{type=achievement}
## 🏆 成就解锁！

**首次击杀**

你成功击败了第一个敌人！

---

奖励：
- 经验值 +50
- 金币 +10
:::`,
          context: {},
        },
      },
    },
    {
      name: '装备强化界面',
      data: {
        dynamicUI: {
          id: 'dynamic-ui-003',
          markdown: `:::enhancement
## ⚒️ 装备强化

当前装备：**精钢长剑** (Lv.3)
成功率：**65%**

| 属性 | 当前 | 强化后 |
|------|------|--------|
| 攻击力 | 25 | 32 |

:::options
[确认强化](action:confirm_enhance) [取消](action:close)
:::
:::`,
          context: { itemId: 'item-004' },
        },
      },
    },
  ],
  
  incomplete: [
    {
      name: '动态UI缺少 context',
      data: {
        dynamicUI: {
          id: 'dynamic-ui-004',
          markdown: '## 测试',
        },
      },
    },
    {
      name: 'markdown 为空字符串',
      data: {
        dynamicUI: {
          id: 'dynamic-ui-005',
          markdown: '',
        },
      },
    },
  ],
  
  error: [
    {
      name: 'markdown 为 null',
      data: {
        dynamicUI: {
          id: 'dynamic-ui-006',
          markdown: null,
        },
      },
    },
    {
      name: 'id 为空字符串',
      data: {
        dynamicUI: {
          id: '',
          markdown: '## 测试',
        },
      },
    },
  ],
};

// ==================== 综合数据示例 ====================
export const combinedTemplates = {
  normal: [
    {
      name: '新游戏开始',
      description: '新游戏初始化后的完整状态',
      data: {
        character: characterTemplates.normal[0].data.character,
        skills: skillsTemplates.normal[0].data.skills,
        inventory: inventoryTemplates.normal[0].data.inventory,
        equipment: equipmentTemplates.normal[2].data.equipment,
        quests: questsTemplates.normal[0].data.quests,
        npcs: npcsTemplates.normal[0].data.npcs,
        journalEntries: journalTemplates.normal[0].data.journalEntries,
        mapData: mapTemplates.normal[0].data.mapData,
        dynamicUI: dynamicUITemplates.normal[0].data.dynamicUI,
      },
    },
    {
      name: '战斗胜利后',
      description: '战斗胜利后的状态，有经验和金币奖励',
      data: {
        character: {
          ...characterTemplates.normal[0].data.character,
          experience: 1500,
        },
        inventory: {
          gold: 200,
          items: inventoryTemplates.normal[0].data.inventory.items,
        },
        journalEntries: [
          ...journalTemplates.normal[0].data.journalEntries,
          { id: 'journal-100', timestamp: Date.now(), type: 'combat', content: '战斗胜利！获得 250 经验和 100 金币' },
        ],
        dynamicUI: dynamicUITemplates.normal[1].data.dynamicUI,
      },
    },
    {
      name: '交易完成',
      description: '与NPC交易完成后的状态',
      data: {
        character: characterTemplates.normal[0].data.character,
        inventory: {
          gold: 50,
          items: [
            ...inventoryTemplates.normal[0].data.inventory.items,
            { id: 'item-020', name: '新购买的物品', type: 'consumable', quantity: 3, rarity: 'common' },
          ],
        },
        journalEntries: [
          ...journalTemplates.normal[0].data.journalEntries,
          { id: 'journal-101', timestamp: Date.now(), type: 'trade', content: '与铁匠交易完成' },
        ],
        dynamicUI: null,
      },
    },
  ],
};

// ==================== 导出所有模板 ====================
export const allTemplates = {
  character: characterTemplates,
  skills: skillsTemplates,
  inventory: inventoryTemplates,
  equipment: equipmentTemplates,
  quests: questsTemplates,
  npcs: npcsTemplates,
  journalEntries: journalTemplates,
  mapData: mapTemplates,
  dynamicUI: dynamicUITemplates,
  combined: combinedTemplates,
};
```

### 数据模拟面板组件

```typescript
// packages/frontend/src/components/developer/DataSimulatorPanel.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../stores';
import { allTemplates } from '../../data/mockDataTemplates';
import type { GameState } from '../../stores/gameStore';

interface SendHistory {
  id: string;
  timestamp: number;
  data: Partial<GameState>;
  preview: string;
}

export const DataSimulatorPanel: React.FC = () => {
  const updateGameState = useGameStore((state) => state.updateGameState);
  
  // 当前选中的面板
  const [selectedPanel, setSelectedPanel] = useState<keyof typeof allTemplates>('character');
  
  // 当前选中的类型
  const [selectedType, setSelectedType] = useState<'normal' | 'incomplete' | 'error'>('normal');
  
  // 当前选中的模板索引
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  
  // 编辑中的数据（JSON 字符串）
  const [editedData, setEditedData] = useState('');
  
  // 发送历史
  const [sendHistory, setSendHistory] = useState<SendHistory[]>([]);
  
  // 自定义数据模式
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  // 自由组合选择
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  
  // 获取当前面板的模板
  const currentTemplates = allTemplates[selectedPanel]?.[selectedType] || [];
  const currentTemplate = currentTemplates[selectedTemplateIndex];
  
  // 更新编辑数据
  useEffect(() => {
    if (currentTemplate && !isCustomMode) {
      setEditedData(JSON.stringify(currentTemplate.data, null, 2));
    }
  }, [currentTemplate, isCustomMode]);
  
  // 发送数据
  const handleSend = () => {
    try {
      const data = JSON.parse(editedData);
      
      // 模拟 WebSocket 推送
      updateGameState(data);
      
      // console.log 方便调试
      console.log('[DataSimulator] Sent data:', data);
      
      // 记录发送历史
      const historyEntry: SendHistory = {
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        data,
        preview: JSON.stringify(data).substring(0, 100) + '...',
      };
      
      setSendHistory((prev) => [historyEntry, ...prev.slice(0, 9)]);
      
      alert('数据已发送！请查看 console.log');
    } catch (error) {
      alert(`JSON 解析错误: ${error}`);
    }
  };
  
  // 重新发送历史数据
  const handleResendHistory = (entry: SendHistory) => {
    updateGameState(entry.data);
    console.log('[DataSimulator] Resent data:', entry.data);
    alert('历史数据已重新发送！');
  };
  
  // 自由组合发送
  const handleCombinedSend = () => {
    const combinedData: Partial<GameState> = {};
    
    selectedPanels.forEach((panelKey) => {
      const [panel, type, index] = panelKey.split('-');
      const template = allTemplates[panel as keyof typeof allTemplates]?.[type as 'normal' | 'incomplete' | 'error']?.[parseInt(index)];
      if (template) {
        Object.assign(combinedData, template.data);
      }
    });
    
    setEditedData(JSON.stringify(combinedData, null, 2));
    setIsCustomMode(false);
  };
  
  return (
    <div className="data-simulator-panel">
      {/* 模式切换 */}
      <div className="mode-tabs">
        <button
          className={!isCustomMode ? 'active' : ''}
          onClick={() => setIsCustomMode(false)}
        >
          单面板模板
        </button>
        <button
          className={isCustomMode ? 'active' : ''}
          onClick={() => setIsCustomMode(true)}
        >
          自由组合
        </button>
      </div>
      
      {!isCustomMode ? (
        <>
          {/* 单面板模板选择 */}
          <div className="panel-selector">
            <select value={selectedPanel} onChange={(e) => {
              setSelectedPanel(e.target.value as keyof typeof allTemplates);
              setSelectedTemplateIndex(0);
            }}>
              <option value="character">角色数据</option>
              <option value="skills">技能数据</option>
              <option value="inventory">背包数据</option>
              <option value="equipment">装备数据</option>
              <option value="quests">任务数据</option>
              <option value="npcs">NPC数据</option>
              <option value="journalEntries">日志数据</option>
              <option value="mapData">地图数据</option>
              <option value="dynamicUI">动态UI数据</option>
              <option value="combined">综合数据</option>
            </select>
          </div>
          
          <div className="type-selector">
            <button
              className={selectedType === 'normal' ? 'active' : ''}
              onClick={() => { setSelectedType('normal'); setSelectedTemplateIndex(0); }}
            >
              正常数据
            </button>
            <button
              className={selectedType === 'incomplete' ? 'active' : ''}
              onClick={() => { setSelectedType('incomplete'); setSelectedTemplateIndex(0); }}
            >
              残缺数据
            </button>
            <button
              className={selectedType === 'error' ? 'active' : ''}
              onClick={() => { setSelectedType('error'); setSelectedTemplateIndex(0); }}
            >
              错误数据
            </button>
          </div>
          
          <div className="template-list">
            {currentTemplates.map((template, index) => (
              <button
                key={index}
                className={selectedTemplateIndex === index ? 'active' : ''}
                onClick={() => setSelectedTemplateIndex(index)}
              >
                {template.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* 自由组合选择 */}
          <div className="combined-selector">
            <h4>选择数据模板组合：</h4>
            {Object.entries(allTemplates).map(([panel, templates]) => (
              <div key={panel} className="combined-panel">
                <h5>{panel}</h5>
                {Object.entries(templates).map(([type, typeTemplates]) => (
                  <div key={type} className="combined-type">
                    <span>{type}:</span>
                    {typeTemplates.map((template, index) => (
                      <label key={index}>
                        <input
                          type="checkbox"
                          checked={selectedPanels.has(`${panel}-${type}-${index}`)}
                          onChange={(e) => {
                            const newSet = new Set(selectedPanels);
                            if (e.target.checked) {
                              newSet.add(`${panel}-${type}-${index}`);
                            } else {
                              newSet.delete(`${panel}-${type}-${index}`);
                            }
                            setSelectedPanels(newSet);
                          }}
                        />
                        {template.name}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <button onClick={handleCombinedSend}>生成组合数据</button>
          </div>
        </>
      )}
      
      {/* 数据编辑器 */}
      <div className="data-editor">
        <h4>数据内容（可临时编辑）：</h4>
        <textarea
          value={editedData}
          onChange={(e) => setEditedData(e.target.value)}
          rows={15}
        />
      </div>
      
      {/* 发送按钮 */}
      <div className="send-actions">
        <button onClick={handleSend}>发送数据</button>
        <button onClick={() => setEditedData('')}>清空</button>
      </div>
      
      {/* 发送历史 */}
      <div className="send-history">
        <h4>发送历史（最近 10 条）：</h4>
        {sendHistory.length === 0 ? (
          <div className="no-history">暂无发送历史</div>
        ) : (
          <ul>
            {sendHistory.map((entry) => (
              <li key={entry.id}>
                <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span>{entry.preview}</span>
                <button onClick={() => handleResendHistory(entry)}>重新发送</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
```

### 更新 DeveloperPanel.tsx

```typescript
// 在 TABS 配置中添加新标签页
const TABS = [
  // ... 现有标签页
  { id: 'data-simulator', label: '数据模拟', icon: 'database' },
];

// 在 renderTabContent 中添加渲染
case 'data-simulator':
  return <DataSimulatorPanel />;
```
