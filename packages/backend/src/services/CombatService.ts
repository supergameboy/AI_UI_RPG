/**
 * 战斗服务
 * 提供战斗管理的业务逻辑层，封装 CombatAgent 的功能
 */

import { getCombatAgent } from '../agents/CombatAgent';
import type {
  CombatInitParams,
  CombatInstanceData,
  CombatAction,
  CombatResult,
  ActionType,
  CombatState,
  CombatUnit,
  AgentResponse,
  AgentMessage,
  MessagePriority,
} from '@ai-rpg/shared';
import { AgentType as AT } from '@ai-rpg/shared';
import { gameLog } from './GameLogService';

// ==================== 服务响应类型 ====================

export interface CombatServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface InitiateCombatResult {
  combatId: string;
  combat: CombatInstanceData;
}

export interface StartCombatResult {
  combat: CombatInstanceData;
  currentUnit: string;
  phase: CombatState;
}

export interface ExecuteActionResult {
  action: CombatAction;
  combat: CombatInstanceData;
}

export interface PlayerCombatResult {
  inCombat: boolean;
  combatId?: string;
  combat?: CombatInstanceData;
}

// ==================== 辅助函数 ====================

const MAX_LOG_LENGTH = 2000;

function truncateObject(obj: unknown, maxLength: number = MAX_LOG_LENGTH): string {
  const str = JSON.stringify(obj, null, 2);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + `... [truncated, total: ${str.length} chars]`;
}

let messageIdCounter = 0;

function generateMessageId(): string {
  messageIdCounter++;
  return `msg_${Date.now()}_${messageIdCounter}`;
}

function createAgentMessage(
  action: string,
  data: Record<string, unknown>
): AgentMessage {
  return {
    id: generateMessageId(),
    timestamp: Date.now(),
    from: AT.COORDINATOR, // 使用 COORDINATOR 作为服务层代理
    to: AT.COMBAT,
    type: 'request',
    payload: {
      action,
      data,
    },
    metadata: {
      priority: 'normal' as MessagePriority,
      requiresResponse: true,
    },
  };
}

// ==================== 战斗服务类 ====================

