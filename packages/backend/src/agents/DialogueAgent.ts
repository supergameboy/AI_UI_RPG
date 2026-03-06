import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Message,
  UIInstruction,
  AgentBinding,
  ToolType,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// ==================== 对话类型定义 ====================

/**
 * 对话类型
 */
export type DialogueType = 'normal' | 'quest' | 'trade' | 'combat' | 'romantic';

/**
 * 对话情绪
 */
export type DialogueEmotion = 'neutral' | 'happy' | 'angry' | 'sad' | 'surprised' | 'fearful';

/**
 * 对话选项类型
 */
export type DialogueOptionType = 'continue' | 'accept' | 'reject' | 'inquire' | 'leave';

/**
 * 对话选项
 */
export interface DialogueOption {
  id: string;
  text: string;
  type: DialogueOptionType;
  requiresAffection?: number;
  requiresCondition?: string;
  leadsTo?: string;
  effects?: DialogueEffect[];
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * 对话效果
 */
export interface DialogueEffect {
  type: 'affection' | 'quest' | 'item' | 'skill' | 'flag' | 'custom';
  target?: string;
  value: number | string | boolean;
}

/**
 * 对话消息
 */
export interface DialogueMessage {
  id: string;
  speakerId: string;
  speakerName: string;
  content: string;
  emotion: DialogueEmotion;
  timestamp: number;
  isPlayer: boolean;
  metadata?: {
    affectionChange?: number;
    questUpdate?: string;
    flagsTriggered?: string[];
    selectedOption?: DialogueOptionType;
  };
}

/**
 * 对话上下文
 */
export interface DialogueContext {
  dialogueId: string;
  npcId: string;
  npcName: string;
  type: DialogueType;
  startedAt: number;
  location?: string;
  relatedQuestId?: string;
  relatedItemId?: string;
  playerState?: {
    level?: number;
    class?: string;
    currentQuests?: string[];
    inventory?: string[];
  };
  npcState?: {
    affection?: number;
    relationType?: string;
    mood?: DialogueEmotion;
    personality?: string;
    dialogueStyle?: string;
    traits?: string[];
  };
  storyContext?: {
    recentEvents?: string[];
    currentChapter?: string;
    flags?: Record<string, boolean>;
  };
}

/**
 * 对话会话
 */
export interface DialogueSession {
  id: string;
  context: DialogueContext;
  history: DialogueMessage[];
  currentOptions: DialogueOption[];
  status: 'active' | 'paused' | 'ended';
  turnCount: number;
  lastActivity: number;
}

/**
 * 对话生成参数
 */
export interface DialogueGenerationParams {
  npcId: string;
  type?: DialogueType;
  topic?: string;
  playerInput?: string;
  context?: Partial<DialogueContext>;
}

/**
 * 对话选项生成参数
 */
export interface DialogueOptionParams {
  dialogueId: string;
  npcId: string;
  currentContext: string;
  availableTypes?: DialogueOptionType[];
}

/**
 * 对话历史查询参数
 */
export interface DialogueHistoryQuery {
  dialogueId?: string;
  npcId?: string;
  type?: DialogueType;
  limit?: number;
  offset?: number;
}

/**
 * 对话状态
 */
export interface DialogueAgentState {
  sessions: Map<string, DialogueSession>;
  npcDialogueHistory: Map<string, DialogueMessage[]>;
  activeDialoguePerNpc: Map<string, string>;
}

// ==================== Dialogue Agent 实现 ====================

/**
 * 对话管理智能体
 * 负责对话生成、对话选项、对话历史管理、对话上下文感知
 */
export class DialogueAgent extends AgentBase {
  readonly type: AgentType = AT.DIALOGUE;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.DIALOGUE_DATA,
    ToolTypeEnum.NPC_DATA,
    ToolTypeEnum.QUEST_DATA,
    ToolTypeEnum.STORY_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.STORY_CONTEXT, enabled: true },
    { agentType: AT.NPC_PARTY, enabled: true },
    { agentType: AT.QUEST, enabled: true },
  ];

  readonly systemPrompt = `你是对话管理智能体，负责管理游戏中的所有对话系统。

核心职责：
1. 对话生成：根据NPC性格、关系、情境生成自然流畅的对话内容
2. 对话选项生成：根据对话上下文生成合适的玩家选项
3. 对话历史管理：维护对话记录，支持上下文感知
4. 对话上下文感知：整合故事背景、任务状态、NPC关系等信息

对话类型：
- normal: 普通对话，日常交流
- quest: 任务对话，涉及任务发布、进度、完成
- trade: 交易对话，买卖物品
- combat: 战斗对话，战斗中的喊话和互动
- romantic: 浪漫对话，恋爱相关的特殊对话

对话情绪：
- neutral: 中性情绪
- happy: 开心
- angry: 愤怒
- sad: 悲伤
- surprised: 惊讶
- fearful: 恐惧

对话选项类型：
- continue: 继续对话
- accept: 接受（任务、交易等）
- reject: 拒绝
- inquire: 询问更多信息
- leave: 结束对话离开

工作原则：
- 对话内容要符合NPC的性格和背景
- 对话选项要提供有意义的选择
- 好感度影响对话内容和可用选项
- 保持对话的连贯性和沉浸感
- 支持动态的对话分支和条件`;

  private dialogueState: DialogueAgentState;

  constructor() {
    super({
      temperature: 0.7,
      maxTokens: 4096,
    });

    this.dialogueState = {
      sessions: new Map(),
      npcDialogueHistory: new Map(),
      activeDialoguePerNpc: new Map(),
    };
  }

  protected getAgentName(): string {
    return 'Dialogue Agent';
  }

  protected getAgentDescription(): string {
    return '对话管理智能体，负责对话生成、对话选项、对话历史管理';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'dialogue_generation',
      'option_generation',
      'history_management',
      'context_awareness',
      'emotion_detection',
      'branching_dialogue',
      'dynamic_response',
    ];
  }

  /**
   * 处理消息主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        // 对话会话管理
        case 'start_dialogue':
          return await this.handleStartDialogue(data);
        case 'end_dialogue':
          return this.handleEndDialogue(data);
        case 'pause_dialogue':
          return this.handlePauseDialogue(data);
        case 'resume_dialogue':
          return this.handleResumeDialogue(data);
        case 'get_dialogue_session':
          return this.handleGetDialogueSession(data);

        // 对话生成
        case 'generate_dialogue':
          return await this.handleGenerateDialogue(data);
        case 'generate_response':
          return await this.handleGenerateResponse(data);
        case 'select_option':
          return await this.handleSelectOption(data);

        // 对话选项
        case 'generate_options':
          return await this.handleGenerateOptions(data);
        case 'get_available_options':
          return this.handleGetAvailableOptions(data);

        // 对话历史
        case 'get_history':
          return this.handleGetHistory(data);
        case 'add_to_history':
          return this.handleAddToHistory(data);
        case 'clear_history':
          return this.handleClearHistory(data);
        case 'get_npc_history':
          return this.handleGetNPCHistory(data);

        // 对话上下文
        case 'update_context':
          return this.handleUpdateContext(data);
        case 'get_context':
          return this.handleGetContext(data);

        // 特殊对话类型
        case 'generate_quest_dialogue':
          return await this.handleGenerateQuestDialogue(data);
        case 'generate_trade_dialogue':
          return await this.handleGenerateTradeDialogue(data);
        case 'generate_combat_dialogue':
          return await this.handleGenerateCombatDialogue(data);
        case 'generate_romantic_dialogue':
          return await this.handleGenerateRomanticDialogue(data);

        // 状态查询
        case 'get_active_dialogues':
          return this.handleGetActiveDialogues();
        case 'get_dialogue_state':
          return this.handleGetDialogueState();

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error processing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in DialogueAgent',
      };
    }
  }

  // ==================== 对话会话管理 ====================

  /**
   * 开始对话
   */
  private async handleStartDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const params = data as unknown as DialogueGenerationParams & {
      type?: DialogueType;
      relatedQuestId?: string;
      relatedItemId?: string;
    };

    if (!params.npcId) {
      return {
        success: false,
        error: 'Missing required field: npcId',
      };
    }

    // 检查是否已有活跃对话
    const existingDialogueId = this.dialogueState.activeDialoguePerNpc.get(params.npcId);
    if (existingDialogueId) {
      const existingSession = this.dialogueState.sessions.get(existingDialogueId);
      if (existingSession && existingSession.status === 'active') {
        return {
          success: true,
          data: {
            session: existingSession,
            resumed: true,
          },
        };
      }
    }

    // 创建新的对话会话
    const dialogueId = this.generateDialogueId();
    const now = Date.now();

    const context: DialogueContext = {
      dialogueId,
      npcId: params.npcId,
      npcName: params.context?.npcName || 'Unknown NPC',
      type: params.type || 'normal',
      startedAt: now,
      location: params.context?.location,
      relatedQuestId: params.relatedQuestId,
      relatedItemId: params.relatedItemId,
      playerState: params.context?.playerState,
      npcState: params.context?.npcState,
      storyContext: params.context?.storyContext,
    };

    const session: DialogueSession = {
      id: dialogueId,
      context,
      history: [],
      currentOptions: [],
      status: 'active',
      turnCount: 0,
      lastActivity: now,
    };

    this.dialogueState.sessions.set(dialogueId, session);
    this.dialogueState.activeDialoguePerNpc.set(params.npcId, dialogueId);

    // 生成开场对话
    const openingDialogue = await this.generateOpeningDialogue(session, params.topic);
    if (openingDialogue) {
      session.history.push(openingDialogue);
    }

    // 生成初始选项
    const options = await this.generateDialogueOptions(session);
    session.currentOptions = options;

    this.addMemory(
      `Started ${context.type} dialogue with ${context.npcName} (${params.npcId})`,
      'assistant',
      6,
      { dialogueId, npcId: params.npcId, type: context.type }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'dialogue_panel',
        action: 'start_dialogue',
        data: { session },
        options: { priority: 'high' },
      },
    ];

    return {
      success: true,
      data: { session, resumed: false },
      uiInstructions,
    };
  }

  /**
   * 结束对话
   */
  private handleEndDialogue(data: Record<string, unknown>): AgentResponse {
    const endData = data as { dialogueId: string; reason?: string };

    const session = this.dialogueState.sessions.get(endData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${endData.dialogueId}`,
      };
    }

    session.status = 'ended';
    this.dialogueState.activeDialoguePerNpc.delete(session.context.npcId);

    // 保存到NPC历史
    const npcHistory = this.dialogueState.npcDialogueHistory.get(session.context.npcId) || [];
    npcHistory.push(...session.history);
    this.dialogueState.npcDialogueHistory.set(session.context.npcId, npcHistory);

    this.addMemory(
      `Ended dialogue with ${session.context.npcName}. Turns: ${session.turnCount}`,
      'assistant',
      5,
      { dialogueId: endData.dialogueId, turns: session.turnCount, reason: endData.reason }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'hide',
        target: 'dialogue_panel',
        action: 'end_dialogue',
        data: { dialogueId: endData.dialogueId, reason: endData.reason },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: {
        ended: true,
        dialogueId: endData.dialogueId,
        turnCount: session.turnCount,
      },
      uiInstructions,
    };
  }

  /**
   * 暂停对话
   */
  private handlePauseDialogue(data: Record<string, unknown>): AgentResponse {
    const pauseData = data as { dialogueId: string };

    const session = this.dialogueState.sessions.get(pauseData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${pauseData.dialogueId}`,
      };
    }

    session.status = 'paused';

    return {
      success: true,
      data: { paused: true, dialogueId: pauseData.dialogueId },
    };
  }

  /**
   * 恢复对话
   */
  private handleResumeDialogue(data: Record<string, unknown>): AgentResponse {
    const resumeData = data as { dialogueId: string };

    const session = this.dialogueState.sessions.get(resumeData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${resumeData.dialogueId}`,
      };
    }

    session.status = 'active';
    session.lastActivity = Date.now();

    return {
      success: true,
      data: { session },
    };
  }

  /**
   * 获取对话会话
   */
  private handleGetDialogueSession(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { dialogueId: string };

    const session = this.dialogueState.sessions.get(queryData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${queryData.dialogueId}`,
      };
    }

    return {
      success: true,
      data: { session },
    };
  }

  // ==================== 对话生成 ====================

  /**
   * 生成对话
   */
  private async handleGenerateDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const params = data as unknown as DialogueGenerationParams;

    if (!params.npcId) {
      return {
        success: false,
        error: 'Missing required field: npcId',
      };
    }

    // 获取或创建会话
    let session = this.getActiveSessionForNPC(params.npcId);
    if (!session) {
      const startResult = await this.handleStartDialogue({
        ...data,
        type: params.type || 'normal',
      });
      if (!startResult.success || !startResult.data) {
        return startResult;
      }
      session = (startResult.data as { session: DialogueSession }).session;
    }

    // 生成对话响应
    const response = await this.generateNPCResponse(session, params.playerInput, params.topic);

    return {
      success: true,
      data: {
        dialogue: response,
        session,
      },
    };
  }

  /**
   * 生成响应
   */
  private async handleGenerateResponse(data: Record<string, unknown>): Promise<AgentResponse> {
    const responseData = data as {
      dialogueId: string;
      playerInput: string;
      selectedOptionId?: string;
    };

    const session = this.dialogueState.sessions.get(responseData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${responseData.dialogueId}`,
      };
    }

    if (session.status !== 'active') {
      return {
        success: false,
        error: `Dialogue session is not active: ${session.status}`,
      };
    }

    // 添加玩家消息到历史
    const playerMessage: DialogueMessage = {
      id: this.generateDialogueMessageId(),
      speakerId: 'player',
      speakerName: 'Player',
      content: responseData.playerInput,
      emotion: 'neutral',
      timestamp: Date.now(),
      isPlayer: true,
    };
    session.history.push(playerMessage);
    session.turnCount++;
    session.lastActivity = Date.now();

    // 生成NPC响应
    const npcResponse = await this.generateNPCResponse(session, responseData.playerInput);

    // 更新选项
    const newOptions = await this.generateDialogueOptions(session);
    session.currentOptions = newOptions;

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'dialogue_panel',
        action: 'add_message',
        data: {
          playerMessage,
          npcResponse,
          options: newOptions,
        },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: {
        response: npcResponse,
        options: newOptions,
        session,
      },
      uiInstructions,
    };
  }

  /**
   * 选择选项
   */
  private async handleSelectOption(data: Record<string, unknown>): Promise<AgentResponse> {
    const selectData = data as {
      dialogueId: string;
      optionId: string;
    };

    const session = this.dialogueState.sessions.get(selectData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${selectData.dialogueId}`,
      };
    }

    const option = session.currentOptions.find(o => o.id === selectData.optionId);
    if (!option) {
      return {
        success: false,
        error: `Option not found: ${selectData.optionId}`,
      };
    }

    if (option.disabled) {
      return {
        success: false,
        error: option.disabledReason || 'This option is not available',
      };
    }

    // 处理选项效果
    const effects = await this.processOptionEffects(session, option);

    // 根据选项类型处理
    let shouldEndDialogue = false;
    if (option.type === 'leave') {
      shouldEndDialogue = true;
    }

    // 添加玩家选择到历史
    const playerMessage: DialogueMessage = {
      id: this.generateDialogueMessageId(),
      speakerId: 'player',
      speakerName: 'Player',
      content: option.text,
      emotion: 'neutral',
      timestamp: Date.now(),
      isPlayer: true,
      metadata: {
        selectedOption: option.type,
      },
    };
    session.history.push(playerMessage);
    session.turnCount++;

    // 生成NPC响应
    const npcResponse = await this.generateNPCResponse(session, option.text);
    session.history.push(npcResponse);

    // 更新选项
    const newOptions = shouldEndDialogue ? [] : await this.generateDialogueOptions(session);
    session.currentOptions = newOptions;

    if (shouldEndDialogue) {
      return this.handleEndDialogue({ dialogueId: selectData.dialogueId, reason: 'player_left' });
    }

    return {
      success: true,
      data: {
        response: npcResponse,
        options: newOptions,
        effects,
        session,
      },
    };
  }

  // ==================== 对话选项 ====================

  /**
   * 生成对话选项
   */
  private async handleGenerateOptions(data: Record<string, unknown>): Promise<AgentResponse> {
    const params = data as unknown as DialogueOptionParams;

    const session = this.dialogueState.sessions.get(params.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${params.dialogueId}`,
      };
    }

    const options = await this.generateDialogueOptions(session, params.availableTypes);

    return {
      success: true,
      data: { options },
    };
  }

  /**
   * 获取可用选项
   */
  private handleGetAvailableOptions(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { dialogueId: string };

    const session = this.dialogueState.sessions.get(queryData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${queryData.dialogueId}`,
      };
    }

    return {
      success: true,
      data: {
        options: session.currentOptions,
        turnCount: session.turnCount,
      },
    };
  }

  // ==================== 对话历史 ====================

  /**
   * 获取对话历史
   */
  private handleGetHistory(data: Record<string, unknown>): AgentResponse {
    const query = data as DialogueHistoryQuery;

    let sessions = Array.from(this.dialogueState.sessions.values());

    // 过滤
    if (query.dialogueId) {
      sessions = sessions.filter(s => s.id === query.dialogueId);
    }
    if (query.npcId) {
      sessions = sessions.filter(s => s.context.npcId === query.npcId);
    }
    if (query.type) {
      sessions = sessions.filter(s => s.context.type === query.type);
    }

    // 排序和分页
    sessions.sort((a, b) => b.lastActivity - a.lastActivity);

    if (query.offset) {
      sessions = sessions.slice(query.offset);
    }
    if (query.limit) {
      sessions = sessions.slice(0, query.limit);
    }

    return {
      success: true,
      data: {
        sessions,
        total: this.dialogueState.sessions.size,
      },
    };
  }

  /**
   * 添加到历史
   */
  private handleAddToHistory(data: Record<string, unknown>): AgentResponse {
    const addData = data as {
      dialogueId: string;
      message: Omit<DialogueMessage, 'id' | 'timestamp'>;
    };

    const session = this.dialogueState.sessions.get(addData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${addData.dialogueId}`,
      };
    }

    const message: DialogueMessage = {
      ...addData.message,
      id: this.generateDialogueMessageId(),
      timestamp: Date.now(),
    };

    session.history.push(message);
    session.lastActivity = Date.now();

    return {
      success: true,
      data: { message },
    };
  }

  /**
   * 清除历史
   */
  private handleClearHistory(data: Record<string, unknown>): AgentResponse {
    const clearData = data as { dialogueId?: string; npcId?: string };

    if (clearData.dialogueId) {
      const session = this.dialogueState.sessions.get(clearData.dialogueId);
      if (session) {
        session.history = [];
        session.turnCount = 0;
      }
    } else if (clearData.npcId) {
      this.dialogueState.npcDialogueHistory.delete(clearData.npcId);
    } else {
      this.dialogueState.npcDialogueHistory.clear();
    }

    return {
      success: true,
      data: { cleared: true },
    };
  }

  /**
   * 获取NPC对话历史
   */
  private handleGetNPCHistory(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { npcId: string; limit?: number };

    let history = this.dialogueState.npcDialogueHistory.get(queryData.npcId) || [];

    if (queryData.limit) {
      history = history.slice(-queryData.limit);
    }

    return {
      success: true,
      data: {
        npcId: queryData.npcId,
        history,
        total: this.dialogueState.npcDialogueHistory.get(queryData.npcId)?.length || 0,
      },
    };
  }

  // ==================== 对话上下文 ====================

  /**
   * 更新上下文
   */
  private handleUpdateContext(data: Record<string, unknown>): AgentResponse {
    const updateData = data as {
      dialogueId: string;
      context: Partial<DialogueContext>;
    };

    const session = this.dialogueState.sessions.get(updateData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${updateData.dialogueId}`,
      };
    }

    session.context = {
      ...session.context,
      ...updateData.context,
    };

    return {
      success: true,
      data: { context: session.context },
    };
  }

  /**
   * 获取上下文
   */
  private handleGetContext(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { dialogueId: string };

    const session = this.dialogueState.sessions.get(queryData.dialogueId);
    if (!session) {
      return {
        success: false,
        error: `Dialogue session not found: ${queryData.dialogueId}`,
      };
    }

    return {
      success: true,
      data: { context: session.context },
    };
  }

  // ==================== 特殊对话类型 ====================

  /**
   * 生成任务对话
   */
  private async handleGenerateQuestDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const questData = data as {
      npcId: string;
      questId: string;
      questName: string;
      questDescription: string;
      questStatus: 'available' | 'in_progress' | 'completed';
    };

    // 创建任务对话会话
    const startResult = await this.handleStartDialogue({
      npcId: questData.npcId,
      type: 'quest',
      context: {
        npcId: questData.npcId,
      },
      relatedQuestId: questData.questId,
    });

    if (!startResult.success || !startResult.data) {
      return startResult;
    }

    const session = (startResult.data as { session: DialogueSession }).session;

    // 生成任务相关对话
    const questDialogue = await this.generateQuestSpecificDialogue(session, questData);
    session.history.push(questDialogue);

    // 生成任务相关选项
    const options = await this.generateQuestOptions(session, questData);
    session.currentOptions = options;

    return {
      success: true,
      data: {
        session,
        dialogue: questDialogue,
        options,
      },
      uiInstructions: startResult.uiInstructions,
    };
  }

  /**
   * 生成交易对话
   */
  private async handleGenerateTradeDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const tradeData = data as {
      npcId: string;
      itemId?: string;
      action: 'buy' | 'sell' | 'browse';
    };

    const startResult = await this.handleStartDialogue({
      npcId: tradeData.npcId,
      type: 'trade',
      context: {
        npcId: tradeData.npcId,
      },
      relatedItemId: tradeData.itemId,
    });

    if (!startResult.success || !startResult.data) {
      return startResult;
    }

    const session = (startResult.data as { session: DialogueSession }).session;

    const tradeDialogue = await this.generateTradeSpecificDialogue(session, tradeData);
    session.history.push(tradeDialogue);

    const options = await this.generateTradeOptions(session, tradeData);
    session.currentOptions = options;

    return {
      success: true,
      data: {
        session,
        dialogue: tradeDialogue,
        options,
      },
      uiInstructions: startResult.uiInstructions,
    };
  }

  /**
   * 生成战斗对话
   */
  private async handleGenerateCombatDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const combatData = data as {
      npcId: string;
      combatPhase: 'start' | 'during' | 'victory' | 'defeat';
      enemyName?: string;
    };

    const session = this.getActiveSessionForNPC(combatData.npcId);
    if (!session) {
      // 战斗对话通常是临时的，不需要完整会话
      const combatDialogue = await this.generateCombatSpecificDialogue(combatData);
      return {
        success: true,
        data: { dialogue: combatDialogue },
      };
    }

    const combatDialogue = await this.generateCombatSpecificDialogue(combatData);
    session.history.push(combatDialogue);

    return {
      success: true,
      data: {
        session,
        dialogue: combatDialogue,
      },
    };
  }

  /**
   * 生成浪漫对话
   */
  private async handleGenerateRomanticDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const romanticData = data as {
      npcId: string;
      affectionLevel: number;
      romanticStage: 'flirting' | 'dating' | 'committed' | 'married';
      topic?: string;
    };

    const startResult = await this.handleStartDialogue({
      npcId: romanticData.npcId,
      type: 'romantic',
      context: {
        npcId: romanticData.npcId,
        npcState: {
          affection: romanticData.affectionLevel,
        },
      },
    });

    if (!startResult.success || !startResult.data) {
      return startResult;
    }

    const session = (startResult.data as { session: DialogueSession }).session;

    const romanticDialogue = await this.generateRomanticSpecificDialogue(session, romanticData);
    session.history.push(romanticDialogue);

    const options = await this.generateRomanticOptions(session, romanticData);
    session.currentOptions = options;

    return {
      success: true,
      data: {
        session,
        dialogue: romanticDialogue,
        options,
      },
      uiInstructions: startResult.uiInstructions,
    };
  }

  // ==================== 状态查询 ====================

  /**
   * 获取活跃对话
   */
  private handleGetActiveDialogues(): AgentResponse {
    const activeDialogues = Array.from(this.dialogueState.sessions.values())
      .filter(s => s.status === 'active');

    return {
      success: true,
      data: {
        dialogues: activeDialogues,
        count: activeDialogues.length,
      },
    };
  }

  /**
   * 获取对话状态
   */
  private handleGetDialogueState(): AgentResponse {
    return {
      success: true,
      data: {
        totalSessions: this.dialogueState.sessions.size,
        activeSessions: Array.from(this.dialogueState.sessions.values())
          .filter(s => s.status === 'active').length,
        npcsWithHistory: this.dialogueState.npcDialogueHistory.size,
        activeDialoguePerNpc: Object.fromEntries(this.dialogueState.activeDialoguePerNpc),
      },
    };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 获取NPC的活跃会话
   */
  private getActiveSessionForNPC(npcId: string): DialogueSession | null {
    const dialogueId = this.dialogueState.activeDialoguePerNpc.get(npcId);
    if (!dialogueId) return null;

    const session = this.dialogueState.sessions.get(dialogueId);
    if (!session || session.status !== 'active') return null;

    return session;
  }

  /**
   * 生成开场对话
   */
  private async generateOpeningDialogue(
    session: DialogueSession,
    topic?: string
  ): Promise<DialogueMessage> {
    const { context } = session;

    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成NPC的开场对话。

NPC信息：
- 名字: ${context.npcName}
- 对话类型: ${context.type}
- 好感度: ${context.npcState?.affection ?? 0}
- 性格: ${context.npcState?.personality ?? '普通'}
- 对话风格: ${context.npcState?.dialogueStyle ?? 'normal'}
${topic ? `- 话题: ${topic}` : ''}
${context.location ? `- 地点: ${context.location}` : ''}

请生成开场对话，返回JSON格式：
{
  "content": "对话内容",
  "emotion": "情绪状态（neutral/happy/angry/sad/surprised/fearful）"
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.8,
        maxTokens: 300,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          content: string;
          emotion: DialogueEmotion;
        };
        return {
          id: this.generateDialogueMessageId(),
          speakerId: context.npcId,
          speakerName: context.npcName,
          content: parsed.content,
          emotion: parsed.emotion,
          timestamp: Date.now(),
          isPlayer: false,
        };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating opening dialogue:', error);
    }

    // 默认开场
    return {
      id: this.generateDialogueMessageId(),
      speakerId: context.npcId,
      speakerName: context.npcName,
      content: this.getDefaultOpening(context.type),
      emotion: 'neutral',
      timestamp: Date.now(),
      isPlayer: false,
    };
  }

  /**
   * 生成NPC响应
   */
  private async generateNPCResponse(
    session: DialogueSession,
    playerInput?: string,
    topic?: string
  ): Promise<DialogueMessage> {
    const { context, history } = session;

    const recentHistory = history.slice(-10).map(m =>
      `${m.isPlayer ? '玩家' : m.speakerName}: ${m.content}`
    ).join('\n');

    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成NPC的对话响应。

NPC信息：
- 名字: ${context.npcName}
- 对话类型: ${context.type}
- 好感度: ${context.npcState?.affection ?? 0}
- 性格: ${context.npcState?.personality ?? '普通'}
- 对话风格: ${context.npcState?.dialogueStyle ?? 'normal'}
- 特质: ${context.npcState?.traits?.join(', ') ?? '无'}

对话历史：
${recentHistory || '（新对话）'}

${playerInput ? `玩家说: ${playerInput}` : ''}
${topic ? `话题: ${topic}` : ''}

请生成NPC的响应，返回JSON格式：
{
  "content": "响应内容",
  "emotion": "情绪状态",
  "affectionHint": 建议的好感度变化（-5到5）
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        maxTokens: 400,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          content: string;
          emotion: DialogueEmotion;
          affectionHint?: number;
        };
        return {
          id: this.generateDialogueMessageId(),
          speakerId: context.npcId,
          speakerName: context.npcName,
          content: parsed.content,
          emotion: parsed.emotion,
          timestamp: Date.now(),
          isPlayer: false,
          metadata: {
            affectionChange: parsed.affectionHint,
          },
        };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating NPC response:', error);
    }

    return {
      id: this.generateDialogueMessageId(),
      speakerId: context.npcId,
      speakerName: context.npcName,
      content: '...',
      emotion: 'neutral',
      timestamp: Date.now(),
      isPlayer: false,
    };
  }

  /**
   * 生成对话选项
   */
  private async generateDialogueOptions(
    session: DialogueSession,
    availableTypes?: DialogueOptionType[]
  ): Promise<DialogueOption[]> {
    const { context, history } = session;
    const types = availableTypes || ['continue', 'inquire', 'leave'];

    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成对话选项。

NPC信息：
- 名字: ${context.npcName}
- 对话类型: ${context.type}
- 好感度: ${context.npcState?.affection ?? 0}

最近对话：
${history.slice(-3).map(m => `${m.isPlayer ? '玩家' : m.speakerName}: ${m.content}`).join('\n') || '（新对话）'}

可用选项类型: ${types.join(', ')}

请生成2-4个对话选项，返回JSON数组格式：
[
  {
    "text": "选项文本",
    "type": "选项类型",
    "requiresAffection": 好感度要求（可选，-100到100）
  }
]`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.6,
        maxTokens: 500,
      });

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          text: string;
          type: DialogueOptionType;
          requiresAffection?: number;
        }>;

        return parsed.map((opt, index) => ({
          id: `opt_${Date.now()}_${index}`,
          text: opt.text,
          type: opt.type,
          requiresAffection: opt.requiresAffection,
          disabled: opt.requiresAffection !== undefined &&
            (context.npcState?.affection ?? 0) < opt.requiresAffection,
          disabledReason: opt.requiresAffection !== undefined &&
            (context.npcState?.affection ?? 0) < opt.requiresAffection
            ? `需要好感度 ${opt.requiresAffection}`
            : undefined,
        }));
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating options:', error);
    }

    // 默认选项
    return this.getDefaultOptions(types);
  }

  /**
   * 处理选项效果
   */
  private async processOptionEffects(
    session: DialogueSession,
    option: DialogueOption
  ): Promise<DialogueEffect[]> {
    const effects: DialogueEffect[] = [];

    if (option.effects) {
      for (const effect of option.effects) {
        effects.push(effect);

        // 根据效果类型更新上下文
        if (effect.type === 'affection' && typeof effect.value === 'number') {
          if (session.context.npcState) {
            session.context.npcState.affection =
              (session.context.npcState.affection ?? 0) + effect.value;
          }
        }
      }
    }

    return effects;
  }

  /**
   * 生成任务特定对话
   */
  private async generateQuestSpecificDialogue(
    session: DialogueSession,
    questData: {
      questId: string;
      questName: string;
      questDescription: string;
      questStatus: 'available' | 'in_progress' | 'completed';
    }
  ): Promise<DialogueMessage> {
    const { context } = session;

    const statusMessages: Record<string, string> = {
      available: '发布任务',
      in_progress: '询问任务进度',
      completed: '任务完成',
    };

    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成任务相关对话。

NPC: ${context.npcName}
任务: ${questData.questName}
任务描述: ${questData.questDescription}
任务状态: ${statusMessages[questData.questStatus]}
好感度: ${context.npcState?.affection ?? 0}

请生成NPC的任务对话，返回JSON格式：
{
  "content": "对话内容",
  "emotion": "情绪状态"
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        maxTokens: 400,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          content: string;
          emotion: DialogueEmotion;
        };
        return {
          id: this.generateDialogueMessageId(),
          speakerId: context.npcId,
          speakerName: context.npcName,
          content: parsed.content,
          emotion: parsed.emotion,
          timestamp: Date.now(),
          isPlayer: false,
          metadata: {
            questUpdate: questData.questId,
          },
        };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating quest dialogue:', error);
    }

    return {
      id: this.generateDialogueMessageId(),
      speakerId: context.npcId,
      speakerName: context.npcName,
      content: `关于${questData.questName}...`,
      emotion: 'neutral',
      timestamp: Date.now(),
      isPlayer: false,
    };
  }

  /**
   * 生成任务选项
   */
  private generateQuestOptions(
    _session: DialogueSession,
    questData: { questStatus: 'available' | 'in_progress' | 'completed' }
  ): DialogueOption[] {
    const baseOptions: DialogueOption[] = [];

    if (questData.questStatus === 'available') {
      baseOptions.push({
        id: `opt_${Date.now()}_0`,
        text: '我接受这个任务',
        type: 'accept',
      });
      baseOptions.push({
        id: `opt_${Date.now()}_1`,
        text: '能告诉我更多细节吗？',
        type: 'inquire',
      });
      baseOptions.push({
        id: `opt_${Date.now()}_2`,
        text: '我现在没空',
        type: 'reject',
      });
    } else if (questData.questStatus === 'in_progress') {
      baseOptions.push({
        id: `opt_${Date.now()}_0`,
        text: '任务进展如何？',
        type: 'inquire',
      });
      baseOptions.push({
        id: `opt_${Date.now()}_1`,
        text: '我放弃这个任务',
        type: 'reject',
      });
    } else {
      baseOptions.push({
        id: `opt_${Date.now()}_0`,
        text: '很高兴能帮到你',
        type: 'continue',
      });
    }

    baseOptions.push({
      id: `opt_${Date.now()}_99`,
      text: '告辞',
      type: 'leave',
    });

    return baseOptions;
  }

  /**
   * 生成交易特定对话
   */
  private async generateTradeSpecificDialogue(
    session: DialogueSession,
    tradeData: { action: 'buy' | 'sell' | 'browse'; itemId?: string }
  ): Promise<DialogueMessage> {
    const { context } = session;

    const actionMessages: Record<string, string> = {
      buy: '购买物品',
      sell: '出售物品',
      browse: '浏览商品',
    };

    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成交易对话。

NPC: ${context.npcName}（商人）
交易动作: ${actionMessages[tradeData.action]}
${tradeData.itemId ? `物品ID: ${tradeData.itemId}` : ''}

请生成商人的交易对话，返回JSON格式：
{
  "content": "对话内容",
  "emotion": "情绪状态"
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.6,
        maxTokens: 300,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          content: string;
          emotion: DialogueEmotion;
        };
        return {
          id: this.generateDialogueMessageId(),
          speakerId: context.npcId,
          speakerName: context.npcName,
          content: parsed.content,
          emotion: parsed.emotion,
          timestamp: Date.now(),
          isPlayer: false,
        };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating trade dialogue:', error);
    }

    return {
      id: this.generateDialogueMessageId(),
      speakerId: context.npcId,
      speakerName: context.npcName,
      content: '欢迎光临！有什么需要吗？',
      emotion: 'happy',
      timestamp: Date.now(),
      isPlayer: false,
    };
  }

  /**
   * 生成交易选项
   */
  private generateTradeOptions(
    _session: DialogueSession,
    _tradeData: { action: 'buy' | 'sell' | 'browse' }
  ): DialogueOption[] {
    const options: DialogueOption[] = [
      {
        id: `opt_${Date.now()}_0`,
        text: '我想买东西',
        type: 'continue',
      },
      {
        id: `opt_${Date.now()}_1`,
        text: '我想卖东西',
        type: 'continue',
      },
      {
        id: `opt_${Date.now()}_2`,
        text: '只是看看',
        type: 'inquire',
      },
      {
        id: `opt_${Date.now()}_99`,
        text: '不需要了，再见',
        type: 'leave',
      },
    ];

    return options;
  }

  /**
   * 生成战斗特定对话
   */
  private async generateCombatSpecificDialogue(combatData: {
    npcId: string;
    combatPhase: 'start' | 'during' | 'victory' | 'defeat';
    enemyName?: string;
  }): Promise<DialogueMessage> {
    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成战斗对话。

战斗阶段: ${combatData.combatPhase}
${combatData.enemyName ? `敌人: ${combatData.enemyName}` : ''}

请生成战斗中的喊话或对话，返回JSON格式：
{
  "content": "对话内容",
  "emotion": "情绪状态"
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.8,
        maxTokens: 200,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          content: string;
          emotion: DialogueEmotion;
        };
        return {
          id: this.generateDialogueMessageId(),
          speakerId: combatData.npcId,
          speakerName: combatData.enemyName || 'Enemy',
          content: parsed.content,
          emotion: parsed.emotion,
          timestamp: Date.now(),
          isPlayer: false,
        };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating combat dialogue:', error);
    }

    const defaultDialogues: Record<string, { content: string; emotion: DialogueEmotion }> = {
      start: { content: '来吧！', emotion: 'angry' },
      during: { content: '哈！', emotion: 'neutral' },
      victory: { content: '胜利！', emotion: 'happy' },
      defeat: { content: '不...', emotion: 'sad' },
    };

    const defaultDialogue = defaultDialogues[combatData.combatPhase];
    return {
      id: this.generateDialogueMessageId(),
      speakerId: combatData.npcId,
      speakerName: combatData.enemyName || 'NPC',
      content: defaultDialogue.content,
      emotion: defaultDialogue.emotion,
      timestamp: Date.now(),
      isPlayer: false,
    };
  }

  /**
   * 生成浪漫特定对话
   */
  private async generateRomanticSpecificDialogue(
    session: DialogueSession,
    romanticData: {
      affectionLevel: number;
      romanticStage: 'flirting' | 'dating' | 'committed' | 'married';
      topic?: string;
    }
  ): Promise<DialogueMessage> {
    const { context } = session;

    const prompt: Message[] = [
      {
        role: 'user',
        content: `生成浪漫对话。

NPC: ${context.npcName}
好感度: ${romanticData.affectionLevel}
恋爱阶段: ${romanticData.romanticStage}
${romanticData.topic ? `话题: ${romanticData.topic}` : ''}

请生成浪漫对话，返回JSON格式：
{
  "content": "对话内容",
  "emotion": "情绪状态"
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.8,
        maxTokens: 400,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          content: string;
          emotion: DialogueEmotion;
        };
        return {
          id: this.generateDialogueMessageId(),
          speakerId: context.npcId,
          speakerName: context.npcName,
          content: parsed.content,
          emotion: parsed.emotion,
          timestamp: Date.now(),
          isPlayer: false,
        };
      }
    } catch (error) {
      console.error('[DialogueAgent] Error generating romantic dialogue:', error);
    }

    return {
      id: this.generateDialogueMessageId(),
      speakerId: context.npcId,
      speakerName: context.npcName,
      content: '...',
      emotion: 'happy',
      timestamp: Date.now(),
      isPlayer: false,
    };
  }

  /**
   * 生成浪漫选项
   */
  private generateRomanticOptions(
    _session: DialogueSession,
    romanticData: { affectionLevel: number; romanticStage: string }
  ): DialogueOption[] {
    const options: DialogueOption[] = [];

    if (romanticData.affectionLevel >= 25) {
      options.push({
        id: `opt_${Date.now()}_0`,
        text: '你今天看起来很美',
        type: 'continue',
        requiresAffection: 25,
      });
    }

    if (romanticData.affectionLevel >= 50) {
      options.push({
        id: `opt_${Date.now()}_1`,
        text: '我很喜欢和你在一起',
        type: 'continue',
        requiresAffection: 50,
      });
    }

    if (romanticData.affectionLevel >= 75) {
      options.push({
        id: `opt_${Date.now()}_2`,
        text: '我有话想对你说...',
        type: 'continue',
        requiresAffection: 75,
      });
    }

    options.push({
      id: `opt_${Date.now()}_3`,
      text: '今天天气不错',
      type: 'continue',
    });

    options.push({
      id: `opt_${Date.now()}_99`,
      text: '我该走了',
      type: 'leave',
    });

    // 标记不可用选项
    return options.map(opt => ({
      ...opt,
      disabled: opt.requiresAffection !== undefined &&
        romanticData.affectionLevel < opt.requiresAffection,
      disabledReason: opt.requiresAffection !== undefined &&
        romanticData.affectionLevel < opt.requiresAffection
        ? `需要好感度 ${opt.requiresAffection}`
        : undefined,
    }));
  }

  /**
   * 获取默认开场
   */
  private getDefaultOpening(type: DialogueType): string {
    const openings: Record<DialogueType, string> = {
      normal: '你好，有什么事吗？',
      quest: '我有一件事想请你帮忙...',
      trade: '欢迎光临！需要什么？',
      combat: '准备战斗！',
      romantic: '...你来了。',
    };
    return openings[type];
  }

  /**
   * 获取默认选项
   */
  private getDefaultOptions(types: DialogueOptionType[]): DialogueOption[] {
    const defaultTexts: Record<DialogueOptionType, string> = {
      continue: '继续',
      accept: '接受',
      reject: '拒绝',
      inquire: '了解更多',
      leave: '离开',
    };

    return types.map((type, index) => ({
      id: `opt_default_${index}`,
      text: defaultTexts[type],
      type,
    }));
  }

  /**
   * 生成对话ID
   */
  private generateDialogueId(): string {
    return `dialogue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成对话消息ID
   */
  private generateDialogueMessageId(): string {
    return `dmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default DialogueAgent;

// 导出单例工厂
let dialogueAgentInstance: DialogueAgent | null = null;

export function getDialogueAgent(config?: Partial<import('@ai-rpg/shared').AgentConfig>): DialogueAgent {
  if (!dialogueAgentInstance) {
    dialogueAgentInstance = new DialogueAgent();
    if (config) {
      dialogueAgentInstance.updateConfig(config);
    }
  }
  return dialogueAgentInstance;
}
