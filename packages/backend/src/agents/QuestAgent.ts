import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Quest,
  QuestObjective,
  QuestRewards,
  QuestType,
  UIInstruction,
  AgentBinding,
  ToolType,
  InitializationContext,
  InitializationResult,
  QuestDefinition,
  ObjectiveType,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// 任务链配置
interface QuestChain {
  id: string;
  name: string;
  description: string;
  questIds: string[];
  currentQuestIndex: number;
  status: 'active' | 'completed' | 'abandoned';
  chainRewards: QuestRewards;
}

// 任务生成参数
interface QuestGenerationParams {
  type: Quest['type'];
  context: {
    location?: string;
    npcs?: string[];
    playerLevel?: number;
    storyProgress?: number;
    previousQuests?: string[];
  };
  difficulty?: 'easy' | 'normal' | 'hard' | 'extreme';
  timeLimit?: number;
}

// 任务进度更新
interface QuestProgressUpdate {
  questId: string;
  objectiveId: string;
  progress: number;
}

// 任务状态变更结果
interface QuestStatusResult {
  quest: Quest;
  statusChanged: boolean;
  previousStatus: Quest['status'];
  rewards?: QuestRewards;
  chainAdvanced?: boolean;
  nextQuest?: Quest;
}

// 任务过滤器
interface QuestFilter {
  type?: Quest['type'];
  status?: Quest['status'];
  location?: string;
  giver?: string;
  limit?: number;
}

// 任务统计数据
interface QuestStatistics {
  total: number;
  byType: Record<QuestType, number>;
  byStatus: Record<Quest['status'], number>;
  completedRewards: {
    experience: number;
    currency: number;
    items: string[];
  };
}

/**
 * 任务管理智能体
 * 负责生成任务、追踪进度、处理完成和失败、分发奖励
 */
