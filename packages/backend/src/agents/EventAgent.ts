import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  UIInstruction,
  AgentBinding,
  ToolType,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// ==================== 事件类型定义 ====================

/**
 * 事件类型
 */
type EventType = 'random' | 'scripted' | 'triggered' | 'timed' | 'chain';

/**
 * 触发条件类型
 */
type TriggerType = 'location' | 'item' | 'time' | 'quest' | 'flag' | 'random';

/**
 * 事件优先级
 */
type EventPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * 事件状态
 */
type EventStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';

/**
 * 触发条件
 */
interface EventTrigger {
  type: TriggerType;
  condition: string;
  value: unknown;
  probability?: number;
  cooldown?: number;
  lastTriggered?: number;
}

/**
 * 事件选项
 */
interface EventOption {
  id: string;
  text: string;
  requirements?: {
    type: 'item' | 'skill' | 'stat' | 'flag';
    key: string;
    value: unknown;
    comparison?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  }[];
  outcomes: EventOutcome[];
}

/**
 * 事件结果
 */
interface EventOutcome {
  type: 'reward' | 'penalty' | 'flag_set' | 'quest_start' | 'npc_spawn' | 'teleport' | 'custom';
  data: Record<string, unknown>;
  probability?: number;
}

/**
 * 事件定义
 */
interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  priority: EventPriority;
  status: EventStatus;
  triggers: EventTrigger[];
  options: EventOption[];
  context: {
    location?: string;
    npcs?: string[];
    minLevel?: number;
    maxLevel?: number;
    timeRange?: {
      start: number;
      end: number;
    };
  };
  metadata: {
    repeatable: boolean;
    maxOccurrences: number;
    currentOccurrences: number;
    chainId?: string;
    chainOrder?: number;
    createdAt: number;
    updatedAt: number;
  };
}

/**
 * 事件链定义
 */
interface EventChain {
  id: string;
  name: string;
  description: string;
  eventIds: string[];
  currentEventIndex: number;
  status: 'active' | 'completed' | 'abandoned';
  branchPoints?: {
    afterEventId: string;
    branches: {
      condition: string;
      nextEventIds: string[];
    }[];
  }[];
}

/**
 * 事件生成参数
 */
interface EventGenerationParams {
  type: EventType;
  context: {
    location?: string;
    playerLevel?: number;
    currentTime?: number;
    recentEvents?: string[];
    storyFlags?: Record<string, unknown>;
  };
  priority?: EventPriority;
  difficulty?: 'easy' | 'normal' | 'hard';
}

/**
 * 触发检查结果
 */
interface TriggerCheckResult {
  triggered: boolean;
  eventId: string;
  triggerType: TriggerType;
  matchedConditions: string[];
}

/**
 * 事件执行结果
 */
interface EventExecutionResult {
  event: GameEvent;
  selectedOption?: EventOption;
  outcomes: EventOutcome[];
  chainAdvanced?: boolean;
  nextEvent?: GameEvent;
}

/**
 * 事件过滤器
 */
interface EventFilter {
  type?: EventType;
  status?: EventStatus;
  priority?: EventPriority;
  location?: string;
  limit?: number;
}

/**
 * 事件统计数据
 */
interface EventStatistics {
  total: number;
  byType: Record<EventType, number>;
  byStatus: Record<EventStatus, number>;
  byPriority: Record<EventPriority, number>;
  triggeredCount: number;
  completedCount: number;
}

/**
 * 事件管理智能体
 * 负责随机事件生成、触发条件检查、事件链管理、事件结果处理
 */
