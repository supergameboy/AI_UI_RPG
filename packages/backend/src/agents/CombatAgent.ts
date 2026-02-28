import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Message,
  UIInstruction,
  StatusEffect,
} from '@ai-rpg/shared';
import { AgentType as AT } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// ==================== 战斗类型定义 ====================

/**
 * 战斗状态
 */
export enum CombatState {
  PREPARING = 'preparing',     // 准备中
  IN_PROGRESS = 'in_progress', // 进行中
  PLAYER_TURN = 'player_turn', // 玩家回合
  ENEMY_TURN = 'enemy_turn',   // 敌人回合
  ENDED = 'ended',             // 已结束
}

/**
 * 行动类型
 */
export enum ActionType {
  ATTACK = 'attack',     // 攻击
  SKILL = 'skill',       // 技能
  ITEM = 'item',         // 物品
  DEFEND = 'defend',     // 防御
  FLEE = 'flee',         // 逃跑
}

/**
 * 战斗AI难度
 */
export enum CombatDifficulty {
  EASY = 'easy',         // 简单
  NORMAL = 'normal',     // 普通
  HARD = 'hard',         // 困难
}

/**
 * 战斗单位类型
 */
export type CombatUnitType = 'player' | 'ally' | 'enemy';

/**
 * 战斗单位
 */
export interface CombatUnit {
  id: string;
  name: string;
  type: CombatUnitType;
  level: number;
  stats: {
    maxHp: number;
    currentHp: number;
    maxMp: number;
    currentMp: number;
    attack: number;
    defense: number;
    speed: number;
    luck: number;
  };
  skills: string[];
  statusEffects: StatusEffect[];
  isDefending: boolean;
  isAlive: boolean;
  position: { x: number; y: number };
  customData?: Record<string, unknown>;
}

/**
 * 战斗行动
 */
export interface CombatAction {
  id: string;
  actorId: string;
  type: ActionType;
  targetId?: string;
  targetIds?: string[];
  skillId?: string;
  itemId?: string;
  damage?: number;
  healing?: number;
  effects?: StatusEffect[];
  success: boolean;
  message: string;
  timestamp: number;
}

/**
 * 战斗回合记录
 */
export interface CombatTurn {
  turnNumber: number;
  phase: 'player' | 'enemy';
  actions: CombatAction[];
  timestamp: number;
}

/**
 * 战斗结果
 */
export interface CombatResult {
  combatId: string;
  victory: boolean;
  fled: boolean;
  totalTurns: number;
  duration: number;
  rewards?: {
    experience: number;
    gold: number;
    items: string[];
    skillPoints?: number;
  };
  statistics: {
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealing: number;
    criticalHits: number;
    skillsUsed: number;
    itemsUsed: number;
  };
}

/**
 * 战斗实例
 */
export interface CombatInstance {
  id: string;
  state: CombatState;
  difficulty: CombatDifficulty;
  turnOrder: string[];
  currentTurnIndex: number;
  turnNumber: number;
  units: Map<string, CombatUnit>;
  turnHistory: CombatTurn[];
  startTime: number;
  endTime?: number;
  result?: CombatResult;
  environment?: {
    terrain: string;
    weather?: string;
    modifiers?: Record<string, number>;
  };
}

/**
 * AI决策参数
 */
interface AIDecisionParams {
  actor: CombatUnit;
  allies: CombatUnit[];
  enemies: CombatUnit[];
  combat: CombatInstance;
}

/**
 * AI决策结果
 */
interface AIDecisionResult {
  action: ActionType;
  targetId?: string;
  skillId?: string;
  itemId?: string;
  priority: number;
  reason: string;
}

/**
 * 伤害计算结果
 */
interface DamageResult {
  baseDamage: number;
  finalDamage: number;
  isCritical: boolean;
  isBlocked: boolean;
  isEvaded: boolean;
  damageType: 'physical' | 'magical' | 'true';
  modifiers: string[];
}

/**
 * 战斗初始化参数
 */
export interface CombatInitParams {
  playerId: string;
  allies?: Array<{
    id: string;
    name: string;
    type: 'ally';
    stats: CombatUnit['stats'];
    skills?: string[];
  }>;
  enemies: Array<{
    id: string;
    name: string;
    type: 'enemy';
    level: number;
    stats: CombatUnit['stats'];
    skills?: string[];
    aiPattern?: string;
  }>;
  difficulty?: CombatDifficulty;
  environment?: CombatInstance['environment'];
}

// ==================== CombatAgent 实现 ====================

/**
 * 战斗管理智能体
 * 负责战斗流程管理、回合处理、战斗AI决策、战斗结果处理
 */
export class CombatAgent extends AgentBase {
  readonly type: AgentType = AT.COMBAT;

  readonly canCallAgents: AgentType[] = [
    AT.COORDINATOR,
    AT.NUMERICAL,
    AT.SKILL,
    AT.NPC_PARTY,
    AT.UI,
  ];

  readonly dataAccess: string[] = [
    'combat_instances',
    'combat_history',
    'character_stats',
    'character_skills',
    'enemy_templates',
    'item_effects',
    'status_effects',
  ];