export class QuestAgent extends AgentBase {
  readonly type: AgentType = AT.QUEST;
  
  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.QUEST_DATA,
    ToolTypeEnum.INVENTORY_DATA,
    ToolTypeEnum.NUMERICAL,
    ToolTypeEnum.NPC_DATA,
    ToolTypeEnum.MAP_DATA,
  ];
  
  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.STORY_CONTEXT, enabled: true },
    { agentType: AT.NPC_PARTY, enabled: true },
    { agentType: AT.MAP, enabled: true },
  ];
  
  readonly systemPrompt = `你是任务管理智能体，负责管理游戏中的所有任务系统。

核心职责：
1. 任务生成：根据故事进度、玩家等级、地点等生成合适的任务
2. 进度追踪：实时追踪任务目标的完成进度
3. 状态管理：管理任务的状态转换（锁定→可用→进行中→完成/失败）
4. 奖励分发：任务完成时发放奖励
5. 任务链管理：管理链式任务的顺序推进

任务类型：
- main: 主线任务，推动故事发展
- side: 支线任务，丰富游戏内容
- daily: 日常任务，每日可重复
- hidden: 隐藏任务，需要特殊条件触发

任务目标类型：
- kill: 击杀目标
- collect: 收集物品
- talk: 与NPC对话
- explore: 探索地点
- custom: 自定义目标

任务状态：
- locked: 锁定状态，前置条件未满足
- available: 可接受状态
- in_progress: 进行中
- completed: 已完成
- failed: 已失败

工作原则：
- 确保任务的合理性和可完成性
- 任务奖励应与难度匹配
- 维护任务链的连贯性
- 及时更新任务状态`;

  // 任务存储
  private quests: Map<string, Quest> = new Map();
  
  // 任务链存储
  private questChains: Map<string, QuestChain> = new Map();
  
  // 玩家已接受的任务
  private activeQuests: Set<string> = new Set();
  
  // 已完成的任务（用于前置条件检查）
  private completedQuests: Set<string> = new Set();
  
  // 任务ID计数器
  private questIdCounter: number = 0;
  private chainIdCounter: number = 0;

  constructor() {
    super({
      temperature: 0.6,
      maxTokens: 4096,
    });
  }

  protected getAgentName(): string {
    return 'Quest Agent';
  }

  protected getAgentDescription(): string {
    return '任务管理智能体，负责生成任务、追踪进度、处理完成和失败';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'quest_generation',
      'progress_tracking',
      'reward_distribution',
      'quest_chain_management',
      'daily_quest_refresh',
      'hidden_quest_discovery',
    ];
  }

  /**
   * 初始化方法
   * 用于游戏开始时添加初始任务
   */
  async initialize(context: InitializationContext): Promise<InitializationResult> {
    try {
      const { character, template } = context;
      
      const addedQuests: string[] = [];
      
      // 1. 从模板获取初始任务
      if (template.initialQuests && template.initialQuests.length > 0) {
        for (const questDef of template.initialQuests) {
          const quest = this.createQuestFromDefinition(questDef);
          if (quest) {
            this.quests.set(quest.id, quest);
            // 自动接受初始任务
            this.activeQuests.add(quest.id);
            addedQuests.push(quest.id);
          }
        }
      }
      
      // 2. 如果没有模板任务，创建默认新手任务
      if (addedQuests.length === 0) {
        const defaultQuest = this.createDefaultStarterQuest(character);
        if (defaultQuest) {
          this.quests.set(defaultQuest.id, defaultQuest);
          this.activeQuests.add(defaultQuest.id);
          addedQuests.push(defaultQuest.id);
        }
      }
      
      this.addMemory(
        `Initialized quests for character: ${character.name}. Active quests: ${addedQuests.length}`,
        'assistant',
        7,
        { characterId: character.id, addedQuests }
      );
      
      return {
        success: true,
        data: {
          addedQuests,
          totalQuests: addedQuests.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during quest initialization',
      };
    }
  }

  /**
   * 根据定义创建任务
   */
  private createQuestFromDefinition(questDef: QuestDefinition): Quest | null {
    if (!questDef.id || !questDef.name) {
      return null;
    }
    
    const objectives: QuestObjective[] = questDef.objectives.map((obj) => ({
      id: obj.id,
      description: obj.description,
      type: obj.type as ObjectiveType,
      target: obj.target,
      current: 0,
      required: obj.required,
      isCompleted: false,
    }));
    
    // 转换奖励格式
    const rewards: QuestRewards = {
      experience: 0,
      currency: {},
      items: [],
    };
    
    if (questDef.rewards) {
      for (const reward of questDef.rewards) {
        if (reward.type === 'experience') {
          rewards.experience = typeof reward.value === 'number' ? reward.value : parseInt(reward.value as string, 10) || 100;
        } else if (reward.type === 'currency') {
          rewards.currency = rewards.currency || {};
          rewards.currency.gold = typeof reward.value === 'number' ? reward.value : parseInt(reward.value as string, 10) || 50;
        } else if (reward.type === 'item' && typeof reward.value === 'string') {
          rewards.items = rewards.items || [];
          rewards.items.push({ itemId: reward.value, quantity: reward.quantity || 1 });
        }
      }
    }
    
    return {
      id: questDef.id,
      name: questDef.name,
      description: questDef.description,
      type: questDef.type as Quest['type'],
      status: 'available' as const,
      objectives,
      rewards,
      prerequisites: [],
      timeLimit: questDef.timeLimit,
      log: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * 创建默认新手任务
   */
  private createDefaultStarterQuest(character: { name: string; class: string }): Quest {
    return {
      id: 'starter_quest_001',
      name: '初次冒险',
      description: `欢迎来到这个世界，${character.name}！完成这个简单的任务来熟悉环境。`,
      type: 'main',
      status: 'in_progress' as const,
      objectives: [
        {
          id: 'starter_quest_001_obj_0',
          description: '探索起始区域',
          type: 'explore' as const,
          target: 'starting_area',
          current: 0,
          required: 1,
          isCompleted: false,
        },
        {
          id: 'starter_quest_001_obj_1',
          description: '与第一个NPC交谈',
          type: 'talk' as const,
          target: 'guide_npc',
          current: 0,
          required: 1,
          isCompleted: false,
        },
      ],
      rewards: {
        experience: 100,
        currency: { gold: 50 },
        items: [],
      },
      prerequisites: [],
      log: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * 处理消息主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        case 'generate_quest':
          return this.handleGenerateQuest(data);
        case 'generate_quest_chain':
          return this.handleGenerateQuestChain(data);
        case 'accept_quest':
          return this.handleAcceptQuest(data);
        case 'update_progress':
          return this.handleUpdateProgress(data);
        case 'complete_quest':
          return this.handleCompleteQuest(data);
        case 'fail_quest':
          return this.handleFailQuest(data);
        case 'abandon_quest':
          return this.handleAbandonQuest(data);
        case 'get_quest':
          return this.handleGetQuest(data);
        case 'get_active_quests':
          return this.handleGetActiveQuests(data);
        case 'get_available_quests':
          return this.handleGetAvailableQuests(data);
        case 'get_quest_chain':
          return this.handleGetQuestChain(data);
        case 'check_prerequisites':
          return this.handleCheckPrerequisites(data);
        case 'refresh_daily_quests':
          return this.handleRefreshDailyQuests(data);
        case 'get_statistics':
          return this.handleGetStatistics();
        case 'distribute_rewards':
          return this.handleDistributeRewards(data);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in QuestAgent',
      };
    }
  }

  // ==================== 任务生成 ====================

  /**
   * 生成单个任务
   */
  private handleGenerateQuest(data: Record<string, unknown>): AgentResponse {
    const params = data as unknown as QuestGenerationParams;
    
    if (!params.type) {
      return {
        success: false,
        error: 'Missing required field: type',
      };
    }

    const quest = this.createQuest(params);
    this.quests.set(quest.id, quest);

    this.addMemory(
      `Generated ${quest.type} quest: ${quest.name}`,
      'assistant',
      6,
      { questId: quest.id, type: quest.type }
    );

    return {
      success: true,
      data: { quest },
    };
  }

  /**
   * 生成任务链
   */
  private handleGenerateQuestChain(data: Record<string, unknown>): AgentResponse {
    const chainData = data as {
      name: string;
      description: string;
      questCount: number;
      baseType: Quest['type'];
      context: QuestGenerationParams['context'];
      chainRewards?: QuestRewards;
    };

    if (!chainData.name || !chainData.questCount) {
      return {
        success: false,
        error: 'Missing required fields: name, questCount',
      };
    }

    const chain = this.createQuestChain(chainData);
    this.questChains.set(chain.id, chain);

    // 将所有任务添加到任务列表
    for (const questId of chain.questIds) {
      const quest = this.quests.get(questId);
      if (quest) {
        // 第一个任务解锁，其他锁定
        if (chain.questIds.indexOf(questId) > 0) {
          quest.status = 'locked';
          quest.prerequisites = [chain.questIds[chain.questIds.indexOf(questId) - 1]];
        }
      }
    }

    this.addMemory(
      `Generated quest chain: ${chain.name} with ${chain.questIds.length} quests`,
      'assistant',
      8,
      { chainId: chain.id, questCount: chain.questIds.length }
    );

    return {
      success: true,
      data: { 
        chain,
        quests: chain.questIds.map(id => this.quests.get(id)).filter((q): q is Quest => q !== undefined),
      },
    };
  }

  /**
   * 创建任务
   */
  private createQuest(params: QuestGenerationParams): Quest {
    const id = this.generateQuestId();
    const difficulty = params.difficulty || 'normal';
    const now = Math.floor(Date.now() / 1000);
    
    // 生成任务目标
    const objectives = this.generateObjectives(params.type, difficulty, params.context);
    
    // 生成奖励
    const rewards = this.generateRewards(params.type, difficulty, params.context.playerLevel);

    const quest: Quest = {
      id,
      name: this.generateQuestName(params.type, params.context),
      description: this.generateQuestDescription(params.type, params.context, objectives),
      type: params.type,
      status: this.determineInitialStatus(params.context.previousQuests),
      objectives,
      rewards,
      prerequisites: params.context.previousQuests || [],
      timeLimit: params.timeLimit,
      log: [],
      createdAt: now,
      updatedAt: now,
    };

    return quest;
  }

  /**
   * 创建任务链
   */
  private createQuestChain(data: {
    name: string;
    description: string;
    questCount: number;
    baseType: Quest['type'];
    context: QuestGenerationParams['context'];
    chainRewards?: QuestRewards;
  }): QuestChain {
    const chainId = this.generateChainId();
    const questIds: string[] = [];

    // 生成链中的任务
    for (let i = 0; i < data.questCount; i++) {
      const questParams: QuestGenerationParams = {
        type: data.baseType,
        context: {
          ...data.context,
          previousQuests: i > 0 ? [questIds[i - 1]] : [],
        },
        difficulty: this.getChainDifficulty(i, data.questCount),
      };

      const quest = this.createQuest(questParams);
      quest.name = `${data.name} - 第${i + 1}部分`;
      quest.description = `${data.description} (${i + 1}/${data.questCount})`;
      
      if (i > 0) {
        quest.status = 'locked';
        quest.prerequisites = [questIds[i - 1]];
      }

      this.quests.set(quest.id, quest);
      questIds.push(quest.id);
    }

    return {
      id: chainId,
      name: data.name,
      description: data.description,
      questIds,
      currentQuestIndex: 0,
      status: 'active',
      chainRewards: data.chainRewards || {},
    };
  }

  /**
   * 生成任务目标
   */
  private generateObjectives(
    type: Quest['type'],
    difficulty: string,
    context: QuestGenerationParams['context']
  ): QuestObjective[] {
    const objectiveCount = this.getObjectiveCount(type, difficulty);
    const objectives: QuestObjective[] = [];

    const objectiveTypes: QuestObjective['type'][] = ['kill', 'collect', 'talk', 'explore', 'custom'];
    
    for (let i = 0; i < objectiveCount; i++) {
      const objType = objectiveTypes[i % objectiveTypes.length];
      const objective = this.createObjective(objType, difficulty, context, i);
      objectives.push(objective);
    }

    return objectives;
  }

  /**
   * 创建单个目标
   */
  private createObjective(
    type: QuestObjective['type'],
    difficulty: string,
    context: QuestGenerationParams['context'],
    index: number
  ): QuestObjective {
    const baseRequired = this.getBaseRequired(type, difficulty);
    
    const descriptions: Record<QuestObjective['type'], string> = {
      kill: `击败敌人`,
      collect: `收集物品`,
      talk: `与NPC对话`,
      explore: `探索区域`,
      custom: `完成特殊任务`,
    };

    const targets: Record<QuestObjective['type'], string> = {
      kill: context.npcs?.[0] || '敌人',
      collect: '任务物品',
      talk: context.npcs?.[0] || '村民',
      explore: context.location || '未知区域',
      custom: '特殊目标',
    };

    return {
      id: `obj_${Date.now()}_${index}`,
      description: `${descriptions[type]}: ${targets[type]}`,
      type,
      target: targets[type],
      current: 0,
      required: baseRequired,
      isCompleted: false,
    };
  }

  /**
   * 生成奖励
   */
  private generateRewards(
    type: Quest['type'],
    difficulty: string,
    playerLevel?: number
  ): QuestRewards {
    const baseExp = this.getBaseExperience(type, difficulty);
    const baseCurrency = this.getBaseCurrency(type, difficulty);
    const levelMultiplier = playerLevel ? 1 + (playerLevel - 1) * 0.1 : 1;

    const rewards: QuestRewards = {
      experience: Math.floor(baseExp * levelMultiplier),
      currency: {
        gold: Math.floor(baseCurrency * levelMultiplier),
      },
    };

    // 主线任务额外奖励
    if (type === 'main') {
      rewards.reputation = {
        main_faction: 10,
      };
    }

    // 高难度任务额外奖励
    if (difficulty === 'hard' || difficulty === 'extreme') {
      rewards.items = [
        { itemId: 'rare_item', quantity: 1 },
      ];
    }

    return rewards;
  }

  /**
   * 生成任务名称
   */
  private generateQuestName(
    type: Quest['type'],
    context: QuestGenerationParams['context']
  ): string {
    const prefixes: Record<QuestType, string[]> = {
      main: ['主线任务', '关键任务', '重要使命'],
      side: ['支线任务', '额外委托', '帮助请求'],
      daily: ['日常任务', '每日委托', '例行公事'],
      hidden: ['隐藏任务', '秘密委托', '神秘事件'],
      chain: ['链式任务', '连续委托', '系列任务'],
    };

    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
    const location = context.location || '未知之地';
    
    return `${prefix}: ${location}的挑战`;
  }

  /**
   * 生成任务描述
   */
  private generateQuestDescription(
    type: Quest['type'],
    context: QuestGenerationParams['context'],
    objectives: QuestObjective[]
  ): string {
    const objectiveSummary = objectives
      .map(o => o.description)
      .join('；');

    return `任务类型: ${type}。目标: ${objectiveSummary}。地点: ${context.location || '未知'}。`;
  }

  /**
   * 确定初始状态
   */
  private determineInitialStatus(previousQuests?: string[]): Quest['status'] {
    if (!previousQuests || previousQuests.length === 0) {
      return 'available';
    }

    const allCompleted = previousQuests.every(id => this.completedQuests.has(id));
    return allCompleted ? 'available' : 'locked';
  }

  // ==================== 任务接受 ====================

  /**
   * 接受任务
   */
  private handleAcceptQuest(data: Record<string, unknown>): AgentResponse {
    const acceptData = data as { questId: string };

    if (!acceptData.questId) {
      return {
        success: false,
        error: 'Missing required field: questId',
      };
    }

    const quest = this.quests.get(acceptData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${acceptData.questId}`,
      };
    }

    if (quest.status !== 'available') {
      return {
        success: false,
        error: `Quest is not available for acceptance. Current status: ${quest.status}`,
      };
    }

    // 检查前置条件
    const prereqCheck = this.checkPrerequisites(quest);
    if (!prereqCheck.met) {
      return {
        success: false,
        error: `Prerequisites not met: ${prereqCheck.missing.join(', ')}`,
      };
    }

    // 更新任务状态
    quest.status = 'in_progress';
    this.activeQuests.add(quest.id);

    this.addMemory(
      `Player accepted quest: ${quest.name}`,
      'assistant',
      5,
      { questId: quest.id, type: quest.type }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'quest_panel',
        action: 'add_quest',
        data: { quest },
        options: { priority: 'normal' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'quest_accepted',
        data: { message: `已接受任务: ${quest.name}` },
        options: { duration: 3000 },
      },
    ];

    return {
      success: true,
      data: { quest },
      uiInstructions,
    };
  }

  // ==================== 进度更新 ====================

  /**
   * 更新任务进度
   */
  private handleUpdateProgress(data: Record<string, unknown>): AgentResponse {
    const progressData = data as unknown as QuestProgressUpdate;

    if (!progressData.questId || !progressData.objectiveId) {
      return {
        success: false,
        error: 'Missing required fields: questId, objectiveId',
      };
    }

    const quest = this.quests.get(progressData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${progressData.questId}`,
      };
    }

    if (quest.status !== 'in_progress') {
      return {
        success: false,
        error: `Quest is not in progress. Current status: ${quest.status}`,
      };
    }

    const objective = quest.objectives.find(o => o.id === progressData.objectiveId);
    if (!objective) {
      return {
        success: false,
        error: `Objective not found: ${progressData.objectiveId}`,
      };
    }

    // 更新进度
    const previousCurrent = objective.current;
    objective.current = Math.min(objective.current + progressData.progress, objective.required);
    
    // 检查是否完成
    if (objective.current >= objective.required && !objective.isCompleted) {
      objective.isCompleted = true;
    }

    // 检查任务是否全部完成
    const allCompleted = quest.objectives.every(o => o.isCompleted);
    
    this.addMemory(
      `Quest progress updated: ${quest.name} - ${objective.description} (${objective.current}/${objective.required})`,
      'assistant',
      4,
      { questId: quest.id, objectiveId: objective.id, progress: objective.current }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'quest_panel',
        action: 'update_progress',
        data: { questId: quest.id, objectiveId: objective.id, progress: objective.current },
        options: { priority: 'low' },
      },
    ];

    if (objective.isCompleted && previousCurrent < objective.required) {
      uiInstructions.push({
        type: 'notify',
        target: 'notification',
        action: 'objective_completed',
        data: { message: `目标完成: ${objective.description}` },
        options: { duration: 2000 },
      });
    }

    return {
      success: true,
      data: {
        quest,
        objective,
        allObjectivesCompleted: allCompleted,
      },
      uiInstructions,
    };
  }

  // ==================== 任务完成 ====================

  /**
   * 完成任务
   */
  private handleCompleteQuest(data: Record<string, unknown>): AgentResponse {
    const completeData = data as { questId: string };

    if (!completeData.questId) {
      return {
        success: false,
        error: 'Missing required field: questId',
      };
    }

    const quest = this.quests.get(completeData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${completeData.questId}`,
      };
    }

    if (quest.status !== 'in_progress') {
      return {
        success: false,
        error: `Quest is not in progress. Current status: ${quest.status}`,
      };
    }

    // 检查所有目标是否完成
    const allCompleted = quest.objectives.every(o => o.isCompleted);
    if (!allCompleted) {
      return {
        success: false,
        error: 'Not all objectives are completed',
      };
    }

    // 更新状态
    const previousStatus = quest.status;
    quest.status = 'completed';
    this.activeQuests.delete(quest.id);
    this.completedQuests.add(quest.id);

    // 分发奖励
    const rewards = quest.rewards;

    // 检查任务链推进
    let chainAdvanced = false;
    let nextQuest: Quest | undefined;
    
    const chainResult = this.advanceQuestChain(quest.id);
    if (chainResult) {
      chainAdvanced = true;
      nextQuest = chainResult;
    }

    this.addMemory(
      `Quest completed: ${quest.name}. Rewards distributed.`,
      'assistant',
      8,
      { questId: quest.id, rewards: quest.rewards }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'quest_panel',
        action: 'complete_quest',
        data: { questId: quest.id, rewards },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'quest_completed',
        data: { message: `任务完成: ${quest.name}`, rewards },
        options: { duration: 5000, priority: 'high' },
      },
    ];

    if (nextQuest) {
      uiInstructions.push({
        type: 'notify',
        target: 'notification',
        action: 'new_quest_available',
        data: { message: `新任务可用: ${nextQuest.name}` },
        options: { duration: 3000 },
      });
    }

    const result: QuestStatusResult = {
      quest,
      statusChanged: true,
      previousStatus,
      rewards,
      chainAdvanced,
      nextQuest,
    };

    return {
      success: true,
      data: result,
      uiInstructions,
    };
  }

  // ==================== 任务失败 ====================

  /**
   * 任务失败
   */
  private handleFailQuest(data: Record<string, unknown>): AgentResponse {
    const failData = data as { questId: string; reason?: string };

    if (!failData.questId) {
      return {
        success: false,
        error: 'Missing required field: questId',
      };
    }

    const quest = this.quests.get(failData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${failData.questId}`,
      };
    }

    if (quest.status !== 'in_progress') {
      return {
        success: false,
        error: `Quest is not in progress. Current status: ${quest.status}`,
      };
    }

    const previousStatus = quest.status;
    quest.status = 'failed';
    this.activeQuests.delete(quest.id);

    this.addMemory(
      `Quest failed: ${quest.name}. Reason: ${failData.reason || 'Unknown'}`,
      'assistant',
      6,
      { questId: quest.id, reason: failData.reason }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'quest_panel',
        action: 'fail_quest',
        data: { questId: quest.id, reason: failData.reason },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'quest_failed',
        data: { message: `任务失败: ${quest.name}`, reason: failData.reason },
        options: { duration: 4000, priority: 'high' },
      },
    ];

    const result: QuestStatusResult = {
      quest,
      statusChanged: true,
      previousStatus,
    };

    return {
      success: true,
      data: result,
      uiInstructions,
    };
  }

  // ==================== 放弃任务 ====================

  /**
   * 放弃任务
   */
  private handleAbandonQuest(data: Record<string, unknown>): AgentResponse {
    const abandonData = data as { questId: string };

    if (!abandonData.questId) {
      return {
        success: false,
        error: 'Missing required field: questId',
      };
    }

    const quest = this.quests.get(abandonData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${abandonData.questId}`,
      };
    }

    if (quest.status !== 'in_progress') {
      return {
        success: false,
        error: `Quest is not in progress. Current status: ${quest.status}`,
      };
    }

    // 主线任务不能放弃
    if (quest.type === 'main') {
      return {
        success: false,
        error: 'Main quests cannot be abandoned',
      };
    }

    const previousStatus = quest.status;
    quest.status = 'available';
    this.activeQuests.delete(quest.id);

    // 重置目标进度
    for (const objective of quest.objectives) {
      objective.current = 0;
      objective.isCompleted = false;
    }

    this.addMemory(
      `Quest abandoned: ${quest.name}`,
      'assistant',
      4,
      { questId: quest.id }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'quest_panel',
        action: 'remove_quest',
        data: { questId: quest.id },
        options: { priority: 'normal' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'quest_abandoned',
        data: { message: `已放弃任务: ${quest.name}` },
        options: { duration: 2000 },
      },
    ];

    return {
      success: true,
      data: { quest, previousStatus },
      uiInstructions,
    };
  }

  // ==================== 查询操作 ====================

  /**
   * 获取单个任务
   */
  private handleGetQuest(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { questId: string };

    if (!queryData.questId) {
      return {
        success: false,
        error: 'Missing required field: questId',
      };
    }

    const quest = this.quests.get(queryData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${queryData.questId}`,
      };
    }

    return {
      success: true,
      data: { quest },
    };
  }

  /**
   * 获取进行中的任务
   */
  private handleGetActiveQuests(data: Record<string, unknown>): AgentResponse {
    const filterData = data as QuestFilter;
    
    let quests = Array.from(this.activeQuests)
      .map(id => this.quests.get(id))
      .filter((q): q is Quest => q !== undefined);

    if (filterData.type) {
      quests = quests.filter(q => q.type === filterData.type);
    }

    if (filterData.limit) {
      quests = quests.slice(0, filterData.limit);
    }

    return {
      success: true,
      data: { quests, count: quests.length },
    };
  }

  /**
   * 获取可接受的任务
   */
  private handleGetAvailableQuests(data: Record<string, unknown>): AgentResponse {
    const filterData = data as QuestFilter;
    
    let quests = Array.from(this.quests.values())
      .filter(q => q.status === 'available' && !this.activeQuests.has(q.id));

    if (filterData.type) {
      quests = quests.filter(q => q.type === filterData.type);
    }

    if (filterData.location) {
      // quests = quests.filter(q => q.location === filterData.location);
      // Note: location is not a property on Quest in the new type
    }

    if (filterData.giver) {
      // quests = quests.filter(q => q.giver === filterData.giver);
      // Note: giver is not a property on Quest in the new type
    }

    if (filterData.limit) {
      quests = quests.slice(0, filterData.limit);
    }

    return {
      success: true,
      data: { quests, count: quests.length },
    };
  }

  /**
   * 获取任务链
   */
  private handleGetQuestChain(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { chainId: string };

    if (!queryData.chainId) {
      return {
        success: false,
        error: 'Missing required field: chainId',
      };
    }

    const chain = this.questChains.get(queryData.chainId);
    if (!chain) {
      return {
        success: false,
        error: `Quest chain not found: ${queryData.chainId}`,
      };
    }

    const quests = chain.questIds
      .map(id => this.quests.get(id))
      .filter((q): q is Quest => q !== undefined);

    return {
      success: true,
      data: { chain, quests },
    };
  }

  /**
   * 检查前置条件
   */
  private handleCheckPrerequisites(data: Record<string, unknown>): AgentResponse {
    const checkData = data as { questId: string };

    if (!checkData.questId) {
      return {
        success: false,
        error: 'Missing required field: questId',
      };
    }

    const quest = this.quests.get(checkData.questId);
    if (!quest) {
      return {
        success: false,
        error: `Quest not found: ${checkData.questId}`,
      };
    }

    const result = this.checkPrerequisites(quest);

    return {
      success: true,
      data: result,
    };
  }

  // ==================== 日常任务刷新 ====================

  /**
   * 刷新日常任务
   */
  private handleRefreshDailyQuests(data: Record<string, unknown>): AgentResponse {
    const refreshData = data as {
      context: QuestGenerationParams['context'];
      count?: number;
    };

    const count = refreshData.count || 3;
    
    // 移除旧的日常任务
    for (const [id, quest] of this.quests) {
      if (quest.type === 'daily') {
        this.quests.delete(id);
        this.activeQuests.delete(id);
      }
    }

    // 生成新的日常任务
    const newQuests: Quest[] = [];
    for (let i = 0; i < count; i++) {
      const params: QuestGenerationParams = {
        type: 'daily',
        context: refreshData.context,
        difficulty: 'easy',
      };
      
      const quest = this.createQuest(params);
      this.quests.set(quest.id, quest);
      newQuests.push(quest);
    }

    this.addMemory(
      `Refreshed ${newQuests.length} daily quests`,
      'assistant',
      5,
      { questIds: newQuests.map(q => q.id) }
    );

    return {
      success: true,
      data: { quests: newQuests, count: newQuests.length },
    };
  }

  // ==================== 统计数据 ====================

  /**
   * 获取任务统计
   */
  private handleGetStatistics(): AgentResponse {
    const stats: QuestStatistics = {
      total: this.quests.size,
      byType: {
        main: 0,
        side: 0,
        daily: 0,
        hidden: 0,
        chain: 0,
      },
      byStatus: {
        locked: 0,
        available: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      },
      completedRewards: {
        experience: 0,
        currency: 0,
        items: [],
      },
    };

    for (const quest of this.quests.values()) {
      stats.byType[quest.type]++;
      stats.byStatus[quest.status]++;

      if (quest.status === 'completed') {
        if (quest.rewards.experience) {
          stats.completedRewards.experience += quest.rewards.experience;
        }
        if (quest.rewards.currency) {
          const gold = quest.rewards.currency.gold || 0;
          stats.completedRewards.currency += gold;
        }
        if (quest.rewards.items) {
          for (const item of quest.rewards.items) {
            stats.completedRewards.items.push(item.itemId);
          }
        }
      }
    }

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== 奖励分发 ====================

  /**
   * 分发奖励
   */
  private handleDistributeRewards(data: Record<string, unknown>): AgentResponse {
    const rewardData = data as {
      rewards: QuestRewards;
      source?: string;
    };

    if (!rewardData.rewards) {
      return {
        success: false,
        error: 'Missing rewards',
      };
    }

    const uiInstructions: UIInstruction[] = [];

    // 处理经验奖励
    if (rewardData.rewards.experience && rewardData.rewards.experience > 0) {
      uiInstructions.push({
        type: 'update',
        target: 'player_stats',
        action: 'add_experience',
        data: { amount: rewardData.rewards.experience },
        options: { priority: 'normal' },
      });
    }

    // 处理货币奖励
    if (rewardData.rewards.currency) {
      for (const [currency, amount] of Object.entries(rewardData.rewards.currency)) {
        if (amount > 0) {
          uiInstructions.push({
            type: 'update',
            target: 'player_stats',
            action: 'add_currency',
            data: { currency, amount },
            options: { priority: 'normal' },
          });
        }
      }
    }

    // 处理物品奖励
    if (rewardData.rewards.items) {
      for (const item of rewardData.rewards.items) {
        uiInstructions.push({
          type: 'update',
          target: 'inventory',
          action: 'add_item',
          data: { itemId: item.itemId, quantity: item.quantity },
          options: { priority: 'normal' },
        });
      }
    }

    // 处理声望奖励
    if (rewardData.rewards.reputation) {
      for (const [faction, amount] of Object.entries(rewardData.rewards.reputation)) {
        uiInstructions.push({
          type: 'update',
          target: 'reputation_panel',
          action: 'add_reputation',
          data: { faction, amount },
          options: { priority: 'low' },
        });
      }
    }

    // 添加奖励通知
    uiInstructions.push({
      type: 'notify',
      target: 'notification',
      action: 'rewards_received',
      data: { rewards: rewardData.rewards, source: rewardData.source },
      options: { duration: 4000, priority: 'high' },
    });

    return {
      success: true,
      data: { distributed: rewardData.rewards },
      uiInstructions,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 检查任务前置条件
   */
  private checkPrerequisites(quest: Quest): { met: boolean; missing: string[] } {
    if (!quest.prerequisites || quest.prerequisites.length === 0) {
      return { met: true, missing: [] };
    }

    const missing: string[] = [];
    for (const prereqId of quest.prerequisites) {
      if (!this.completedQuests.has(prereqId)) {
        missing.push(prereqId);
      }
    }

    return {
      met: missing.length === 0,
      missing,
    };
  }

  /**
   * 推进任务链
   */
  private advanceQuestChain(completedQuestId: string): Quest | null {
    for (const chain of this.questChains.values()) {
      const questIndex = chain.questIds.indexOf(completedQuestId);
      
      if (questIndex !== -1 && questIndex === chain.currentQuestIndex) {
        // 检查是否是链中最后一个任务
        if (questIndex < chain.questIds.length - 1) {
          chain.currentQuestIndex++;
          
          const nextQuestId = chain.questIds[chain.currentQuestIndex];
          const nextQuest = this.quests.get(nextQuestId);
          
          if (nextQuest) {
            nextQuest.status = 'available';
            return nextQuest;
          }
        } else {
          // 任务链完成
          chain.status = 'completed';
          
          // 分发任务链奖励
          if (chain.chainRewards && Object.keys(chain.chainRewards).length > 0) {
            this.addMemory(
              `Quest chain completed: ${chain.name}. Chain rewards ready for distribution.`,
              'assistant',
              9,
              { chainId: chain.id, rewards: chain.chainRewards }
            );
          }
        }
      }
    }

    return null;
  }

  /**
   * 获取目标数量
   */
  private getObjectiveCount(type: Quest['type'], difficulty: string): number {
    const baseCount: Record<QuestType, number> = {
      main: 3,
      side: 2,
      daily: 1,
      hidden: 2,
      chain: 3,
    };

    const difficultyModifier: Record<string, number> = {
      easy: 0,
      normal: 1,
      hard: 2,
      extreme: 3,
    };

    return baseCount[type] + (difficultyModifier[difficulty] || 0);
  }

  /**
   * 获取基础需求数量
   */
  private getBaseRequired(type: QuestObjective['type'], difficulty: string): number {
    const baseRequired: Record<QuestObjective['type'], number> = {
      kill: 5,
      collect: 3,
      talk: 1,
      explore: 1,
      custom: 1,
    };

    const difficultyMultiplier: Record<string, number> = {
      easy: 0.5,
      normal: 1,
      hard: 1.5,
      extreme: 2,
    };

    return Math.ceil(baseRequired[type] * (difficultyMultiplier[difficulty] || 1));
  }

  /**
   * 获取基础经验值
   */
  private getBaseExperience(type: Quest['type'], difficulty: string): number {
    const baseExp: Record<QuestType, number> = {
      main: 500,
      side: 200,
      daily: 100,
      hidden: 300,
      chain: 400,
    };

    const difficultyMultiplier: Record<string, number> = {
      easy: 0.8,
      normal: 1,
      hard: 1.5,
      extreme: 2.5,
    };

    return Math.floor(baseExp[type] * (difficultyMultiplier[difficulty] || 1));
  }

  /**
   * 获取基础货币
   */
  private getBaseCurrency(type: Quest['type'], difficulty: string): number {
    const baseCurrency: Record<QuestType, number> = {
      main: 100,
      side: 50,
      daily: 20,
      hidden: 80,
      chain: 70,
    };

    const difficultyMultiplier: Record<string, number> = {
      easy: 0.8,
      normal: 1,
      hard: 1.5,
      extreme: 2.5,
    };

    return Math.floor(baseCurrency[type] * (difficultyMultiplier[difficulty] || 1));
  }

  /**
   * 获取链式任务难度
   */
  private getChainDifficulty(index: number, total: number): 'easy' | 'normal' | 'hard' | 'extreme' {
    const progress = index / total;
    
    if (progress < 0.25) return 'easy';
    if (progress < 0.5) return 'normal';
    if (progress < 0.75) return 'hard';
    return 'extreme';
  }

  /**
   * 生成任务ID
   */
  private generateQuestId(): string {
    this.questIdCounter++;
    return `quest_${Date.now()}_${this.questIdCounter}`;
  }

  /**
   * 生成任务链ID
   */
  private generateChainId(): string {
    this.chainIdCounter++;
    return `chain_${Date.now()}_${this.chainIdCounter}`;
  }
}

export default QuestAgent;