export class EventAgent extends AgentBase {
  readonly type: AgentType = AT.EVENT;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.EVENT_DATA,
    ToolTypeEnum.MAP_DATA,
    ToolTypeEnum.INVENTORY_DATA,
    ToolTypeEnum.NUMERICAL,
    ToolTypeEnum.NPC_DATA,
    ToolTypeEnum.QUEST_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.STORY_CONTEXT, enabled: true },
    { agentType: AT.QUEST, enabled: true },
    { agentType: AT.NPC_PARTY, enabled: true },
    { agentType: AT.MAP, enabled: true },
  ];

  readonly systemPrompt = `你是事件管理智能体，负责管理游戏中的所有事件系统。

核心职责：
1. 事件生成：根据游戏状态、玩家位置、故事进度生成合适的事件
2. 触发检查：实时检查事件触发条件是否满足
3. 事件链管理：管理链式事件的顺序推进和分支选择
4. 结果处理：处理事件选项的结果，分发奖励或惩罚

事件类型：
- random: 随机事件，基于概率触发
- scripted: 脚本事件，按剧情预设触发
- triggered: 条件事件，满足特定条件触发
- timed: 定时事件，在特定时间触发
- chain: 链式事件，按顺序触发的事件序列

触发条件类型：
- location: 玩家进入特定地点
- item: 玩家拥有或使用特定物品
- time: 游戏时间达到特定值
- quest: 任务状态变化
- flag: 故事标志位设置
- random: 纯随机触发

事件优先级：
- low: 低优先级，背景事件
- normal: 普通优先级，一般事件
- high: 高优先级，重要事件
- critical: 关键优先级，必须处理的事件

工作原则：
- 确保事件的合理性和趣味性
- 事件触发应与游戏节奏匹配
- 维护事件链的连贯性
- 及时处理事件结果`;

  // 事件存储
  private events: Map<string, GameEvent> = new Map();

  // 事件链存储
  private eventChains: Map<string, EventChain> = new Map();

  // 活跃事件
  private activeEvents: Set<string> = new Set();

  // 已触发事件历史
  private triggeredHistory: string[] = [];

  // 事件ID计数器
  private eventIdCounter: number = 0;
  private chainIdCounter: number = 0;

  // 随机事件检查间隔
  private randomCheckInterval: ReturnType<typeof setInterval> | null = null;
  private randomCheckIntervalMs: number = 30000; // 30秒检查一次

  constructor() {
    super({
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  protected getAgentName(): string {
    return 'Event Agent';
  }

  protected getAgentDescription(): string {
    return '事件管理智能体，负责随机事件、触发条件、事件链管理';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'event_generation',
      'condition_checking',
      'event_chain',
      'random_events',
      'trigger_management',
      'outcome_processing',
    ];
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    await super.initialize();
    this.startRandomEventCheck();
  }

  /**
   * 启动
   */
  async start(): Promise<void> {
    await super.start();
    this.startRandomEventCheck();
  }

  /**
   * 停止
   */
  async stop(): Promise<void> {
    await super.stop();
    if (this.randomCheckInterval) {
      clearInterval(this.randomCheckInterval);
      this.randomCheckInterval = null;
    }
  }

  /**
   * 处理消息主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        case 'generate_event':
          return this.handleGenerateEvent(data);
        case 'generate_event_chain':
          return this.handleGenerateEventChain(data);
        case 'check_triggers':
          return this.handleCheckTriggers(data);
        case 'execute_event':
          return this.handleExecuteEvent(data);
        case 'select_option':
          return this.handleSelectOption(data);
        case 'complete_event':
          return this.handleCompleteEvent(data);
        case 'cancel_event':
          return this.handleCancelEvent(data);
        case 'get_event':
          return this.handleGetEvent(data);
        case 'get_active_events':
          return this.handleGetActiveEvents(data);
        case 'get_available_events':
          return this.handleGetAvailableEvents(data);
        case 'get_event_chain':
          return this.handleGetEventChain(data);
        case 'force_trigger':
          return this.handleForceTrigger(data);
        case 'get_statistics':
          return this.handleGetStatistics();
        case 'update_story_flags':
          return this.handleUpdateStoryFlags(data);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in EventAgent',
      };
    }
  }

  // ==================== 事件生成 ====================

  /**
   * 生成单个事件
   */
  private handleGenerateEvent(data: Record<string, unknown>): AgentResponse {
    const params = data as unknown as EventGenerationParams;

    if (!params.type) {
      return {
        success: false,
        error: 'Missing required field: type',
      };
    }

    const event = this.createEvent(params);
    this.events.set(event.id, event);

    this.addMemory(
      `Generated ${event.type} event: ${event.name}`,
      'assistant',
      6,
      { eventId: event.id, type: event.type }
    );

    return {
      success: true,
      data: { event },
    };
  }

  /**
   * 生成事件链
   */
  private handleGenerateEventChain(data: Record<string, unknown>): AgentResponse {
    const chainData = data as {
      name: string;
      description: string;
      eventCount: number;
      baseType: EventType;
      context: EventGenerationParams['context'];
      branchPoints?: EventChain['branchPoints'];
    };

    if (!chainData.name || !chainData.eventCount) {
      return {
        success: false,
        error: 'Missing required fields: name, eventCount',
      };
    }

    const chain = this.createEventChain(chainData);
    this.eventChains.set(chain.id, chain);

    this.addMemory(
      `Generated event chain: ${chain.name} with ${chain.eventIds.length} events`,
      'assistant',
      8,
      { chainId: chain.id, eventCount: chain.eventIds.length }
    );

    return {
      success: true,
      data: {
        chain,
        events: chain.eventIds.map(id => this.events.get(id)).filter((e): e is GameEvent => e !== undefined),
      },
    };
  }

  /**
   * 创建事件
   */
  private createEvent(params: EventGenerationParams): GameEvent {
    const id = this.generateEventId();
    const priority = params.priority || 'normal';
    const difficulty = params.difficulty || 'normal';

    const triggers = this.generateTriggers(params.type, params.context);
    const options = this.generateOptions(params.type, difficulty, params.context, priority);

    const event: GameEvent = {
      id,
      name: this.generateEventName(params.type, params.context),
      description: this.generateEventDescription(params.type, params.context),
      type: params.type,
      priority,
      status: 'pending',
      triggers,
      options,
      context: {
        location: params.context.location,
        minLevel: params.context.playerLevel ? Math.max(1, params.context.playerLevel - 5) : undefined,
        maxLevel: params.context.playerLevel ? params.context.playerLevel + 5 : undefined,
      },
      metadata: {
        repeatable: params.type === 'random',
        maxOccurrences: params.type === 'random' ? 999 : 1,
        currentOccurrences: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    return event;
  }

  /**
   * 创建事件链
   */
  private createEventChain(data: {
    name: string;
    description: string;
    eventCount: number;
    baseType: EventType;
    context: EventGenerationParams['context'];
    branchPoints?: EventChain['branchPoints'];
  }): EventChain {
    const chainId = this.generateChainId();
    const eventIds: string[] = [];

    // 生成链中的事件
    for (let i = 0; i < data.eventCount; i++) {
      const eventParams: EventGenerationParams = {
        type: data.baseType,
        context: data.context,
        priority: this.getChainPriority(i, data.eventCount),
        difficulty: this.getChainDifficulty(i, data.eventCount),
      };

      const event = this.createEvent(eventParams);
      event.name = `${data.name} - 第${i + 1}部分`;
      event.description = `${data.description} (${i + 1}/${data.eventCount})`;
      event.metadata.chainId = chainId;
      event.metadata.chainOrder = i;

      // 后续事件设置触发条件
      if (i > 0) {
        event.triggers = [
          {
            type: 'flag',
            condition: 'chain_progress',
            value: { chainId, completedIndex: i - 1 },
          },
        ];
      }

      this.events.set(event.id, event);
      eventIds.push(event.id);
    }

    return {
      id: chainId,
      name: data.name,
      description: data.description,
      eventIds,
      currentEventIndex: 0,
      status: 'active',
      branchPoints: data.branchPoints,
    };
  }

  /**
   * 生成触发条件
   */
  private generateTriggers(type: EventType, context: EventGenerationParams['context']): EventTrigger[] {
    const triggers: EventTrigger[] = [];

    switch (type) {
      case 'random':
        triggers.push({
          type: 'random',
          condition: 'probability_check',
          value: Math.random() * 0.3, // 0-30% 概率
          probability: 0.1,
          cooldown: 60000, // 1分钟冷却
        });
        break;

      case 'triggered':
        if (context.location) {
          triggers.push({
            type: 'location',
            condition: 'enter_location',
            value: context.location,
          });
        }
        break;

      case 'timed':
        triggers.push({
          type: 'time',
          condition: 'time_reached',
          value: context.currentTime || Date.now() + 3600000, // 默认1小时后
        });
        break;

      case 'scripted':
        triggers.push({
          type: 'flag',
          condition: 'story_flag_set',
          value: { flag: 'scripted_event_trigger', expectedValue: true },
        });
        break;

      case 'chain':
        triggers.push({
          type: 'flag',
          condition: 'chain_trigger',
          value: { chainEvent: true },
        });
        break;
    }

    return triggers;
  }

  /**
   * 生成事件选项
   */
  private generateOptions(
    _type: EventType,
    difficulty: string,
    context: EventGenerationParams['context'],
    priority: EventPriority = 'normal'
  ): EventOption[] {
    const options: EventOption[] = [];

    // 选项1: 接受/正面回应
    options.push({
      id: `opt_${Date.now()}_1`,
      text: '接受挑战',
      outcomes: this.generateOutcomes('reward', difficulty, context),
    });

    // 选项2: 拒绝/负面回应
    options.push({
      id: `opt_${Date.now()}_2`,
      text: '拒绝',
      outcomes: this.generateOutcomes('penalty', difficulty, context),
    });

    // 选项3: 中立/观望（可选）- 关键优先级事件不能观望
    if (priority !== 'critical') {
      options.push({
        id: `opt_${Date.now()}_3`,
        text: '观望',
        outcomes: this.generateOutcomes('neutral', difficulty, context),
      });
    }

    return options;
  }

  /**
   * 生成事件结果
   */
  private generateOutcomes(
    type: string,
    difficulty: string,
    _context: EventGenerationParams['context']
  ): EventOutcome[] {
    const outcomes: EventOutcome[] = [];
    const multiplier = this.getDifficultyMultiplier(difficulty);

    switch (type) {
      case 'reward':
        outcomes.push({
          type: 'reward',
          data: {
            experience: Math.floor(100 * multiplier),
            currency: Math.floor(50 * multiplier),
          },
        });
        if (Math.random() > 0.5) {
          outcomes.push({
            type: 'reward',
            data: {
              item: 'event_reward_item',
              quantity: 1,
            },
          });
        }
        break;

      case 'penalty':
        outcomes.push({
          type: 'penalty',
          data: {
            currency: Math.floor(-20 * multiplier),
          },
        });
        break;

      case 'neutral':
        outcomes.push({
          type: 'flag_set',
          data: {
            flag: 'event_neutral_choice',
            value: true,
          },
        });
        break;
    }

    return outcomes;
  }

  // ==================== 触发检查 ====================

  /**
   * 检查触发条件
   */
  private handleCheckTriggers(data: Record<string, unknown>): AgentResponse {
    const checkData = data as {
      playerId?: string;
      location?: string;
      items?: string[];
      time?: number;
      flags?: Record<string, unknown>;
    };

    const triggeredEvents: TriggerCheckResult[] = [];

    for (const event of this.events.values()) {
      if (event.status !== 'pending') continue;
      if (!event.metadata.repeatable && event.metadata.currentOccurrences > 0) continue;

      const triggerResult = this.checkEventTriggers(event, checkData);
      if (triggerResult.triggered) {
        triggeredEvents.push(triggerResult);
      }
    }

    // 按优先级排序
    triggeredEvents.sort((a, b) => {
      const eventA = this.events.get(a.eventId);
      const eventB = this.events.get(b.eventId);
      if (!eventA || !eventB) return 0;
      return this.getPriorityWeight(eventB.priority) - this.getPriorityWeight(eventA.priority);
    });

    return {
      success: true,
      data: { triggeredEvents, count: triggeredEvents.length },
    };
  }

  /**
   * 检查事件触发条件
   */
  private checkEventTriggers(event: GameEvent, context: Record<string, unknown>): TriggerCheckResult {
    const matchedConditions: string[] = [];

    for (const trigger of event.triggers) {
      const result = this.evaluateTrigger(trigger, context);
      if (result.matched) {
        matchedConditions.push(result.condition);
      }
    }

    // 所有触发条件都需要满足
    const triggered = matchedConditions.length === event.triggers.length;

    return {
      triggered,
      eventId: event.id,
      triggerType: event.triggers[0]?.type || 'random',
      matchedConditions,
    };
  }

  /**
   * 评估单个触发条件
   */
  private evaluateTrigger(trigger: EventTrigger, context: Record<string, unknown>): { matched: boolean; condition: string } {
    switch (trigger.type) {
      case 'location':
        return {
          matched: context.location === trigger.value,
          condition: `location:${trigger.value}`,
        };

      case 'item':
        const items = context.items as string[] | undefined;
        return {
          matched: items?.includes(trigger.value as string) || false,
          condition: `item:${trigger.value}`,
        };

      case 'time':
        const currentTime = context.time as number | undefined;
        return {
          matched: currentTime !== undefined && currentTime >= (trigger.value as number),
          condition: `time:${trigger.value}`,
        };

      case 'flag':
        const flags = context.flags as Record<string, unknown> | undefined;
        const flagData = trigger.value as { flag: string; expectedValue: unknown };
        return {
          matched: flags?.[flagData.flag] === flagData.expectedValue,
          condition: `flag:${flagData.flag}`,
        };

      case 'random':
        // 检查冷却时间
        if (trigger.lastTriggered && trigger.cooldown) {
          if (Date.now() - trigger.lastTriggered < trigger.cooldown) {
            return { matched: false, condition: 'random:cooldown' };
          }
        }
        return {
          matched: Math.random() < (trigger.probability || 0.1),
          condition: 'random:probability',
        };

      case 'quest':
        return {
          matched: true, // 需要从quest agent获取状态
          condition: `quest:${trigger.value}`,
        };

      default:
        return { matched: false, condition: 'unknown' };
    }
  }

  // ==================== 事件执行 ====================

  /**
   * 执行事件
   */
  private handleExecuteEvent(data: Record<string, unknown>): AgentResponse {
    const executeData = data as { eventId: string };

    if (!executeData.eventId) {
      return {
        success: false,
        error: 'Missing required field: eventId',
      };
    }

    const event = this.events.get(executeData.eventId);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${executeData.eventId}`,
      };
    }

    if (event.status !== 'pending') {
      return {
        success: false,
        error: `Event is not pending. Current status: ${event.status}`,
      };
    }

    // 更新事件状态
    event.status = 'active';
    event.metadata.currentOccurrences++;
    event.metadata.updatedAt = Date.now();
    this.activeEvents.add(event.id);
    this.triggeredHistory.push(event.id);

    this.addMemory(
      `Event triggered: ${event.name}`,
      'assistant',
      7,
      { eventId: event.id, type: event.type }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'event_panel',
        action: 'display_event',
        data: { event },
        options: { priority: event.priority },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'event_triggered',
        data: { message: `事件触发: ${event.name}` },
        options: { duration: 3000, priority: event.priority },
      },
    ];

    return {
      success: true,
      data: { event },
      uiInstructions,
    };
  }

  /**
   * 选择事件选项
   */
  private handleSelectOption(data: Record<string, unknown>): AgentResponse {
    const selectData = data as {
      eventId: string;
      optionId: string;
    };

    if (!selectData.eventId || !selectData.optionId) {
      return {
        success: false,
        error: 'Missing required fields: eventId, optionId',
      };
    }

    const event = this.events.get(selectData.eventId);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${selectData.eventId}`,
      };
    }

    if (event.status !== 'active') {
      return {
        success: false,
        error: `Event is not active. Current status: ${event.status}`,
      };
    }

    const option = event.options.find(o => o.id === selectData.optionId);
    if (!option) {
      return {
        success: false,
        error: `Option not found: ${selectData.optionId}`,
      };
    }

    // 处理选项结果
    const outcomes = this.processOutcomes(option.outcomes);

    // 检查事件链推进
    let chainAdvanced = false;
    let nextEvent: GameEvent | undefined;

    if (event.metadata.chainId) {
      const chainResult = this.advanceEventChain(event.metadata.chainId, event.id);
      if (chainResult) {
        chainAdvanced = true;
        nextEvent = chainResult;
      }
    }

    this.addMemory(
      `Event option selected: ${event.name} - ${option.text}`,
      'assistant',
      6,
      { eventId: event.id, optionId: option.id, outcomes }
    );

    const uiInstructions: UIInstruction[] = this.generateOutcomeUIInstructions(outcomes);

    const result: EventExecutionResult = {
      event,
      selectedOption: option,
      outcomes,
      chainAdvanced,
      nextEvent,
    };

    return {
      success: true,
      data: result,
      uiInstructions,
    };
  }

  /**
   * 完成事件
   */
  private handleCompleteEvent(data: Record<string, unknown>): AgentResponse {
    const completeData = data as { eventId: string };

    if (!completeData.eventId) {
      return {
        success: false,
        error: 'Missing required field: eventId',
      };
    }

    const event = this.events.get(completeData.eventId);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${completeData.eventId}`,
      };
    }

    const previousStatus = event.status;
    event.status = 'completed';
    event.metadata.updatedAt = Date.now();
    this.activeEvents.delete(event.id);

    this.addMemory(
      `Event completed: ${event.name}`,
      'assistant',
      5,
      { eventId: event.id, type: event.type }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'event_panel',
        action: 'complete_event',
        data: { eventId: event.id },
        options: { priority: 'normal' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'event_completed',
        data: { message: `事件完成: ${event.name}` },
        options: { duration: 2000 },
      },
    ];

    return {
      success: true,
      data: { event, previousStatus },
      uiInstructions,
    };
  }

  /**
   * 取消事件
   */
  private handleCancelEvent(data: Record<string, unknown>): AgentResponse {
    const cancelData = data as { eventId: string; reason?: string };

    if (!cancelData.eventId) {
      return {
        success: false,
        error: 'Missing required field: eventId',
      };
    }

    const event = this.events.get(cancelData.eventId);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${cancelData.eventId}`,
      };
    }

    const previousStatus = event.status;
    event.status = 'cancelled';
    event.metadata.updatedAt = Date.now();
    this.activeEvents.delete(event.id);

    this.addMemory(
      `Event cancelled: ${event.name}. Reason: ${cancelData.reason || 'Unknown'}`,
      'assistant',
      4,
      { eventId: event.id, reason: cancelData.reason }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'event_panel',
        action: 'cancel_event',
        data: { eventId: event.id, reason: cancelData.reason },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: { event, previousStatus },
      uiInstructions,
    };
  }

  // ==================== 查询操作 ====================

  /**
   * 获取单个事件
   */
  private handleGetEvent(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { eventId: string };

    if (!queryData.eventId) {
      return {
        success: false,
        error: 'Missing required field: eventId',
      };
    }

    const event = this.events.get(queryData.eventId);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${queryData.eventId}`,
      };
    }

    return {
      success: true,
      data: { event },
    };
  }

  /**
   * 获取活跃事件
   */
  private handleGetActiveEvents(data: Record<string, unknown>): AgentResponse {
    const filterData = data as EventFilter;

    let events = Array.from(this.activeEvents)
      .map(id => this.events.get(id))
      .filter((e): e is GameEvent => e !== undefined);

    if (filterData.type) {
      events = events.filter(e => e.type === filterData.type);
    }

    if (filterData.priority) {
      events = events.filter(e => e.priority === filterData.priority);
    }

    if (filterData.limit) {
      events = events.slice(0, filterData.limit);
    }

    return {
      success: true,
      data: { events, count: events.length },
    };
  }

  /**
   * 获取可用事件
   */
  private handleGetAvailableEvents(data: Record<string, unknown>): AgentResponse {
    const filterData = data as EventFilter;

    let events = Array.from(this.events.values())
      .filter(e => e.status === 'pending');

    if (filterData.type) {
      events = events.filter(e => e.type === filterData.type);
    }

    if (filterData.location) {
      events = events.filter(e => e.context.location === filterData.location);
    }

    if (filterData.limit) {
      events = events.slice(0, filterData.limit);
    }

    return {
      success: true,
      data: { events, count: events.length },
    };
  }

  /**
   * 获取事件链
   */
  private handleGetEventChain(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { chainId: string };

    if (!queryData.chainId) {
      return {
        success: false,
        error: 'Missing required field: chainId',
      };
    }

    const chain = this.eventChains.get(queryData.chainId);
    if (!chain) {
      return {
        success: false,
        error: `Event chain not found: ${queryData.chainId}`,
      };
    }

    const events = chain.eventIds
      .map(id => this.events.get(id))
      .filter((e): e is GameEvent => e !== undefined);

    return {
      success: true,
      data: { chain, events },
    };
  }

  /**
   * 强制触发事件
   */
  private handleForceTrigger(data: Record<string, unknown>): AgentResponse {
    const triggerData = data as { eventId: string };

    if (!triggerData.eventId) {
      return {
        success: false,
        error: 'Missing required field: eventId',
      };
    }

    const event = this.events.get(triggerData.eventId);
    if (!event) {
      return {
        success: false,
        error: `Event not found: ${triggerData.eventId}`,
      };
    }

    // 强制触发，忽略条件检查
    event.status = 'active';
    event.metadata.currentOccurrences++;
    event.metadata.updatedAt = Date.now();
    this.activeEvents.add(event.id);
    this.triggeredHistory.push(event.id);

    this.addMemory(
      `Event force triggered: ${event.name}`,
      'assistant',
      7,
      { eventId: event.id, forced: true }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'event_panel',
        action: 'display_event',
        data: { event },
        options: { priority: event.priority },
      },
    ];

    return {
      success: true,
      data: { event },
      uiInstructions,
    };
  }

  /**
   * 获取统计数据
   */
  private handleGetStatistics(): AgentResponse {
    const stats: EventStatistics = {
      total: this.events.size,
      byType: {
        random: 0,
        scripted: 0,
        triggered: 0,
        timed: 0,
        chain: 0,
      },
      byStatus: {
        pending: 0,
        active: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      },
      byPriority: {
        low: 0,
        normal: 0,
        high: 0,
        critical: 0,
      },
      triggeredCount: this.triggeredHistory.length,
      completedCount: 0,
    };

    for (const event of this.events.values()) {
      stats.byType[event.type]++;
      stats.byStatus[event.status]++;
      stats.byPriority[event.priority]++;

      if (event.status === 'completed') {
        stats.completedCount++;
      }
    }

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 更新故事标志
   */
  private handleUpdateStoryFlags(data: Record<string, unknown>): AgentResponse {
    const flagData = data as {
      flags: Record<string, unknown>;
    };

    if (!flagData.flags) {
      return {
        success: false,
        error: 'Missing required field: flags',
      };
    }

    // 检查是否有事件需要这些标志触发
    const potentiallyTriggered: string[] = [];

    for (const event of this.events.values()) {
      if (event.status !== 'pending') continue;

      for (const trigger of event.triggers) {
        if (trigger.type === 'flag') {
          const flagValue = trigger.value as { flag: string; expectedValue: unknown };
          if (flagData.flags[flagValue.flag] === flagValue.expectedValue) {
            potentiallyTriggered.push(event.id);
            break;
          }
        }
      }
    }

    this.addMemory(
      `Story flags updated, ${potentiallyTriggered.length} events may be triggered`,
      'assistant',
      5,
      { flags: flagData.flags, potentialEvents: potentiallyTriggered }
    );

    return {
      success: true,
      data: { potentiallyTriggered },
    };
  }

  // ==================== 随机事件检查 ====================

  /**
   * 启动随机事件检查
   */
  private startRandomEventCheck(): void {
    if (this.randomCheckInterval) {
      clearInterval(this.randomCheckInterval);
    }

    this.randomCheckInterval = setInterval(() => {
      this.checkRandomEvents();
    }, this.randomCheckIntervalMs);
  }

  /**
   * 检查随机事件
   */
  private checkRandomEvents(): void {
    const randomEvents = Array.from(this.events.values())
      .filter(e => e.type === 'random' && e.status === 'pending');

    for (const event of randomEvents) {
      for (const trigger of event.triggers) {
        if (trigger.type === 'random') {
          // 检查冷却
          if (trigger.lastTriggered && trigger.cooldown) {
            if (Date.now() - trigger.lastTriggered < trigger.cooldown) {
              continue;
            }
          }

          // 概率检查
          if (Math.random() < (trigger.probability || 0.1)) {
            trigger.lastTriggered = Date.now();
            // 可以在这里发送消息给协调器，通知有随机事件触发
            console.log(`[EventAgent] Random event triggered: ${event.name}`);
          }
        }
      }
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 处理事件结果
   */
  private processOutcomes(outcomes: EventOutcome[]): EventOutcome[] {
    const processed: EventOutcome[] = [];

    for (const outcome of outcomes) {
      // 检查概率
      if (outcome.probability !== undefined && Math.random() > outcome.probability) {
        continue;
      }
      processed.push(outcome);
    }

    return processed;
  }

  /**
   * 生成结果UI指令
   */
  private generateOutcomeUIInstructions(outcomes: EventOutcome[]): UIInstruction[] {
    const instructions: UIInstruction[] = [];

    for (const outcome of outcomes) {
      switch (outcome.type) {
        case 'reward':
          const rewardData = outcome.data;
          if (rewardData.experience) {
            instructions.push({
              type: 'update',
              target: 'player_stats',
              action: 'add_experience',
              data: { amount: rewardData.experience },
              options: { priority: 'normal' },
            });
          }
          if (rewardData.currency) {
            instructions.push({
              type: 'update',
              target: 'player_stats',
              action: 'add_currency',
              data: { amount: rewardData.currency },
              options: { priority: 'normal' },
            });
          }
          if (rewardData.item) {
            instructions.push({
              type: 'update',
              target: 'inventory',
              action: 'add_item',
              data: { itemId: rewardData.item, quantity: rewardData.quantity || 1 },
              options: { priority: 'normal' },
            });
          }
          break;

        case 'penalty':
          const penaltyData = outcome.data;
          if (penaltyData.currency) {
            instructions.push({
              type: 'update',
              target: 'player_stats',
              action: 'add_currency',
              data: { amount: penaltyData.currency },
              options: { priority: 'normal' },
            });
          }
          break;

        case 'flag_set':
          instructions.push({
            type: 'update',
            target: 'story_flags',
            action: 'set_flag',
            data: outcome.data,
            options: { priority: 'low' },
          });
          break;

        case 'quest_start':
          instructions.push({
            type: 'custom',
            target: 'quest_system',
            action: 'start_quest',
            data: outcome.data,
            options: { priority: 'high' },
          });
          break;

        case 'npc_spawn':
          instructions.push({
            type: 'custom',
            target: 'npc_system',
            action: 'spawn_npc',
            data: outcome.data,
            options: { priority: 'normal' },
          });
          break;

        case 'teleport':
          instructions.push({
            type: 'custom',
            target: 'map_system',
            action: 'teleport_player',
            data: outcome.data,
            options: { priority: 'high' },
          });
          break;

        case 'custom':
          instructions.push({
            type: 'custom',
            target: 'game_system',
            action: 'custom_action',
            data: outcome.data,
            options: { priority: 'normal' },
          });
          break;
      }
    }

    return instructions;
  }

  /**
   * 推进事件链
   */
  private advanceEventChain(chainId: string, completedEventId: string): GameEvent | null {
    const chain = this.eventChains.get(chainId);
    if (!chain) return null;

    const eventIndex = chain.eventIds.indexOf(completedEventId);

    if (eventIndex !== -1 && eventIndex === chain.currentEventIndex) {
      // 检查分支点
      if (chain.branchPoints) {
        for (const branchPoint of chain.branchPoints) {
          if (branchPoint.afterEventId === completedEventId) {
            // 这里需要根据条件选择分支
            // 简化处理：选择第一个分支
            if (branchPoint.branches.length > 0) {
              const nextEventId = branchPoint.branches[0].nextEventIds[0];
              const nextEvent = this.events.get(nextEventId);
              if (nextEvent) {
                chain.currentEventIndex = chain.eventIds.indexOf(nextEventId);
                return nextEvent;
              }
            }
          }
        }
      }

      // 普通推进
      if (eventIndex < chain.eventIds.length - 1) {
        chain.currentEventIndex++;

        const nextEventId = chain.eventIds[chain.currentEventIndex];
        const nextEvent = this.events.get(nextEventId);

        if (nextEvent) {
          nextEvent.status = 'pending';
          return nextEvent;
        }
      } else {
        // 事件链完成
        chain.status = 'completed';
        this.addMemory(
          `Event chain completed: ${chain.name}`,
          'assistant',
          9,
          { chainId: chain.id }
        );
      }
    }

    return null;
  }

  /**
   * 生成事件名称
   */
  private generateEventName(type: EventType, context: EventGenerationParams['context']): string {
    const prefixes: Record<EventType, string[]> = {
      random: ['意外遭遇', '突发状况', '随机事件'],
      scripted: ['剧情事件', '故事发展', '命运转折'],
      triggered: ['条件触发', '特殊事件', '隐藏剧情'],
      timed: ['定时事件', '周期活动', '限时挑战'],
      chain: ['连锁事件', '系列剧情', '连续挑战'],
    };

    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
    const location = context.location || '未知之地';

    return `${prefix}: ${location}`;
  }

  /**
   * 生成事件描述
   */
  private generateEventDescription(type: EventType, context: EventGenerationParams['context']): string {
    const descriptions: Record<EventType, string> = {
      random: `在${context.location || '这片区域'}发生了一个意外事件，你需要做出选择。`,
      scripted: `故事发展到了关键时刻，你的选择将影响后续剧情。`,
      triggered: `特定条件已满足，触发了隐藏事件。`,
      timed: `时间已到，限时事件开始。`,
      chain: `这是连锁事件的一部分，你的选择将影响后续发展。`,
    };

    return descriptions[type];
  }

  /**
   * 获取优先级权重
   */
  private getPriorityWeight(priority: EventPriority): number {
    const weights: Record<EventPriority, number> = {
      low: 1,
      normal: 2,
      high: 3,
      critical: 4,
    };
    return weights[priority];
  }

  /**
   * 获取难度乘数
   */
  private getDifficultyMultiplier(difficulty: string): number {
    const multipliers: Record<string, number> = {
      easy: 0.8,
      normal: 1,
      hard: 1.5,
    };
    return multipliers[difficulty] || 1;
  }

  /**
   * 获取链式事件优先级
   */
  private getChainPriority(index: number, total: number): EventPriority {
    const progress = index / total;

    if (progress < 0.25) return 'low';
    if (progress < 0.5) return 'normal';
    if (progress < 0.75) return 'high';
    return 'critical';
  }

  /**
   * 获取链式事件难度
   */
  private getChainDifficulty(index: number, total: number): 'easy' | 'normal' | 'hard' {
    const progress = index / total;

    if (progress < 0.33) return 'easy';
    if (progress < 0.66) return 'normal';
    return 'hard';
  }

  /**
   * 生成事件ID
   */
  private generateEventId(): string {
    this.eventIdCounter++;
    return `event_${Date.now()}_${this.eventIdCounter}`;
  }

  /**
   * 生成事件链ID
   */
  private generateChainId(): string {
    this.chainIdCounter++;
    return `event_chain_${Date.now()}_${this.chainIdCounter}`;
  }
}

export default EventAgent;
