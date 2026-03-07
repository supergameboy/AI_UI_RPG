import { randomUUID } from 'crypto';
import {
  AgentType,
  type AgentMessage,
  type AgentResponse,
  type UIInstruction,
  type Message,
  type AgentBinding,
  type ToolType,
  type DynamicUIData,
} from '@ai-rpg/shared';
import { ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';
import { gameLog } from '../services/GameLogService';

/**
 * 动态 UI 系统提示词
 */
const DYNAMIC_UI_SYSTEM_PROMPT = `你是动态 UI 生成专家，负责将自然语言描述转换为 Markdown 格式的动态 UI。

## 支持的 Markdown 扩展组件

### 1. 选项按钮组 (:::options)
\`\`\`markdown
:::options{layout=vertical}
[选项文本](action:action-name)
[取消](action:cancel)
:::
\`\`\`

### 2. 进度条 (:::progress)
\`\`\`markdown
:::progress{value=75 max=100 label="生命值" color="health"}
:::
\`\`\`

### 3. 标签页 (:::tabs)
\`\`\`markdown
:::tabs
[标签1](tab:tab1)
内容1
[标签2](tab:tab2)
内容2
:::
\`\`\`

### 4. 系统通知 (:::system-notify)
\`\`\`markdown
:::system-notify{type=welcome}
## 标题
内容
:::
\`\`\`
type 可选值: welcome, achievement, warning, error, info

### 5. 徽章 (:::badge)
\`\`\`markdown
:::badge{type=rarity color=legendary}
传说
:::
\`\`\`

### 6. 悬浮提示
\`\`\`markdown
[显示文本](tooltip:提示内容)
\`\`\`

### 7. 条件显示 (:::conditional)
\`\`\`markdown
:::conditional{condition="hasItem:magic-key"}
内容
:::
\`\`\`

### 8. 装备强化 (:::enhancement)
\`\`\`markdown
:::enhancement{name="装备名" currentLevel=5 maxLevel=10 successRate=75}
[强化石](material:enhance-stone required=3 owned=5)
:::
\`\`\`

### 9. 仓库/银行 (:::warehouse)
\`\`\`markdown
:::warehouse{maxSlots=100}
[背包](tab:inventory maxSlots=50 usedSlots=30)
[物品名](item:item-id qty=5 rarity=common)
:::
\`\`\`

## 输出要求

1. 只输出 Markdown 内容，不要添加额外的解释
2. 使用适当的组件类型
3. 确保语法正确
4. 根据描述选择最合适的组件组合`;

/**
 * UI指令类型
 */
type UIInstructionType = 'update' | 'show' | 'hide' | 'animate' | 'notify' | 'dialog' | 'custom';

/**
 * UI指令解析结果
 */
interface ParsedUIContent {
  instructions: UIInstruction[];
  rawContent: string;
  source: AgentType;
}

/**
 * UI组件配置
 */
interface UIComponentConfig {
  id: string;
  type: string;
  props: Record<string, unknown>;
  visible: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/**
 * 通知配置
 */
interface NotificationConfig {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: string;
  }>;
}

/**
 * 弹窗配置
 */
interface DialogConfig {
  id: string;
  title: string;
  content: string;
  type: 'alert' | 'confirm' | 'prompt' | 'custom';
  buttons?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  closable?: boolean;
  data?: Record<string, unknown>;
}

/**
 * 动态 UI 缓存条目
 */
interface DynamicUICacheEntry {
  markdown: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * UI智能体
 * 负责解析其他智能体输出、生成UI指令、管理动态组件
 */
export class UIAgent extends AgentBase {
  readonly type: AgentType = AgentType.UI;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.UI_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AgentType.COORDINATOR, enabled: true },
  ];

  readonly systemPrompt = `你是UI管理智能体，负责将其他智能体的输出转换为前端可执行的UI指令。

你的职责：
1. 解析其他智能体返回的结构化数据
2. 生成标准化的UI指令
3. 管理动态UI组件的显示和隐藏
4. 处理通知和弹窗的生成

支持的UI指令类型：
- update: 更新UI组件内容或状态
- show: 显示UI组件
- hide: 隐藏UI组件
- animate: 执行UI动画
- notify: 显示通知消息
- dialog: 显示弹窗
- custom: 自定义UI指令

输出格式要求：
所有UI指令必须符合UIInstruction接口规范：
{
  "type": "update|show|hide|animate|notify|dialog|custom",
  "target": "组件ID或选择器",
  "action": "具体动作",
  "data": { /* 相关数据 */ },
  "options": {
    "duration": 动画持续时间(ms),
    "easing": "动画缓动函数",
    "priority": "low|normal|high|critical"
  }
}`;

  private activeComponents: Map<string, UIComponentConfig> = new Map();
  private notificationQueue: NotificationConfig[] = [];
  private activeDialogs: Map<string, DialogConfig> = new Map();

  // 动态 UI 缓存
  private dynamicUICache: Map<string, DynamicUICacheEntry> = new Map();
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 分钟

  protected getAgentName(): string {
    return 'UI Agent';
  }

  protected getAgentDescription(): string {
    return 'UI管理智能体，负责解析其他智能体输出、生成UI指令、管理动态组件';
  }

  protected getAgentCapabilities(): string[] {
    return ['instruction_parsing', 'component_rendering', 'notification_handling', 'dynamic_ui'];
  }

  /**
   * 处理消息
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { action, data } = message.payload;
    const typedData = data as Record<string, unknown>;

    switch (action) {
      case 'parse_output':
        return this.handleParseOutput(message.from, typedData);
      case 'generate_instructions':
        return this.handleGenerateInstructions(typedData);
      case 'show_notification':
        return this.handleShowNotification(typedData);
      case 'show_dialog':
        return this.handleShowDialog(typedData);
      case 'update_component':
        return this.handleUpdateComponent(typedData);
      case 'hide_component':
        return this.handleHideComponent(typedData);
      case 'animate_component':
        return this.handleAnimateComponent(typedData);
      case 'get_ui_state':
        return this.handleGetUIState();
      case 'clear_notifications':
        return this.handleClearNotifications();
      case 'generate_dynamic_ui':
        return this.handleGenerateDynamicUI(typedData);
      default:
        return this.handleUnknownAction(action, typedData);
    }
  }

  /**
   * 解析其他智能体的输出
   */
  private async handleParseOutput(
    source: AgentType,
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const parsed = this.parseAgentOutput(source, data);
      const instructions = this.generateUIInstructions(parsed);

      this.addMemory(
        `Parsed output from ${source}: ${instructions.length} instructions generated`,
        'assistant',
        5,
        { source, instructionCount: instructions.length }
      );

      return {
        success: true,
        data: { parsed, instructions },
        uiInstructions: instructions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse output',
      };
    }
  }

  /**
   * 解析智能体输出内容
   */
  parseAgentOutput(source: AgentType, data: Record<string, unknown>): ParsedUIContent {
    const rawContent = JSON.stringify(data);
    const instructions: UIInstruction[] = [];

    // 根据不同智能体类型解析输出
    switch (source) {
      case AgentType.COORDINATOR:
        instructions.push(...this.parseCoordinatorOutput(data));
        break;
      case AgentType.STORY_CONTEXT:
        instructions.push(...this.parseStoryContextOutput(data));
        break;
      case AgentType.QUEST:
        instructions.push(...this.parseQuestOutput(data));
        break;
      case AgentType.MAP:
        instructions.push(...this.parseMapOutput(data));
        break;
      case AgentType.NPC_PARTY:
        instructions.push(...this.parseNPCOutput(data));
        break;
      case AgentType.NUMERICAL:
        instructions.push(...this.parseNumericalOutput(data));
        break;
      case AgentType.INVENTORY:
        instructions.push(...this.parseInventoryOutput(data));
        break;
      case AgentType.SKILL:
        instructions.push(...this.parseSkillOutput(data));
        break;
      case AgentType.COMBAT:
        instructions.push(...this.parseCombatOutput(data));
        break;
      case AgentType.DIALOGUE:
        instructions.push(...this.parseDialogueOutput(data));
        break;
      case AgentType.EVENT:
        instructions.push(...this.parseEventOutput(data));
        break;
      default:
        // 通用解析
        instructions.push(...this.parseGenericOutput(data));
    }

    return {
      instructions,
      rawContent,
      source,
    };
  }

  /**
   * 解析协调器输出
   */
  private parseCoordinatorOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    // 处理玩家意图反馈
    if (data.intent) {
      instructions.push(this.createUpdateInstruction('intent-display', 'show_intent', {
        intent: data.intent,
        confidence: data.confidence,
      }));
    }

    // 处理任务分配结果
    if (data.taskAllocation) {
      instructions.push(this.createUpdateInstruction('task-panel', 'update_tasks', {
        tasks: data.taskAllocation,
      }));
    }

    // 处理整合结果
    if (data.integratedResult) {
      instructions.push(this.createUpdateInstruction('main-content', 'update_content', {
        content: data.integratedResult,
      }));
    }

    return instructions;
  }

  /**
   * 解析故事上下文输出
   */
  private parseStoryContextOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.storyProgress) {
      instructions.push(this.createUpdateInstruction('story-panel', 'update_progress', {
        progress: data.storyProgress,
      }));
    }

    if (data.plotPoint) {
      instructions.push(this.createUpdateInstruction('narrative-box', 'show_plot', {
        plotPoint: data.plotPoint,
      }));
    }

    if (data.choices) {
      instructions.push(this.createUpdateInstruction('choice-panel', 'show_choices', {
        choices: data.choices,
      }));
    }

    return instructions;
  }

  /**
   * 解析任务输出
   */
  private parseQuestOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.newQuest) {
      instructions.push(this.createNotifyInstruction({
        type: 'info',
        title: '新任务',
        message: data.newQuest as string,
        duration: 5000,
      }));
      instructions.push(this.createUpdateInstruction('quest-log', 'add_quest', {
        quest: data.questDetails,
      }));
    }

    if (data.questProgress) {
      instructions.push(this.createUpdateInstruction('quest-tracker', 'update_progress', {
        progress: data.questProgress,
      }));
    }

    if (data.questCompleted) {
      instructions.push(this.createNotifyInstruction({
        type: 'success',
        title: '任务完成',
        message: data.questCompleted as string,
        duration: 5000,
      }));
    }

    return instructions;
  }

  /**
   * 解析地图输出
   */
  private parseMapOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.currentLocation) {
      instructions.push(this.createUpdateInstruction('location-display', 'update_location', {
        location: data.currentLocation,
      }));
    }

    if (data.availableExits) {
      instructions.push(this.createUpdateInstruction('exit-panel', 'update_exits', {
        exits: data.availableExits,
      }));
    }

    if (data.mapUpdate) {
      instructions.push(this.createUpdateInstruction('minimap', 'update_map', {
        mapData: data.mapUpdate,
      }));
    }

    return instructions;
  }

  /**
   * 解析NPC输出
   */
  private parseNPCOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.npcInteraction) {
      instructions.push(this.createUpdateInstruction('npc-panel', 'show_interaction', {
        npc: data.npcInteraction,
      }));
    }

    if (data.relationshipChange) {
      instructions.push(this.createNotifyInstruction({
        type: 'info',
        title: '关系变化',
        message: data.relationshipChange as string,
        duration: 3000,
      }));
    }

    if (data.partyUpdate) {
      instructions.push(this.createUpdateInstruction('party-panel', 'update_party', {
        party: data.partyUpdate,
      }));
    }

    return instructions;
  }

  /**
   * 解析数值输出
   */
  private parseNumericalOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.attributeUpdate) {
      instructions.push(this.createUpdateInstruction('attribute-panel', 'update_attributes', {
        attributes: data.attributeUpdate,
      }));
    }

    if (data.levelUp) {
      instructions.push(this.createNotifyInstruction({
        type: 'success',
        title: '升级',
        message: `恭喜升到 ${data.levelUp} 级！`,
        duration: 5000,
      }));
      instructions.push(this.createAnimateInstruction('character-panel', 'level_up', {
        level: data.levelUp,
      }));
    }

    if (data.statChange) {
      instructions.push(this.createUpdateInstruction('stat-bars', 'update_stats', {
        stats: data.statChange,
      }));
    }

    return instructions;
  }

  /**
   * 解析背包输出
   */
  private parseInventoryOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.itemAcquired) {
      instructions.push(this.createNotifyInstruction({
        type: 'success',
        title: '获得物品',
        message: data.itemAcquired as string,
        duration: 3000,
      }));
    }

    if (data.inventoryUpdate) {
      instructions.push(this.createUpdateInstruction('inventory-panel', 'update_inventory', {
        items: data.inventoryUpdate,
      }));
    }

    if (data.equipmentChange) {
      instructions.push(this.createUpdateInstruction('equipment-panel', 'update_equipment', {
        equipment: data.equipmentChange,
      }));
    }

    return instructions;
  }

  /**
   * 解析技能输出
   */
  private parseSkillOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.skillLearned) {
      instructions.push(this.createNotifyInstruction({
        type: 'success',
        title: '学会技能',
        message: data.skillLearned as string,
        duration: 4000,
      }));
    }

    if (data.skillList) {
      instructions.push(this.createUpdateInstruction('skill-panel', 'update_skills', {
        skills: data.skillList,
      }));
    }

    if (data.cooldownUpdate) {
      instructions.push(this.createUpdateInstruction('skill-bar', 'update_cooldowns', {
        cooldowns: data.cooldownUpdate,
      }));
    }

    return instructions;
  }

  /**
   * 解析战斗输出
   */
  private parseCombatOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.combatStart) {
      instructions.push(this.createShowInstruction('combat-ui', 'start_combat', {
        enemies: data.enemies,
      }));
    }

    if (data.combatAction) {
      instructions.push(this.createAnimateInstruction('combat-area', 'combat_action', {
        action: data.combatAction,
        attacker: data.attacker,
        target: data.target,
        damage: data.damage,
      }));
    }

    if (data.combatEnd) {
      instructions.push(this.createHideInstruction('combat-ui', 'end_combat', {}));
      if (data.victory) {
        instructions.push(this.createNotifyInstruction({
          type: 'success',
          title: '战斗胜利',
          message: data.reward as string,
          duration: 5000,
        }));
      }
    }

    return instructions;
  }

  /**
   * 解析对话输出
   */
  private parseDialogueOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.dialogueStart) {
      instructions.push(this.createShowInstruction('dialogue-box', 'start_dialogue', {
        speaker: data.speaker,
        portrait: data.portrait,
      }));
    }

    if (data.dialogueContent) {
      instructions.push(this.createUpdateInstruction('dialogue-box', 'update_content', {
        content: data.dialogueContent,
        speaker: data.speaker,
      }));
    }

    if (data.dialogueOptions) {
      instructions.push(this.createUpdateInstruction('dialogue-options', 'show_options', {
        options: data.dialogueOptions,
      }));
    }

    if (data.dialogueEnd) {
      instructions.push(this.createHideInstruction('dialogue-box', 'end_dialogue', {}));
    }

    return instructions;
  }

  /**
   * 解析事件输出
   */
  private parseEventOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    if (data.eventTriggered) {
      instructions.push(this.createNotifyInstruction({
        type: 'warning',
        title: '事件触发',
        message: data.eventTriggered as string,
        duration: 5000,
      }));
    }

    if (data.randomEvent) {
      instructions.push(this.createDialogInstruction({
        id: `event-${Date.now()}`,
        title: '随机事件',
        content: data.randomEvent as string,
        type: 'custom',
        buttons: data.eventChoices as Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>,
        closable: false,
        data: data.eventData as Record<string, unknown>,
      }));
    }

    return instructions;
  }

  /**
   * 通用输出解析
   */
  private parseGenericOutput(data: Record<string, unknown>): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    // 检查是否有消息需要显示
    if (data.message) {
      instructions.push(this.createNotifyInstruction({
        type: 'info',
        title: '提示',
        message: data.message as string,
        duration: 3000,
      }));
    }

    // 检查是否有错误
    if (data.error) {
      instructions.push(this.createNotifyInstruction({
        type: 'error',
        title: '错误',
        message: data.error as string,
        duration: 5000,
      }));
    }

    return instructions;
  }

  /**
   * 生成UI指令
   */
  generateUIInstructions(parsed: ParsedUIContent): UIInstruction[] {
    return parsed.instructions.map(instruction => this.validateAndEnhanceInstruction(instruction));
  }

  /**
   * 验证并增强指令
   */
  private validateAndEnhanceInstruction(instruction: UIInstruction): UIInstruction {
    // 确保必要字段存在
    const enhanced: UIInstruction = {
      type: instruction.type,
      target: instruction.target,
      action: instruction.action,
      data: instruction.data || {},
      options: {
        duration: instruction.options?.duration ?? 300,
        easing: instruction.options?.easing ?? 'ease-out',
        priority: instruction.options?.priority ?? 'normal',
      },
    };

    return enhanced;
  }

  /**
   * 处理生成指令请求
   */
  private async handleGenerateInstructions(
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const content = data.content as string;
      const targetType = data.targetType as string;

      // 使用LLM解析内容并生成指令
      const messages: Message[] = [
        {
          role: 'user',
          content: `请将以下内容转换为UI指令。目标类型: ${targetType}\n\n内容: ${content}`,
        },
      ];

      const response = await this.callLLM(messages, { temperature: 0.3 });
      const llmContent = response.content;

      // 解析LLM返回的JSON
      const instructions = this.parseLLMInstructions(llmContent);

      return {
        success: true,
        data: { instructions, rawContent: llmContent },
        uiInstructions: instructions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate instructions',
      };
    }
  }

  /**
   * 解析LLM返回的指令
   */
  private parseLLMInstructions(content: string): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    try {
      // 尝试提取JSON数组
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as UIInstruction[];
        instructions.push(...parsed.map(i => this.validateAndEnhanceInstruction(i)));
      }
    } catch {
      // 如果解析失败，创建一个简单的显示指令
      instructions.push(this.createUpdateInstruction('main-content', 'show_content', {
        content,
      }));
    }

    return instructions;
  }

  /**
   * 处理显示通知
   */
  private async handleShowNotification(
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const config = data.config as NotificationConfig;
      const instruction = this.createNotifyInstruction(config);

      this.notificationQueue.push(config);

      return {
        success: true,
        data: { notification: config },
        uiInstructions: [instruction],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to show notification',
      };
    }
  }

  /**
   * 处理显示弹窗
   */
  private async handleShowDialog(
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const config = data.config as DialogConfig;
      const instruction = this.createDialogInstruction(config);

      this.activeDialogs.set(config.id, config);

      return {
        success: true,
        data: { dialog: config },
        uiInstructions: [instruction],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to show dialog',
      };
    }
  }

  /**
   * 处理更新组件
   */
  private async handleUpdateComponent(
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const target = data.target as string;
      const updateData = data.data as Record<string, unknown>;
      const priority = data.priority as 'low' | 'normal' | 'high' | 'critical' | undefined;

      const instruction = this.createUpdateInstruction(target, 'update', updateData, priority);

      // 更新组件状态
      const existing = this.activeComponents.get(target);
      if (existing) {
        this.activeComponents.set(target, {
          ...existing,
          props: { ...existing.props, ...updateData },
        });
      }

      return {
        success: true,
        data: { target, updateData },
        uiInstructions: [instruction],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update component',
      };
    }
  }

  /**
   * 处理隐藏组件
   */
  private async handleHideComponent(
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const target = data.target as string;
      const hideData = data.data as Record<string, unknown> | undefined;

      const instruction = this.createHideInstruction(target, 'hide', hideData || {});

      // 更新组件状态
      const existing = this.activeComponents.get(target);
      if (existing) {
        this.activeComponents.set(target, { ...existing, visible: false });
      }

      return {
        success: true,
        data: { target },
        uiInstructions: [instruction],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to hide component',
      };
    }
  }

  /**
   * 处理动画组件
   */
  private async handleAnimateComponent(
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    try {
      const target = data.target as string;
      const animation = data.animation as string;
      const animationData = data.data as Record<string, unknown>;
      const duration = data.duration as number | undefined;
      const easing = data.easing as string | undefined;

      const instruction = this.createAnimateInstruction(target, animation, animationData, duration, easing);

      return {
        success: true,
        data: { target, animation },
        uiInstructions: [instruction],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to animate component',
      };
    }
  }

  /**
   * 获取UI状态
   */
  private async handleGetUIState(): Promise<AgentResponse> {
    return {
      success: true,
      data: {
        activeComponents: Array.from(this.activeComponents.entries()),
        notificationQueue: this.notificationQueue,
        activeDialogs: Array.from(this.activeDialogs.entries()),
      },
    };
  }

  /**
   * 清除通知
   */
  private async handleClearNotifications(): Promise<AgentResponse> {
    this.notificationQueue = [];
    return {
      success: true,
      data: { cleared: true },
    };
  }

  /**
   * 处理未知动作
   */
  private async handleUnknownAction(
    action: string,
    _data: Record<string, unknown>
  ): Promise<AgentResponse> {
    return {
      success: false,
      error: `Unknown action: ${action}`,
    };
  }

  // ==================== 指令创建辅助方法 ====================

  /**
   * 创建更新指令
   */
  createUpdateInstruction(
    target: string,
    action: string,
    data: Record<string, unknown>,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): UIInstruction {
    return {
      type: 'update',
      target,
      action,
      data,
      options: { priority },
    };
  }

  /**
   * 创建显示指令
   */
  createShowInstruction(
    target: string,
    action: string,
    data: Record<string, unknown>
  ): UIInstruction {
    return {
      type: 'show',
      target,
      action,
      data,
      options: { priority: 'normal' },
    };
  }

  /**
   * 创建隐藏指令
   */
  createHideInstruction(
    target: string,
    action: string,
    data: Record<string, unknown>
  ): UIInstruction {
    return {
      type: 'hide',
      target,
      action,
      data,
      options: { priority: 'normal' },
    };
  }

  /**
   * 创建动画指令
   */
  createAnimateInstruction(
    target: string,
    action: string,
    data: Record<string, unknown>,
    duration: number = 300,
    easing: string = 'ease-out'
  ): UIInstruction {
    return {
      type: 'animate',
      target,
      action,
      data,
      options: { duration, easing, priority: 'normal' },
    };
  }

  /**
   * 创建通知指令
   */
  createNotifyInstruction(config: NotificationConfig): UIInstruction {
    return {
      type: 'notify',
      target: 'notification-system',
      action: 'show',
      data: {
        type: config.type,
        title: config.title,
        message: config.message,
        duration: config.duration ?? 3000,
        actions: config.actions,
      },
      options: {
        priority: config.type === 'error' ? 'high' : 'normal',
        duration: config.duration ?? 3000,
      },
    };
  }

  /**
   * 创建弹窗指令
   */
  createDialogInstruction(config: DialogConfig): UIInstruction {
    return {
      type: 'dialog',
      target: 'dialog-system',
      action: 'show',
      data: {
        id: config.id,
        title: config.title,
        content: config.content,
        type: config.type,
        buttons: config.buttons,
        closable: config.closable ?? true,
        customData: config.data,
      },
      options: { priority: 'high' },
    };
  }

  /**
   * 创建自定义指令
   */
  createCustomInstruction(
    target: string,
    action: string,
    data: Record<string, unknown>,
    options?: UIInstruction['options']
  ): UIInstruction {
    return {
      type: 'custom',
      target,
      action,
      data,
      options: options ?? { priority: 'normal' },
    };
  }

  /**
   * 批量创建指令
   */
  createBatchInstructions(instructions: Array<{
    type: UIInstructionType;
    target: string;
    action: string;
    data: Record<string, unknown>;
    options?: UIInstruction['options'];
  }>): UIInstruction[] {
    return instructions.map(i => ({
      type: i.type,
      target: i.target,
      action: i.action,
      data: i.data,
      options: i.options ?? { priority: 'normal' },
    }));
  }

  /**
   * 关闭弹窗
   */
  closeDialog(dialogId: string): UIInstruction {
    this.activeDialogs.delete(dialogId);
    return {
      type: 'dialog',
      target: 'dialog-system',
      action: 'close',
      data: { id: dialogId },
      options: { priority: 'normal' },
    };
  }

  /**
   * 注册组件
   */
  registerComponent(config: UIComponentConfig): void {
    this.activeComponents.set(config.id, config);
  }

  /**
   * 注销组件
   */
  unregisterComponent(componentId: string): void {
    this.activeComponents.delete(componentId);
  }

  // ==================== 动态 UI 生成方法 ====================

  /**
   * 生成缓存键
   */
  private generateCacheKey(description: string, context?: Record<string, unknown>): string {
    const contextStr = context ? JSON.stringify(context) : '';
    // 使用简单的哈希函数
    let hash = 0;
    const str = description + contextStr;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `cache-${hash}`;
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.dynamicUICache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.dynamicUICache.delete(key);
      }
    }
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): DynamicUICacheEntry | undefined {
    const entry = this.dynamicUICache.get(key);
    if (entry && Date.now() - entry.timestamp <= this.CACHE_TTL) {
      return entry;
    }
    this.dynamicUICache.delete(key);
    return undefined;
  }

  /**
   * 存入缓存
   */
  private setToCache(key: string, markdown: string, context?: Record<string, unknown>): void {
    // 清理过期缓存
    if (this.dynamicUICache.size >= this.MAX_CACHE_SIZE) {
      this.cleanExpiredCache();
    }

    // 如果还是满了，删除最旧的
    if (this.dynamicUICache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.dynamicUICache.keys().next().value;
      if (oldestKey) {
        this.dynamicUICache.delete(oldestKey);
      }
    }

    this.dynamicUICache.set(key, {
      markdown,
      timestamp: Date.now(),
      context,
    });
  }

  /**
   * 生成动态 UI
   * 接收自然语言描述，生成 Markdown 格式的动态 UI
   */
  async generateDynamicUI(description: string, context?: Record<string, unknown>): Promise<DynamicUIData> {
    gameLog.debug('agent', 'Generating dynamic UI', {
      agentType: this.type,
      description: description.substring(0, 100),
      hasContext: !!context,
    });

    // 1. 检查缓存
    const cacheKey = this.generateCacheKey(description, context);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      gameLog.info('agent', 'UIAgent.generateDynamicUI: cache hit', {
        cacheKey,
        descriptionLength: description.length,
      });

      return {
        id: `dynamic-ui-${randomUUID()}`,
        markdown: cached.markdown,
        context,
      };
    }

    // 2. 构建动态 UI 生成提示词
    const messages: Message[] = [
      { role: 'system', content: DYNAMIC_UI_SYSTEM_PROMPT },
      { role: 'user', content: this.buildDynamicUIPrompt(description, context) },
    ];

    // 3. 调用 LLM 生成 Markdown
    const response = await this.callLLM(messages, { temperature: 0.7 });

    // 4. 解析返回的 Markdown
    const markdown = this.extractMarkdown(response.content);

    // 5. 存入缓存
    this.setToCache(cacheKey, markdown, context);

    gameLog.info('agent', 'Dynamic UI generated successfully', {
      agentType: this.type,
      markdownLength: markdown.length,
      cacheKey,
    });

    // 6. 返回 DynamicUIData
    return {
      id: `dynamic-ui-${randomUUID()}`,
      markdown,
      context,
    };
  }

  /**
   * 构建动态 UI 生成提示词
   */
  private buildDynamicUIPrompt(description: string, context?: Record<string, unknown>): string {
    let prompt = `请根据以下描述生成动态 UI：\n\n${description}`;

    if (context && Object.keys(context).length > 0) {
      prompt += '\n\n上下文信息：';
      for (const [key, value] of Object.entries(context)) {
        prompt += `\n- ${key}: ${JSON.stringify(value)}`;
      }
    }

    return prompt;
  }

  /**
   * 从 LLM 响应中提取 Markdown 内容
   */
  private extractMarkdown(content: string): string {
    // 如果内容被代码块包裹，提取内容
    const codeBlockMatch = content.match(/```(?:markdown)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 否则返回原始内容
    return content.trim();
  }

  /**
   * 处理生成动态 UI 请求
   */
  private async handleGenerateDynamicUI(data: Record<string, unknown>): Promise<AgentResponse> {
    try {
      const description = data.description as string;

      if (!description) {
        return {
          success: false,
          error: 'Description is required for dynamic UI generation',
        };
      }

      const context = data.context as Record<string, unknown> | undefined;

      gameLog.info('agent', 'Handling generate dynamic UI request', {
        agentType: this.type,
        description: description.substring(0, 100),
      });

      const dynamicUI = await this.generateDynamicUI(description, context);

      // 如果提供了 saveId 和 characterId，通过 UIDataTool 推送
      if (data.saveId && data.characterId) {
        gameLog.debug('agent', 'Pushing dynamic UI to game state', {
          agentType: this.type,
          saveId: data.saveId,
          characterId: data.characterId,
        });

        await this.callTool(
          ToolTypeEnum.UI_DATA,
          'updateGameState',
          {
            saveId: data.saveId,
            characterId: data.characterId,
            data: { dynamicUI },
          },
          'write'
        );
      }

      // 添加到记忆
      this.addMemory(
        `Generated dynamic UI: ${description.substring(0, 50)}...`,
        'assistant',
        5,
        { dynamicUIId: dynamicUI.id }
      );

      return {
        success: true,
        data: { dynamicUI },
      };
    } catch (error) {
      gameLog.error('agent', 'Failed to generate dynamic UI', {
        agentType: this.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate dynamic UI',
      };
    }
  }
}