class CombatService {
  private static instance: CombatService | null = null;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): CombatService {
    if (!CombatService.instance) {
      CombatService.instance = new CombatService();
    }
    return CombatService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 预初始化 CombatAgent
    getCombatAgent();

    this.initialized = true;
    console.log('[CombatService] Initialized');
  }

  /**
   * 初始化战斗
   */
  public async initiateCombat(
    params: CombatInitParams
  ): Promise<CombatServiceResponse<InitiateCombatResult>> {
    try {
      const playerId = params.playerId;
      gameLog.info('combat', '初始化战斗', { playerId, enemyCount: params.enemies.length });
      gameLog.debug('combat', '战斗初始化敌人数据', { 
        enemies: params.enemies.map(e => ({
          id: e.id,
          name: e.name,
          level: e.level,
          stats: e.stats
        }))
      });

      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('initiate_combat', params as unknown as Record<string, unknown>)
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '初始化战斗失败',
        };
      }

      const data = response.data as { combatId: string; combat: CombatInstanceData };
      const combatId = data.combatId;
      gameLog.info('combat', '战斗初始化成功', { combatId });

      return {
        success: true,
        data: {
          combatId: data.combatId,
          combat: data.combat,
        },
        message: '战斗初始化成功',
      };
    } catch (error) {
      gameLog.error('combat', '战斗初始化失败', { error: error instanceof Error ? error.message : String(error) });
      console.error('[CombatService] Error initiating combat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '初始化战斗失败',
      };
    }
  }

  /**
   * 开始战斗
   */
  public async startCombat(
    combatId: string
  ): Promise<CombatServiceResponse<StartCombatResult>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('start_combat', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '开始战斗失败',
        };
      }

      const data = response.data as {
        combat: CombatInstanceData;
        currentUnit: string;
        phase: CombatState;
      };

      return {
        success: true,
        data: {
          combat: data.combat,
          currentUnit: data.currentUnit,
          phase: data.phase,
        },
        message: '战斗开始',
      };
    } catch (error) {
      console.error('[CombatService] Error starting combat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '开始战斗失败',
      };
    }
  }

  /**
   * 执行玩家行动
   */
  public async executeAction(
    combatId: string,
    actorId: string,
    action: ActionType,
    targetId?: string,
    skillId?: string,
    itemId?: string
  ): Promise<CombatServiceResponse<ExecuteActionResult>> {
    try {
      gameLog.debug('combat', '执行战斗行动', { combatId, actorId, action });

      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('execute_action', {
          combatId,
          actorId,
          action,
          targetId,
          skillId,
          itemId,
        })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '执行行动失败',
        };
      }

      const data = response.data as {
        action: CombatAction;
        combat: CombatInstanceData;
      };

      gameLog.debug('combat', '伤害计算详情', { 
        actorId, targetId, action,
        damage: data.action.damage,
        effects: data.action.effects
      });
      gameLog.info('combat', '战斗行动执行完成', { combatId, action: action, damage: data.action.damage });

      return {
        success: true,
        data: {
          action: data.action,
          combat: data.combat,
        },
      };
    } catch (error) {
      console.error('[CombatService] Error executing action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行行动失败',
      };
    }
  }

  /**
   * 执行AI回合
   */
  public async executeAITurn(
    combatId: string
  ): Promise<CombatServiceResponse<ExecuteActionResult>> {
    try {
      gameLog.debug('combat', '执行AI回合', { combatId });

      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('execute_ai_turn', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '执行AI回合失败',
        };
      }

      const data = response.data as {
        action: CombatAction;
        combat: CombatInstanceData;
        availableActions?: unknown[];
      };

      gameLog.debug('combat', 'AI决策详情', { 
        combatId,
        availableActions: data.availableActions ? truncateObject(data.availableActions) : undefined,
        selectedAction: truncateObject(data.action)
      });
      gameLog.info('combat', 'AI回合执行完成', { combatId, action: data.action.type });

      return {
        success: true,
        data: {
          action: data.action,
          combat: data.combat,
        },
      };
    } catch (error) {
      console.error('[CombatService] Error executing AI turn:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行AI回合失败',
      };
    }
  }

  /**
   * 结束当前回合
   */
  public async endTurn(
    combatId: string
  ): Promise<CombatServiceResponse<StartCombatResult>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('end_turn', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '结束回合失败',
        };
      }

      const data = response.data as {
        combat: CombatInstanceData;
        currentUnit: string;
        phase: CombatState;
      };

      return {
        success: true,
        data: {
          combat: data.combat,
          currentUnit: data.currentUnit,
          phase: data.phase,
        },
        message: '回合结束',
      };
    } catch (error) {
      console.error('[CombatService] Error ending turn:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '结束回合失败',
      };
    }
  }

  /**
   * 获取战斗状态
   */
  public async getCombatState(
    combatId: string
  ): Promise<CombatServiceResponse<CombatInstanceData>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('get_combat', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '获取战斗状态失败',
        };
      }

      const data = response.data as { combat: CombatInstanceData };

      return {
        success: true,
        data: data.combat,
      };
    } catch (error) {
      console.error('[CombatService] Error getting combat state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取战斗状态失败',
      };
    }
  }

  /**
   * 获取玩家当前战斗
   */
  public async getPlayerCombat(
    playerId: string
  ): Promise<CombatServiceResponse<PlayerCombatResult>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('get_player_combat', { playerId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '获取玩家战斗状态失败',
        };
      }

      const data = response.data as PlayerCombatResult;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[CombatService] Error getting player combat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取玩家战斗状态失败',
      };
    }
  }

  /**
   * 结束战斗
   */
  public async endCombat(
    combatId: string,
    victory?: boolean,
    fled?: boolean
  ): Promise<CombatServiceResponse<CombatResult>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('end_combat', { combatId, victory, fled })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '结束战斗失败',
        };
      }

      const data = response.data as { result: CombatResult };
      gameLog.info('combat', '战斗结束', { combatId, result: data.result.victory ? '胜利' : '失败' });

      return {
        success: true,
        data: data.result,
        message: '战斗结束',
      };
    } catch (error) {
      console.error('[CombatService] Error ending combat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '结束战斗失败',
      };
    }
  }

  /**
   * 获取战斗单位列表
   */
  public async getCombatUnits(
    combatId: string
  ): Promise<CombatServiceResponse<CombatUnit[]>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('get_combat_units', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '获取战斗单位失败',
        };
      }

      const data = response.data as { units: CombatUnit[] };

      return {
        success: true,
        data: data.units,
      };
    } catch (error) {
      console.error('[CombatService] Error getting combat units:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取战斗单位失败',
      };
    }
  }

  /**
   * 获取回合顺序
   */
  public async getTurnOrder(
    combatId: string
  ): Promise<CombatServiceResponse<Array<{ id: string; name: string; type: string }>>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('get_turn_order', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '获取回合顺序失败',
        };
      }

      const data = response.data as {
        turnOrder: Array<{ id: string; name: string; type: string }>;
        currentIndex: number;
      };

      return {
        success: true,
        data: data.turnOrder,
      };
    } catch (error) {
      console.error('[CombatService] Error getting turn order:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取回合顺序失败',
      };
    }
  }

  /**
   * 获取当前回合信息
   */
  public async getCurrentTurn(
    combatId: string
  ): Promise<CombatServiceResponse<{
    turnNumber: number;
    currentUnitId: string;
    currentUnit: CombatUnit | null;
    phase: CombatState;
  }>> {
    try {
      const agent = getCombatAgent();

      const response: AgentResponse = await agent.processMessage(
        createAgentMessage('get_current_turn', { combatId })
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || '获取当前回合信息失败',
        };
      }

      const data = response.data as {
        turnNumber: number;
        currentUnitId: string;
        currentUnit: CombatUnit | null;
        phase: CombatState;
      };

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('[CombatService] Error getting current turn:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取当前回合信息失败',
      };
    }
  }
}

// ==================== 单例导出 ====================

let combatServiceInstance: CombatService | null = null;

export function getCombatService(): CombatService {
  if (!combatServiceInstance) {
    combatServiceInstance = CombatService.getInstance();
  }
  return combatServiceInstance;
}

export async function initializeCombatService(): Promise<CombatService> {
  const service = getCombatService();
  await service.initialize();
  return service;
}

export { CombatService };
