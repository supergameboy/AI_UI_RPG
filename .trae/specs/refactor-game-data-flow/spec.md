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

// 动态 UI 数据类型
interface DynamicUIData {
  id: string;           // UI 实例 ID
  type: DynamicUIType;  // UI 类型
  markdown: string;     // Markdown 内容
  context?: Record<string, unknown>;  // 上下文数据
}

// 支持的动态 UI 类型
type DynamicUIType = 
  | 'welcome'           // 欢迎界面
  | 'notification'      // 系统通知
  | 'dialog'            // 对话框
  | 'enhancement'       // 装备强化
  | 'warehouse'         // 仓库/银行
  | 'shop'              // 商店
  | 'custom';           // 自定义

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

### 动态 UI 生成约束

**核心约束**: 动态 UI 生成只能由 UIAgent 调用，因为涉及 AI 生成内容，与其他只有读写数据的 Tool 不同。

#### 架构设计

```
CoordinatorAgent（统筹智能体）
      ↓ 自然语言描述动态 UI 需求
Agent 间消息通信
      ↓
UIAgent 接收需求
      ↓ 调用 LLM 生成 Markdown
generateDynamicUI()
      ↓ 返回 DynamicUIData
UIDataTool.updateGameState({ dynamicUI })
      ↓ WebSocket 推送
前端 gameStore.updateGameState({ dynamicUI })
      ↓
DynamicUIPanel 渲染 MarkdownRenderer
```

#### 职责划分

| 角色 | 职责 | 调用方式 |
|------|------|----------|
| CoordinatorAgent | 描述动态 UI 需求（自然语言） | Agent 间消息通信 |
| UIAgent | 生成动态 UI（调用 LLM） | 接收消息，调用 generateDynamicUI |
| UIDataTool | 更新前端状态（读写数据） | 仅 UIAgent 可调用 updateGameState 更新 dynamicUI |
| 其他 Agent | 更新游戏数据（读写数据） | 可调用 UIDataTool.updateGameState 更新其他字段 |

#### 消息格式