  readonly systemPrompt = `你是战斗管理智能体，负责管理游戏中的所有战斗系统。

核心职责：
1. 战斗流程管理：初始化战斗、管理回合顺序、处理战斗状态转换
2. 回合制战斗：处理玩家和敌人的回合行动
3. 战斗AI决策：根据难度和情况为敌人做出智能决策
4. 战斗结果处理：计算战斗结果、奖励分配、经验计算

战斗状态：
- PREPARING: 准备中，战斗即将开始
- IN_PROGRESS: 战斗进行中
- PLAYER_TURN: 玩家回合
- ENEMY_TURN: 敌人回合
- ENDED: 战斗已结束

行动类型：
- ATTACK: 普通攻击
- SKILL: 使用技能
- ITEM: 使用物品
- DEFEND: 防御姿态
- FLEE: 尝试逃跑

AI难度：
- EASY: 简单AI，随机行动，偶尔做出次优选择
- NORMAL: 普通AI，平衡策略，考虑基本战术
- HARD: 困难AI，最优策略，针对玩家弱点

战斗原则：
- 保持战斗平衡性
- 合理的回合顺序（基于速度）
- 准确的伤害计算
- 公平的AI决策`;

  // 活跃战斗实例
  private combats: Map<string, CombatInstance> = new Map();

  // 玩家当前战斗映射
  private playerCombatMap: Map<string, string> = new Map();

  // ID计数器
  private combatIdCounter: number = 0;
  private actionIdCounter: number = 0;

  constructor() {
    super({
      temperature: 0.4,
      maxTokens: 4096,
    });
  }

  protected getAgentName(): string {
    return 'Combat Agent';
  }