```typescript
// CoordinatorAgent 发送给 UIAgent 的消息
interface DynamicUIRequest {
  type: 'generate_dynamic_ui';
  payload: {
    uiType: DynamicUIType;      // UI 类型
    description: string;         // 自然语言描述
    context: Record<string, unknown>;  // 上下文数据
  };
}

// UIAgent 返回的结果
interface DynamicUIResponse {
  dynamicUI: DynamicUIData;
}
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
- **开发者工具更新**（动态 UI 测试、状态调试、Markdown 预览、WebSocket 模拟器、数据流转监控）

## What Changes

- **BREAKING**: 重构初始化流程为 Agent 架构，CoordinatorAgent 使用预制初始化方法
- **BREAKING**: 统一游戏界面数据更新为单一 `updateGameState` 方法，支持所有数据类型
- **BREAKING**: 动态 UI 生成只能由 UIAgent 调用，其他 Agent 通过消息通信请求
- **NEW**: 实现通用 Markdown 动态 UI 渲染器（支持所有扩展组件）
- **NEW**: 实现 DynamicUIPanel 通用组件（替代所有专门的 UI 组件）
- **NEW**: 开发者工具更新（动态 UI 测试、状态调试、Markdown 预览、WebSocket 模拟器、数据流转监控）
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
  - `packages/frontend/src/components/dev/DevTools.tsx` - **更新** 开发者工具面板
  - `packages/frontend/src/components/dev/DynamicUITester.tsx` - **新建** 动态 UI 测试组件
  - `packages/frontend/src/components/dev/StateDebugger.tsx` - **新建** 状态调试面板
  - `packages/frontend/src/components/dev/MarkdownPreviewer.tsx` - **新建** Markdown 组件预览
  - `packages/frontend/src/components/dev/WebSocketSimulator.tsx` - **新建** WebSocket 模拟器
  - `packages/frontend/src/components/dev/DataFlowMonitor.tsx` - **新建** 数据流转监控

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
- **WHEN** 调用 `updateGameState({ dynamicUI: { type: 'welcome', markdown: '...' } })`
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
- **WHEN** 调用 `UIDataTool.updateGameState({ dynamicUI: { type: 'notification', markdown: '...' } })`
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

系统 SHALL 实现 DynamicUIPanel 通用组件，替代所有专门的 UI 组件。

#### Scenario: 显示欢迎界面
- **WHEN** `dynamicUI.type === 'welcome'`
- **THEN** 使用 MarkdownRenderer 渲染欢迎内容
- **AND** 应用欢迎界面样式

#### Scenario: 显示系统通知
- **WHEN** `dynamicUI.type === 'notification'`
- **THEN** 使用 MarkdownRenderer 渲染通知内容
- **AND** 应用通知样式

#### Scenario: 显示对话框
- **WHEN** `dynamicUI.type === 'dialog'`
- **THEN** 使用 MarkdownRenderer 渲染对话内容
- **AND** 应用对话框样式

#### Scenario: 显示装备强化界面
- **WHEN** `dynamicUI.type === 'enhancement'`
- **THEN** 使用 MarkdownRenderer 渲染强化内容
- **AND** 应用强化界面样式

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
  5. 调用 UIDataTool.updateGameState({ dynamicUI: { type: 'welcome', markdown } }) 显示

### Requirement: UIAgent 动态 UI 生成

系统 SHALL 扩展 UIAgent，支持生成各种类型的动态 UI。

#### Scenario: 生成欢迎界面
- **WHEN** 调用 `UIAgent.generateDynamicUI({ type: 'welcome', context })`
- **THEN** 使用 LLM 生成欢迎界面 Markdown
- **AND** 返回 DynamicUIData

#### Scenario: 生成系统通知
- **WHEN** 调用 `UIAgent.generateDynamicUI({ type: 'notification', context })`
- **THEN** 使用 LLM 生成通知 Markdown
- **AND** 返回 DynamicUIData

#### Scenario: 生成装备强化界面
- **WHEN** 调用 `UIAgent.generateDynamicUI({ type: 'enhancement', context })`
- **THEN** 使用 LLM 生成强化界面 Markdown
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

### Requirement: 开发者工具更新

系统 SHALL 更新开发者工具，支持新的数据流和动态 UI 系统的调试。

#### Scenario: 动态 UI 测试入口
- **WHEN** 开发者打开开发者工具
- **THEN** 显示"动态 UI 测试"标签页
- **AND** 可以选择 UI 类型（welcome, notification, dialog 等）
- **AND** 可以输入自然语言描述
- **AND** 点击"生成"后调用 UIAgent 生成动态 UI
- **AND** 在预览区域显示生成的 Markdown 和渲染效果

#### Scenario: 状态调试面板
- **WHEN** 开发者打开"状态调试"标签页
- **THEN** 显示当前 gameStore 的所有状态
- **AND** 可以编辑状态值
- **AND** 可以调用 updateGameState 更新状态
- **AND** 显示状态变更历史

#### Scenario: Markdown 组件预览
- **WHEN** 开发者打开"Markdown 预览"标签页
- **THEN** 可以输入 Markdown 内容
- **AND** 实时预览渲染效果
- **AND** 显示所有支持的扩展组件列表
- **AND** 提供组件语法示例

#### Scenario: WebSocket 模拟器
- **WHEN** 开发者打开"WebSocket 模拟器"标签页
- **THEN** 可以模拟后端推送 updateGameState 消息
- **AND** 可以选择预设的消息模板
- **AND** 可以编辑消息内容
- **AND** 点击"发送"后前端状态更新

#### Scenario: 数据流转监控
- **WHEN** 开发者打开"数据流转监控"标签页
- **THEN** 显示 updateGameState 的调用记录
- **AND** 每条记录包含时间戳、调用来源、更新内容
- **AND** 可以筛选和搜索记录
- **AND** 可以导出记录日志

## REMOVED Requirements

### Requirement: 面板硬编码模拟数据

**Reason**: 所有面板应从统一数据源获取数据
**Migration**: 将硬编码数据迁移到 `mockGameData.ts`

### Requirement: 独立的状态 setter 方法

**Reason**: 统一使用 `updateGameState` 方法
**Migration**: 所有调用改为 `updateGameState({ field: value })`

### Requirement: 专门的欢迎界面组件

**Reason**: 使用通用的 DynamicUIPanel 组件替代
**Migration**: 欢迎界面作为 `dynamicUI.type === 'welcome'` 的一种场景

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
  type: DynamicUIType;
  markdown: string;
  context?: Record<string, unknown>;
}

type DynamicUIType = 'welcome' | 'notification' | 'dialog' | 'enhancement' | 'warehouse' | 'shop' | 'custom';

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
UIAgent.generateDynamicUI({ type: 'welcome', context })
      ↓
UIDataTool.updateGameState({ dynamicUI: { type: 'welcome', markdown } })
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