  protected getAgentDescription(): string {
    return '战斗管理智能体，负责战斗流程管理、回合处理、战斗AI决策';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'combat_flow',
      'turn_management',
      'combat_ai',
      'result_processing',
      'damage_calculation',
      'status_effect_management',
      'reward_distribution',
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
        // 战斗流程管理
        case 'initiate_combat':
          return this.handleInitiateCombat(data);
        case 'start_combat':
          return this.handleStartCombat(data);
        case 'end_combat':
          return this.handleEndCombat(data);
        case 'get_combat':
          return this.handleGetCombat(data);
        case 'get_player_combat':
          return this.handleGetPlayerCombat(data);

        // 回合管理
        case 'execute_action':
          return await this.handleExecuteAction(data);
        case 'end_turn':
          return this.handleEndTurn(data);
        case 'get_turn_order':
          return this.handleGetTurnOrder(data);
        case 'get_current_turn':
          return this.handleGetCurrentTurn(data);

        // 战斗AI
        case 'ai_decide':
          return await this.handleAIDecide(data);
        case 'execute_ai_turn':
          return await this.handleExecuteAITurn(data);

        // 状态查询
        case 'get_combat_units':
          return this.handleGetCombatUnits(data);
        case 'get_unit':
          return this.handleGetUnit(data);
        case 'get_combat_history':
          return this.handleGetCombatHistory(data);

        // 伤害和效果
        case 'calculate_damage':
          return this.handleCalculateDamage(data);
        case 'apply_status_effect':
          return this.handleApplyStatusEffect(data);
        case 'remove_status_effect':
          return this.handleRemoveStatusEffect(data);

        // 战斗结果
        case 'get_result':
          return this.handleGetResult(data);
        case 'calculate_rewards':
          return this.handleCalculateRewards(data);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      console.error('[CombatAgent] Error processing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in CombatAgent',
      };
    }
  }

  // ==================== 战斗流程管理 ====================

  /**
   * 初始化战斗
   */
  private handleInitiateCombat(data: Record<string, unknown>): AgentResponse {
    const params = data as unknown as CombatInitParams;

    if (!params.playerId || !params.enemies || params.enemies.length === 0) {
      return {
        success: false,
        error: 'Missing required fields: playerId, enemies',
      };
    }

    // 检查玩家是否已在战斗中
    const existingCombatId = this.playerCombatMap.get(params.playerId);
    if (existingCombatId) {
      return {
        success: false,
        error: 'Player is already in combat',
        data: { combatId: existingCombatId },
      };
    }

    const combatId = this.generateCombatId();
    const now = Date.now();

    const combat: CombatInstance = {
      id: combatId,
      state: CombatState.PREPARING,
      difficulty: params.difficulty || CombatDifficulty.NORMAL,
      turnOrder: [],
      currentTurnIndex: 0,
      turnNumber: 0,
      units: new Map(),
      turnHistory: [],
      startTime: now,
      environment: params.environment,
    };

    // 添加玩家单位
    const playerUnit: CombatUnit = {
      id: params.playerId,
      name: 'Player',
      type: 'player',
      level: 1,
      stats: {
        maxHp: 100,
        currentHp: 100,
        maxMp: 50,
        currentMp: 50,
        attack: 10,
        defense: 5,
        speed: 10,
        luck: 5,
      },
      skills: [],
      statusEffects: [],
      isDefending: false,
      isAlive: true,
      position: { x: 0, y: 0 },
    };
    combat.units.set(params.playerId, playerUnit);

    // 添加盟友单位
    if (params.allies) {
      for (const ally of params.allies) {
        const allyUnit: CombatUnit = {
          id: ally.id,
          name: ally.name,
          type: 'ally',
          level: 1,
          stats: ally.stats,
          skills: ally.skills || [],
          statusEffects: [],
          isDefending: false,
          isAlive: true,
          position: { x: 0, y: 0 },
        };
        combat.units.set(ally.id, allyUnit);
      }
    }

    // 添加敌人单位
    for (const enemy of params.enemies) {
      const enemyUnit: CombatUnit = {
        id: enemy.id,
        name: enemy.name,
        type: 'enemy',
        level: enemy.level,
        stats: enemy.stats,
        skills: enemy.skills || [],
        statusEffects: [],
        isDefending: false,
        isAlive: true,
        position: { x: 0, y: 0 },
        customData: { aiPattern: enemy.aiPattern },
      };
      combat.units.set(enemy.id, enemyUnit);
    }

    // 计算回合顺序（基于速度）
    combat.turnOrder = this.calculateTurnOrder(combat);

    this.combats.set(combatId, combat);
    this.playerCombatMap.set(params.playerId, combatId);

    this.addMemory(
      `Initiated combat ${combatId} with ${params.enemies.length} enemies`,
      'assistant',
      7,
      { combatId, enemyCount: params.enemies.length }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'combat_ui',
        action: 'initiate',
        data: {
          combatId,
          enemies: params.enemies,
          environment: params.environment,
        },
        options: { priority: 'critical' },
      },
    ];

    return {
      success: true,
      data: { combatId, combat: this.serializeCombat(combat) },
      uiInstructions,
    };
  }

  /**
   * 开始战斗
   */
  private handleStartCombat(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    if (combat.state !== CombatState.PREPARING) {
      return {
        success: false,
        error: 'Combat is not in preparing state',
      };
    }

    combat.state = CombatState.IN_PROGRESS;
    combat.turnNumber = 1;

    // 确定第一个行动的单位
    const firstUnitId = combat.turnOrder[0];
    const firstUnit = combat.units.get(firstUnitId);
    if (firstUnit) {
      combat.state = firstUnit.type === 'player' || firstUnit.type === 'ally'
        ? CombatState.PLAYER_TURN
        : CombatState.ENEMY_TURN;
    }

    this.addMemory(
      `Combat ${inputData.combatId} started. Turn order: ${combat.turnOrder.join(', ')}`,
      'assistant',
      6,
      { combatId: inputData.combatId }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'combat_ui',
        action: 'start',
        data: {
          turnOrder: combat.turnOrder,
          currentTurn: combat.turnOrder[combat.currentTurnIndex],
          turnNumber: combat.turnNumber,
        },
        options: { priority: 'critical' },
      },
    ];

    return {
      success: true,
      data: {
        combat: this.serializeCombat(combat),
        currentUnit: firstUnitId,
        phase: combat.state,
      },
      uiInstructions,
    };
  }

  /**
   * 结束战斗
   */
  private handleEndCombat(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      combatId: string;
      victory?: boolean;
      fled?: boolean;
    };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    combat.state = CombatState.ENDED;
    combat.endTime = Date.now();

    // 计算战斗结果
    const result = this.calculateCombatResult(combat, inputData.victory, inputData.fled);
    combat.result = result;

    // 清理玩家映射
    for (const [unitId, unit] of combat.units) {
      if (unit.type === 'player') {
        this.playerCombatMap.delete(unitId);
      }
    }

    this.addMemory(
      `Combat ${inputData.combatId} ended. Victory: ${result.victory}, Turns: ${result.totalTurns}`,
      'assistant',
      8,
      { combatId: inputData.combatId, result }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'combat_result',
        action: 'display',
        data: { result },
        options: { priority: 'critical' },
      },
      {
        type: 'hide',
        target: 'combat_ui',
        action: 'end',
        data: {},
        options: { duration: 500 },
      },
    ];

    return {
      success: true,
      data: { result },
      uiInstructions,
    };
  }

  /**
   * 获取战斗实例
   */
  private handleGetCombat(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };
    const combat = this.combats.get(inputData.combatId);

    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    return {
      success: true,
      data: { combat: this.serializeCombat(combat) },
    };
  }

  /**
   * 获取玩家当前战斗
   */
  private handleGetPlayerCombat(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { playerId: string };
    const combatId = this.playerCombatMap.get(inputData.playerId);

    if (!combatId) {
      return {
        success: true,
        data: { inCombat: false },
      };
    }

    const combat = this.combats.get(combatId);
    return {
      success: true,
      data: {
        inCombat: true,
        combatId,
        combat: combat ? this.serializeCombat(combat) : null,
      },
    };
  }

  // ==================== 回合管理 ====================

  /**
   * 执行行动
   */
  private async handleExecuteAction(data: Record<string, unknown>): Promise<AgentResponse> {
    const inputData = data as {
      combatId: string;
      actorId: string;
      action: ActionType;
      targetId?: string;
      skillId?: string;
      itemId?: string;
    };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const actor = combat.units.get(inputData.actorId);
    if (!actor || !actor.isAlive) {
      return {
        success: false,
        error: 'Actor not found or is dead',
      };
    }

    // 验证是否是当前行动单位
    const currentUnitId = combat.turnOrder[combat.currentTurnIndex];
    if (currentUnitId !== inputData.actorId) {
      return {
        success: false,
        error: 'Not this unit\'s turn',
      };
    }

    // 重置防御状态
    actor.isDefending = false;

    let action: CombatAction;

    switch (inputData.action) {
      case ActionType.ATTACK:
        action = this.executeAttack(combat, actor, inputData.targetId);
        break;
      case ActionType.SKILL:
        action = await this.executeSkill(combat, actor, inputData.targetId, inputData.skillId);
        break;
      case ActionType.ITEM:
        action = this.executeItem(combat, actor, inputData.targetId, inputData.itemId);
        break;
      case ActionType.DEFEND:
        action = this.executeDefend(actor);
        break;
      case ActionType.FLEE:
        action = this.executeFlee(combat, actor);
        break;
      default:
        return {
          success: false,
          error: `Unknown action type: ${inputData.action}`,
        };
    }

    // 记录行动
    this.recordAction(combat, action);

    // 检查战斗是否结束
    const endCheck = this.checkCombatEnd(combat);
    if (endCheck.ended) {
      return this.handleEndCombat({
        combatId: inputData.combatId,
        victory: endCheck.victory,
        fled: action.type === ActionType.FLEE && action.success,
      } as Record<string, unknown>);
    }

    this.addMemory(
      `${actor.name} executed ${inputData.action}${inputData.targetId ? ` on ${inputData.targetId}` : ''}`,
      'assistant',
      5,
      { combatId: inputData.combatId, action: inputData.action }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'animate',
        target: 'combat_ui',
        action: 'execute_action',
        data: { action, actor: this.serializeUnit(actor) },
        options: { duration: 1000 },
      },
    ];

    return {
      success: true,
      data: { action, combat: this.serializeCombat(combat) },
      uiInstructions,
    };
  }

  /**
   * 结束回合
   */
  private handleEndTurn(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    // 处理回合结束效果
    this.processEndOfTurnEffects(combat);

    // 移动到下一个单位
    combat.currentTurnIndex++;

    // 检查是否完成一轮
    if (combat.currentTurnIndex >= combat.turnOrder.length) {
      combat.currentTurnIndex = 0;
      combat.turnNumber++;

      // 重新计算回合顺序（速度可能改变）
      combat.turnOrder = this.calculateTurnOrder(combat);
    }

    // 跳过死亡单位
    while (combat.currentTurnIndex < combat.turnOrder.length) {
      const unitId = combat.turnOrder[combat.currentTurnIndex];
      const unit = combat.units.get(unitId);
      if (unit && unit.isAlive) {
        break;
      }
      combat.currentTurnIndex++;
    }

    // 更新战斗状态
    const currentUnit = combat.units.get(combat.turnOrder[combat.currentTurnIndex]);
    if (currentUnit) {
      combat.state = currentUnit.type === 'enemy'
        ? CombatState.ENEMY_TURN
        : CombatState.PLAYER_TURN;
    }

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'combat_ui',
        action: 'next_turn',
        data: {
          currentUnit: combat.turnOrder[combat.currentTurnIndex],
          turnNumber: combat.turnNumber,
          phase: combat.state,
        },
        options: { priority: 'high' },
      },
    ];

    return {
      success: true,
      data: {
        combat: this.serializeCombat(combat),
        currentUnit: combat.turnOrder[combat.currentTurnIndex],
        phase: combat.state,
      },
      uiInstructions,
    };
  }

  /**
   * 获取回合顺序
   */
  private handleGetTurnOrder(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };
    const combat = this.combats.get(inputData.combatId);

    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const turnOrderWithDetails = combat.turnOrder.map(unitId => {
      const unit = combat.units.get(unitId);
      return unit ? { id: unitId, name: unit.name, type: unit.type } : null;
    }).filter((item): item is { id: string; name: string; type: CombatUnitType } => item !== null);

    return {
      success: true,
      data: {
        turnOrder: turnOrderWithDetails,
        currentIndex: combat.currentTurnIndex,
      },
    };
  }

  /**
   * 获取当前回合信息
   */
  private handleGetCurrentTurn(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };
    const combat = this.combats.get(inputData.combatId);

    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const currentUnitId = combat.turnOrder[combat.currentTurnIndex];
    const currentUnit = combat.units.get(currentUnitId);

    return {
      success: true,
      data: {
        turnNumber: combat.turnNumber,
        currentUnitId,
        currentUnit: currentUnit ? this.serializeUnit(currentUnit) : null,
        phase: combat.state,
      },
    };
  }

  // ==================== 战斗AI ====================

  /**
   * AI决策
   */
  private async handleAIDecide(data: Record<string, unknown>): Promise<AgentResponse> {
    const inputData = data as {
      combatId: string;
      actorId: string;
    };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const actor = combat.units.get(inputData.actorId);
    if (!actor || !actor.isAlive) {
      return {
        success: false,
        error: 'Actor not found or is dead',
      };
    }

    // 获取盟友和敌人列表
    const allies = this.getAllies(combat, actor);
    const enemies = this.getEnemies(combat, actor);

    // 根据难度进行决策
    const decision = await this.makeAIDecision({
      actor,
      allies,
      enemies,
      combat,
    });

    return {
      success: true,
      data: { decision },
    };
  }

  /**
   * 执行AI回合
   */
  private async handleExecuteAITurn(data: Record<string, unknown>): Promise<AgentResponse> {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const currentUnitId = combat.turnOrder[combat.currentTurnIndex];
    const currentUnit = combat.units.get(currentUnitId);

    if (!currentUnit || currentUnit.type !== 'enemy') {
      return {
        success: false,
        error: 'Current unit is not an enemy',
      };
    }

    // AI决策
    const allies = this.getAllies(combat, currentUnit);
    const enemies = this.getEnemies(combat, currentUnit);

    const decision = await this.makeAIDecision({
      actor: currentUnit,
      allies,
      enemies,
      combat,
    });

    // 执行决策
    const actionResult = await this.handleExecuteAction({
      combatId: inputData.combatId,
      actorId: currentUnitId,
      action: decision.action,
      targetId: decision.targetId,
      skillId: decision.skillId,
      itemId: decision.itemId,
    });

    return actionResult;
  }

  /**
   * AI决策逻辑
   */
  private async makeAIDecision(params: AIDecisionParams): Promise<AIDecisionResult> {
    const { actor, allies, enemies, combat } = params;

    // 根据难度调整决策策略
    switch (combat.difficulty) {
      case CombatDifficulty.EASY:
        return this.makeEasyAIDecision(actor, allies, enemies);
      case CombatDifficulty.HARD:
        return await this.makeHardAIDecision(actor, allies, enemies, combat);
      case CombatDifficulty.NORMAL:
      default:
        return this.makeNormalAIDecision(actor, allies, enemies);
    }
  }

  /**
   * 简单AI决策（随机行动）
   */
  private makeEasyAIDecision(
    _actor: CombatUnit,
    _allies: CombatUnit[],
    enemies: CombatUnit[]
  ): AIDecisionResult {
    const aliveEnemies = enemies.filter(e => e.isAlive);
    const random = Math.random();

    // 30% 概率防御
    if (random < 0.3) {
      return {
        action: ActionType.DEFEND,
        priority: 1,
        reason: 'Random defensive action',
      };
    }

    // 随机攻击一个敌人
    if (aliveEnemies.length > 0) {
      const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      return {
        action: ActionType.ATTACK,
        targetId: target.id,
        priority: 2,
        reason: 'Random attack on enemy',
      };
    }

    return {
      action: ActionType.DEFEND,
      priority: 0,
      reason: 'No valid targets',
    };
  }

  /**
   * 普通AI决策（平衡策略）
   */
  private makeNormalAIDecision(
    actor: CombatUnit,
    _allies: CombatUnit[],
    enemies: CombatUnit[]
  ): AIDecisionResult {
    const aliveEnemies = enemies.filter(e => e.isAlive);

    // 低血量时考虑防御
    if (actor.stats.currentHp < actor.stats.maxHp * 0.3) {
      // 有治疗技能时优先治疗自己
      if (actor.skills.length > 0) {
        return {
          action: ActionType.SKILL,
          skillId: actor.skills[0],
          targetId: actor.id,
          priority: 3,
          reason: 'Low HP, using skill',
        };
      }
      return {
        action: ActionType.DEFEND,
        priority: 2,
        reason: 'Low HP, defending',
      };
    }

    // 优先攻击血量最低的敌人
    if (aliveEnemies.length > 0) {
      const weakestEnemy = aliveEnemies.reduce((weakest, current) =>
        current.stats.currentHp < weakest.stats.currentHp ? current : weakest
      );

      return {
        action: ActionType.ATTACK,
        targetId: weakestEnemy.id,
        priority: 3,
        reason: 'Attacking weakest enemy',
      };
    }

    return {
      action: ActionType.DEFEND,
      priority: 0,
      reason: 'No valid targets',
    };
  }

  /**
   * 困难AI决策（最优策略）
   */
  private async makeHardAIDecision(
    actor: CombatUnit,
    allies: CombatUnit[],
    enemies: CombatUnit[],
    _combat: CombatInstance
  ): Promise<AIDecisionResult> {
    const aliveEnemies = enemies.filter(e => e.isAlive);

    // 使用LLM进行战术分析
    const prompt: Message[] = [
      {
        role: 'user',
        content: `作为战斗AI，分析当前战斗情况并做出最优决策。

我方单位：
- ${actor.name}: HP ${actor.stats.currentHp}/${actor.stats.maxHp}, MP ${actor.stats.currentMp}/${actor.stats.maxMp}
- 技能: ${actor.skills.join(', ') || '无'}

敌方单位：
${aliveEnemies.map(e => `- ${e.name}: HP ${e.stats.currentHp}/${e.stats.maxHp}`).join('\n')}

请分析并返回JSON格式的决策：
{
  "action": "attack|skill|defend|flee",
  "targetId": "目标ID（如果需要）",
  "skillId": "技能ID（如果使用技能）",
  "reason": "决策理由"
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.3,
        maxTokens: 300,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]) as {
          action: string;
          targetId?: string;
          skillId?: string;
          reason: string;
        };

        return {
          action: decision.action as ActionType,
          targetId: decision.targetId,
          skillId: decision.skillId,
          priority: 5,
          reason: decision.reason,
        };
      }
    } catch (error) {
      console.error('[CombatAgent] LLM decision error:', error);
    }

    // 降级到普通AI
    return this.makeNormalAIDecision(actor, allies, enemies);
  }

  // ==================== 战斗行动执行 ====================

  /**
   * 执行攻击
   */
  private executeAttack(
    combat: CombatInstance,
    actor: CombatUnit,
    targetId?: string
  ): CombatAction {
    const actionId = this.generateActionId();

    if (!targetId) {
      return {
        id: actionId,
        actorId: actor.id,
        type: ActionType.ATTACK,
        success: false,
        message: 'No target specified',
        timestamp: Date.now(),
      };
    }

    const target = combat.units.get(targetId);
    if (!target || !target.isAlive) {
      return {
        id: actionId,
        actorId: actor.id,
        type: ActionType.ATTACK,
        targetId,
        success: false,
        message: 'Invalid target',
        timestamp: Date.now(),
      };
    }

    // 计算伤害
    const damageResult = this.calculatePhysicalDamage(actor, target);

    // 应用伤害
    if (!damageResult.isEvaded && !damageResult.isBlocked) {
      target.stats.currentHp = Math.max(0, target.stats.currentHp - damageResult.finalDamage);
      if (target.stats.currentHp === 0) {
        target.isAlive = false;
      }
    }

    return {
      id: actionId,
      actorId: actor.id,
      type: ActionType.ATTACK,
      targetId,
      damage: damageResult.finalDamage,
      success: !damageResult.isEvaded && !damageResult.isBlocked,
      message: this.generateAttackMessage(actor, target, damageResult),
      timestamp: Date.now(),
    };
  }

  /**
   * 执行技能
   */
  private async executeSkill(
    combat: CombatInstance,
    actor: CombatUnit,
    targetId?: string,
    skillId?: string
  ): Promise<CombatAction> {
    const actionId = this.generateActionId();

    if (!skillId) {
      return {
        id: actionId,
        actorId: actor.id,
        type: ActionType.SKILL,
        success: false,
        message: 'No skill specified',
        timestamp: Date.now(),
      };
    }

    // 调用SKILL agent获取技能效果
    const skillResponse = await this.sendMessage(
      AT.SKILL,
      'use_skill',
      {
        skillId,
        characterId: actor.id,
        targetId,
        context: { combatId: combat.id },
      },
      { requiresResponse: true }
    );

    const skillData = skillResponse.payload.data as Record<string, unknown>;
    const success = skillResponse.type !== 'error';

    if (success && targetId) {
      const target = combat.units.get(targetId);
      if (target && skillData.effects) {
        // 应用技能效果
        for (const effect of skillData.effects as Array<{ type: string; actualValue: number }>) {
          if (effect.type === 'damage') {
            target.stats.currentHp = Math.max(0, target.stats.currentHp - effect.actualValue);
            if (target.stats.currentHp === 0) {
              target.isAlive = false;
            }
          } else if (effect.type === 'heal') {
            target.stats.currentHp = Math.min(
              target.stats.maxHp,
              target.stats.currentHp + effect.actualValue
            );
          }
        }
      }
    }

    return {
      id: actionId,
      actorId: actor.id,
      type: ActionType.SKILL,
      targetId,
      skillId,
      damage: skillData.effects ? (skillData.effects as Array<{ actualValue: number }>)[0]?.actualValue : 0,
      success,
      message: success ? `Used skill ${skillId}` : 'Failed to use skill',
      timestamp: Date.now(),
    };
  }

  /**
   * 执行物品使用
   */
  private executeItem(
    _combat: CombatInstance,
    actor: CombatUnit,
    targetId?: string,
    itemId?: string
  ): CombatAction {
    const actionId = this.generateActionId();

    if (!itemId) {
      return {
        id: actionId,
        actorId: actor.id,
        type: ActionType.ITEM,
        success: false,
        message: 'No item specified',
        timestamp: Date.now(),
      };
    }

    // TODO: 调用INVENTORY agent处理物品使用
    return {
      id: actionId,
      actorId: actor.id,
      type: ActionType.ITEM,
      targetId: targetId || actor.id,
      itemId,
      success: true,
      message: `Used item ${itemId}`,
      timestamp: Date.now(),
    };
  }

  /**
   * 执行防御
   */
  private executeDefend(actor: CombatUnit): CombatAction {
    actor.isDefending = true;

    return {
      id: this.generateActionId(),
      actorId: actor.id,
      type: ActionType.DEFEND,
      success: true,
      message: `${actor.name} takes a defensive stance`,
      timestamp: Date.now(),
    };
  }

  /**
   * 执行逃跑
   */
  private executeFlee(_combat: CombatInstance, actor: CombatUnit): CombatAction {
    // 逃跑成功率基于速度和运气
    const fleeChance = 0.3 + (actor.stats.speed + actor.stats.luck) * 0.02;
    const success = Math.random() < fleeChance;

    return {
      id: this.generateActionId(),
      actorId: actor.id,
      type: ActionType.FLEE,
      success,
      message: success ? `${actor.name} fled from battle!` : `${actor.name} failed to flee!`,
      timestamp: Date.now(),
    };
  }

  // ==================== 伤害计算 ====================

  /**
   * 计算物理伤害
   */
  private calculatePhysicalDamage(attacker: CombatUnit, defender: CombatUnit): DamageResult {
    const baseDamage = attacker.stats.attack;
    let finalDamage = baseDamage;

    const isCritical = Math.random() < attacker.stats.luck * 0.01;
    const isEvaded = Math.random() < defender.stats.speed * 0.005;
    const isBlocked = defender.isDefending;

    const modifiers: string[] = [];

    if (isCritical) {
      finalDamage *= 1.5;
      modifiers.push('Critical Hit');
    }

    if (!isEvaded && !isBlocked) {
      finalDamage = Math.max(1, finalDamage - defender.stats.defense);
    }

    if (isBlocked) {
      finalDamage *= 0.5;
      modifiers.push('Blocked');
    }

    return {
      baseDamage,
      finalDamage: Math.floor(finalDamage),
      isCritical,
      isBlocked,
      isEvaded,
      damageType: 'physical',
      modifiers,
    };
  }

  /**
   * 处理伤害计算请求
   */
  private handleCalculateDamage(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      attackerId: string;
      defenderId: string;
      combatId: string;
      damageType?: 'physical' | 'magical' | 'true';
    };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const attacker = combat.units.get(inputData.attackerId);
    const defender = combat.units.get(inputData.defenderId);

    if (!attacker || !defender) {
      return {
        success: false,
        error: 'Attacker or defender not found',
      };
    }

    const damageResult = inputData.damageType === 'magical'
      ? this.calculateMagicalDamage(attacker, defender)
      : this.calculatePhysicalDamage(attacker, defender);

    return {
      success: true,
      data: { damageResult },
    };
  }

  /**
   * 计算魔法伤害
   */
  private calculateMagicalDamage(attacker: CombatUnit, defender: CombatUnit): DamageResult {
    const baseDamage = attacker.stats.attack * 1.2; // 魔法伤害略高
    let finalDamage = baseDamage;

    const isCritical = Math.random() < attacker.stats.luck * 0.008;
    const isEvaded = false; // 魔法不可闪避
    const isBlocked = defender.isDefending;

    const modifiers: string[] = [];

    if (isCritical) {
      finalDamage *= 1.3;
      modifiers.push('Critical Hit');
    }

    if (isBlocked) {
      finalDamage *= 0.7;
      modifiers.push('Partially Blocked');
    }

    return {
      baseDamage,
      finalDamage: Math.floor(finalDamage),
      isCritical,
      isBlocked,
      isEvaded,
      damageType: 'magical',
      modifiers,
    };
  }

  // ==================== 状态效果 ====================

  /**
   * 应用状态效果
   */
  private handleApplyStatusEffect(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      combatId: string;
      unitId: string;
      effect: StatusEffect;
    };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const unit = combat.units.get(inputData.unitId);
    if (!unit) {
      return {
        success: false,
        error: `Unit not found: ${inputData.unitId}`,
      };
    }

    unit.statusEffects.push(inputData.effect);

    return {
      success: true,
      data: { unit: this.serializeUnit(unit) },
    };
  }

  /**
   * 移除状态效果
   */
  private handleRemoveStatusEffect(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      combatId: string;
      unitId: string;
      effectId: string;
    };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const unit = combat.units.get(inputData.unitId);
    if (!unit) {
      return {
        success: false,
        error: `Unit not found: ${inputData.unitId}`,
      };
    }

    unit.statusEffects = unit.statusEffects.filter(e => e.id !== inputData.effectId);

    return {
      success: true,
      data: { unit: this.serializeUnit(unit) },
    };
  }

  /**
   * 处理回合结束效果
   */
  private processEndOfTurnEffects(combat: CombatInstance): void {
    for (const unit of combat.units.values()) {
      if (!unit.isAlive) continue;

      // 处理持续伤害/治疗
      for (const effect of unit.statusEffects) {
        effect.remainingTurns--;

        // 应用效果
        for (const modifier of effect.effects) {
          if (modifier.type === 'flat') {
            if (modifier.attribute === 'hp') {
              unit.stats.currentHp = Math.max(
                0,
                Math.min(unit.stats.maxHp, unit.stats.currentHp + modifier.modifier)
              );
            } else if (modifier.attribute === 'mp') {
              unit.stats.currentMp = Math.max(
                0,
                Math.min(unit.stats.maxMp, unit.stats.currentMp + modifier.modifier)
              );
            }
          }
        }

        // 移除过期效果
        if (effect.remainingTurns <= 0) {
          unit.statusEffects = unit.statusEffects.filter(e => e.id !== effect.id);
        }
      }

      // 检查死亡
      if (unit.stats.currentHp === 0) {
        unit.isAlive = false;
      }
    }
  }

  // ==================== 状态查询 ====================

  /**
   * 获取战斗单位
   */
  private handleGetCombatUnits(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const units = Array.from(combat.units.values()).map(u => this.serializeUnit(u));

    return {
      success: true,
      data: { units },
    };
  }

  /**
   * 获取单个单位
   */
  private handleGetUnit(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string; unitId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const unit = combat.units.get(inputData.unitId);
    if (!unit) {
      return {
        success: false,
        error: `Unit not found: ${inputData.unitId}`,
      };
    }

    return {
      success: true,
      data: { unit: this.serializeUnit(unit) },
    };
  }

  /**
   * 获取战斗历史
   */
  private handleGetCombatHistory(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    return {
      success: true,
      data: { history: combat.turnHistory },
    };
  }

  /**
   * 获取战斗结果
   */
  private handleGetResult(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    if (!combat.result) {
      return {
        success: false,
        error: 'Combat has not ended yet',
      };
    }

    return {
      success: true,
      data: { result: combat.result },
    };
  }

  /**
   * 计算奖励
   */
  private handleCalculateRewards(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { combatId: string };

    const combat = this.combats.get(inputData.combatId);
    if (!combat) {
      return {
        success: false,
        error: `Combat not found: ${inputData.combatId}`,
      };
    }

    const rewards = this.calculateRewardsFromCombat(combat);

    return {
      success: true,
      data: { rewards },
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 计算回合顺序
   */
  private calculateTurnOrder(combat: CombatInstance): string[] {
    const units = Array.from(combat.units.values()).filter(u => u.isAlive);

    // 按速度排序，速度相同则随机
    return units
      .sort((a, b) => {
        const speedDiff = b.stats.speed - a.stats.speed;
        if (speedDiff !== 0) return speedDiff;
        return Math.random() - 0.5;
      })
      .map(u => u.id);
  }

  /**
   * 检查战斗是否结束
   */
  private checkCombatEnd(combat: CombatInstance): { ended: boolean; victory: boolean } {
    const playerUnits = Array.from(combat.units.values()).filter(
      u => (u.type === 'player' || u.type === 'ally') && u.isAlive
    );
    const enemyUnits = Array.from(combat.units.values()).filter(
      u => u.type === 'enemy' && u.isAlive
    );

    if (playerUnits.length === 0) {
      return { ended: true, victory: false };
    }

    if (enemyUnits.length === 0) {
      return { ended: true, victory: true };
    }

    return { ended: false, victory: false };
  }

  /**
   * 计算战斗结果
   */
  private calculateCombatResult(
    combat: CombatInstance,
    victory?: boolean,
    fled?: boolean
  ): CombatResult {
    const endCheck = this.checkCombatEnd(combat);
    const isVictory = victory ?? endCheck.victory;

    // 计算统计数据
    let totalDamageDealt = 0;
    let totalDamageTaken = 0;
    let totalHealing = 0;
    let criticalHits = 0;
    let skillsUsed = 0;
    let itemsUsed = 0;

    for (const turn of combat.turnHistory) {
      for (const action of turn.actions) {
        if (action.type === ActionType.SKILL) skillsUsed++;
        if (action.type === ActionType.ITEM) itemsUsed++;
        if (action.damage) {
          const actor = combat.units.get(action.actorId);
          if (actor?.type === 'player' || actor?.type === 'ally') {
            totalDamageDealt += action.damage;
          } else {
            totalDamageTaken += action.damage;
          }
        }
        if (action.healing) totalHealing += action.healing;
      }
    }

    const result: CombatResult = {
      combatId: combat.id,
      victory: isVictory,
      fled: fled ?? false,
      totalTurns: combat.turnNumber,
      duration: (combat.endTime || Date.now()) - combat.startTime,
      statistics: {
        totalDamageDealt,
        totalDamageTaken,
        totalHealing,
        criticalHits,
        skillsUsed,
        itemsUsed,
      },
    };

    // 计算奖励
    if (isVictory && !fled) {
      result.rewards = this.calculateRewardsFromCombat(combat);
    }

    return result;
  }

  /**
   * 计算奖励
   */
  private calculateRewardsFromCombat(combat: CombatInstance): CombatResult['rewards'] {
    const enemies = Array.from(combat.units.values()).filter(u => u.type === 'enemy');

    const experience = enemies.reduce((sum, e) => sum + e.level * 10, 0);
    const gold = enemies.reduce((sum, e) => sum + e.level * 5, 0);

    return {
      experience,
      gold,
      items: [],
      skillPoints: Math.floor(experience / 100),
    };
  }

  /**
   * 获取盟友列表
   */
  private getAllies(combat: CombatInstance, unit: CombatUnit): CombatUnit[] {
    return Array.from(combat.units.values()).filter(
      u => u.isAlive && u.id !== unit.id && u.type === unit.type
    );
  }

  /**
   * 获取敌人列表
   */
  private getEnemies(combat: CombatInstance, unit: CombatUnit): CombatUnit[] {
    const enemyType: CombatUnitType = unit.type === 'enemy' ? 'player' : 'enemy';
    return Array.from(combat.units.values()).filter(
      u => u.isAlive && (u.type === enemyType || (unit.type !== 'enemy' && u.type === 'enemy'))
    );
  }

  /**
   * 记录行动
   */
  private recordAction(combat: CombatInstance, action: CombatAction): void {
    let currentTurn = combat.turnHistory[combat.turnHistory.length - 1];

    if (!currentTurn || currentTurn.turnNumber !== combat.turnNumber) {
      currentTurn = {
        turnNumber: combat.turnNumber,
        phase: combat.state === CombatState.PLAYER_TURN ? 'player' : 'enemy',
        actions: [],
        timestamp: Date.now(),
      };
      combat.turnHistory.push(currentTurn);
    }

    currentTurn.actions.push(action);
  }

  /**
   * 生成攻击消息
   */
  private generateAttackMessage(
    attacker: CombatUnit,
    target: CombatUnit,
    damage: DamageResult
  ): string {
    if (damage.isEvaded) {
      return `${target.name} evaded ${attacker.name}'s attack!`;
    }

    if (damage.isBlocked) {
      return `${attacker.name} attacked ${target.name} for ${damage.finalDamage} damage (blocked)!`;
    }

    if (damage.isCritical) {
      return `${attacker.name} critically hit ${target.name} for ${damage.finalDamage} damage!`;
    }

    return `${attacker.name} attacked ${target.name} for ${damage.finalDamage} damage.`;
  }

  /**
   * 序列化战斗实例
   */
  private serializeCombat(combat: CombatInstance): Record<string, unknown> {
    return {
      id: combat.id,
      state: combat.state,
      difficulty: combat.difficulty,
      turnOrder: combat.turnOrder,
      currentTurnIndex: combat.currentTurnIndex,
      turnNumber: combat.turnNumber,
      units: Array.from(combat.units.entries()).map(([id, unit]) => [id, this.serializeUnit(unit)]),
      startTime: combat.startTime,
      endTime: combat.endTime,
      result: combat.result,
      environment: combat.environment,
    };
  }

  /**
   * 序列化单位
   */
  private serializeUnit(unit: CombatUnit): Record<string, unknown> {
    return {
      id: unit.id,
      name: unit.name,
      type: unit.type,
      level: unit.level,
      stats: unit.stats,
      skills: unit.skills,
      statusEffects: unit.statusEffects,
      isDefending: unit.isDefending,
      isAlive: unit.isAlive,
      position: unit.position,
    };
  }

  /**
   * 生成战斗ID
   */
  private generateCombatId(): string {
    this.combatIdCounter++;
    return `combat_${Date.now()}_${this.combatIdCounter}`;
  }

  /**
   * 生成行动ID
   */
  private generateActionId(): string {
    this.actionIdCounter++;
    return `action_${Date.now()}_${this.actionIdCounter}`;
  }
}

export default CombatAgent;

// 导出单例工厂
let combatAgentInstance: CombatAgent | null = null;

export function getCombatAgent(config?: Partial<import('@ai-rpg/shared').AgentConfig>): CombatAgent {
  if (!combatAgentInstance) {
    combatAgentInstance = new CombatAgent();
    if (config) {
      combatAgentInstance.updateConfig(config);
    }
  }
  return combatAgentInstance;
}
