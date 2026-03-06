import type {
  ToolResponse,
  ToolCallContext,
  CombatInstanceData,
  CombatUnit,
  CombatInitParams,
  CombatResult,
  StatusEffect,
  CombatState,
} from '@ai-rpg/shared';
import { ToolType, AgentType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getCombatService } from '../../services/CombatService';
import { gameLog } from '../../services/GameLogService';

/**
 * 战斗效果参数（用于 applyEffect 方法）
 */
export interface CombatEffectParams {
  combatId: string;
  unitId: string;
  effect: StatusEffect;
}

/**
 * 移除效果参数
 */
export interface RemoveEffectParams {
  combatId: string;
  unitId: string;
  effectId: string;
}

/**
 * 活跃效果响应
 */
export interface ActiveEffectsResponse {
  combatId: string;
  unitId?: string;
  effects: Array<{
    unitId: string;
    unitName: string;
    effect: StatusEffect;
  }>;
}

/**
 * 初始化战斗响应
 */
export interface InitCombatResponse {
  combatId: string;
  combat: CombatInstanceData;
}

/**
 * 当前回合信息响应
 */
export interface CurrentTurnResponse {
  turnNumber: number;
  currentUnitId: string;
  currentUnit: CombatUnit | null;
  phase: CombatState;
}

/**
 * 下一回合响应
 */
export interface NextTurnResponse {
  combat: CombatInstanceData;
  currentUnit: string;
  phase: CombatState;
}

export class CombatDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.COMBAT_DATA;
  protected readonly toolDescription = '战斗数据工具，负责战斗状态管理、回合处理、效果结算';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    // 读方法
    this.registerMethod(
      'getCombatState',
      '获取战斗状态',
      true,
      { combatId: 'string' },
      'CombatInstanceData'
    );
    this.registerMethod(
      'getCurrentTurn',
      '获取当前回合信息',
      true,
      { combatId: 'string' },
      'CurrentTurnResponse'
    );
    this.registerMethod(
      'getCombatUnits',
      '获取战斗单位列表',
      true,
      { combatId: 'string' },
      'CombatUnit[]'
    );
    this.registerMethod(
      'getActiveEffects',
      '获取活跃效果',
      true,
      { combatId: 'string', unitId: 'string?' },
      'ActiveEffectsResponse'
    );

    // 写方法
    this.registerMethod(
      'initCombat',
      '初始化战斗',
      false,
      { saveId: 'string', params: 'CombatInitParams' },
      'InitCombatResponse'
    );
    this.registerMethod(
      'applyEffect',
      '应用效果',
      false,
      { combatId: 'string', unitId: 'string', effect: 'StatusEffect' },
      'CombatUnit'
    );
    this.registerMethod(
      'removeEffect',
      '移除效果',
      false,
      { combatId: 'string', unitId: 'string', effectId: 'string' },
      'CombatUnit'
    );
    this.registerMethod(
      'nextTurn',
      '下一回合',
      false,
      { combatId: 'string' },
      'NextTurnResponse'
    );
    this.registerMethod(
      'endCombat',
      '结束战斗',
      false,
      { combatId: 'string', result: 'CombatResult?' },
      'CombatResult'
    );
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getCombatService();

    try {
      await service.initialize();

      let result: unknown;

      switch (method) {
        case 'getCombatState': {
          const response = await service.getCombatState(params.combatId as string);
          if (!response.success || !response.data) {
            return this.createError<T>(
              'GET_COMBAT_STATE_ERROR',
              response.error || '获取战斗状态失败'
            );
          }
          result = response.data;
          break;
        }

        case 'getCurrentTurn': {
          const response = await service.getCurrentTurn(params.combatId as string);
          if (!response.success || !response.data) {
            return this.createError<T>(
              'GET_CURRENT_TURN_ERROR',
              response.error || '获取当前回合信息失败'
            );
          }
          result = response.data;
          break;
        }

        case 'getCombatUnits': {
          const response = await service.getCombatUnits(params.combatId as string);
          if (!response.success || !response.data) {
            return this.createError<T>(
              'GET_COMBAT_UNITS_ERROR',
              response.error || '获取战斗单位失败'
            );
          }
          result = response.data;
          break;
        }

        case 'getActiveEffects': {
          result = await this.getActiveEffects(
            service,
            params.combatId as string,
            params.unitId as string | undefined
          );
          break;
        }

        case 'initCombat': {
          const response = await service.initiateCombat(
            params.params as CombatInitParams
          );
          if (!response.success || !response.data) {
            return this.createError<T>(
              'INIT_COMBAT_ERROR',
              response.error || '初始化战斗失败'
            );
          }
          result = {
            combatId: response.data.combatId,
            combat: response.data.combat,
          };
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'applyEffect': {
          result = await this.applyEffect(
            params.combatId as string,
            params.unitId as string,
            params.effect as StatusEffect
          );
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'removeEffect': {
          result = await this.removeEffect(
            params.combatId as string,
            params.unitId as string,
            params.effectId as string
          );
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'nextTurn': {
          const response = await service.endTurn(params.combatId as string);
          if (!response.success || !response.data) {
            return this.createError<T>(
              'NEXT_TURN_ERROR',
              response.error || '下一回合失败'
            );
          }
          result = {
            combat: response.data.combat,
            currentUnit: response.data.currentUnit,
            phase: response.data.phase,
          };
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'endCombat': {
          const resultParam = params.result as CombatResult | undefined;
          const response = await service.endCombat(
            params.combatId as string,
            resultParam?.victory,
            resultParam?.fled
          );
          if (!response.success || !response.data) {
            return this.createError<T>(
              'END_COMBAT_ERROR',
              response.error || '结束战斗失败'
            );
          }
          result = response.data;
          this.logWriteOperation(method, params, context);
          break;
        }

        default:
          return this.createError<T>(
            'METHOD_NOT_FOUND',
            `Method '${method}' not found in CombatDataTool`
          );
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `CombatDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  /**
   * 获取活跃效果
   */
  private async getActiveEffects(
    service: ReturnType<typeof getCombatService>,
    combatId: string,
    unitId?: string
  ): Promise<ActiveEffectsResponse> {
    const combatResponse = await service.getCombatState(combatId);
    if (!combatResponse.success || !combatResponse.data) {
      throw new Error(combatResponse.error || '获取战斗状态失败');
    }

    const combat = combatResponse.data;
    const effects: ActiveEffectsResponse['effects'] = [];

    for (const [id, unit] of combat.units) {
      // 如果指定了 unitId，只返回该单位的效果
      if (unitId && id !== unitId) {
        continue;
      }

      for (const effect of unit.statusEffects) {
        effects.push({
          unitId: id,
          unitName: unit.name,
          effect,
        });
      }
    }

    return {
      combatId,
      unitId,
      effects,
    };
  }

  /**
   * 应用效果到战斗单位
   */
  private async applyEffect(
    combatId: string,
    unitId: string,
    effect: StatusEffect
  ): Promise<CombatUnit> {
    // 通过 CombatService 的内部方法应用效果
    // 由于 CombatService 没有直接暴露 applyEffect 方法，我们需要通过 Agent 处理
    const { getCombatAgent } = await import('../../agents/CombatAgent');
    const agent = getCombatAgent();

    const response = await agent.processMessage({
      id: `tool_${Date.now()}`,
      timestamp: Date.now(),
      from: AgentType.COORDINATOR,
      to: AgentType.COMBAT,
      type: 'request',
      payload: {
        action: 'apply_status_effect',
        data: {
          combatId,
          unitId,
          effect,
        },
      },
      metadata: {
        priority: 'normal' as const,
        requiresResponse: true,
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || '应用效果失败');
    }

    const data = response.data as { unit: CombatUnit };
    return data.unit;
  }

  /**
   * 移除战斗单位的效果
   */
  private async removeEffect(
    combatId: string,
    unitId: string,
    effectId: string
  ): Promise<CombatUnit> {
    const { getCombatAgent } = await import('../../agents/CombatAgent');
    const agent = getCombatAgent();

    const response = await agent.processMessage({
      id: `tool_${Date.now()}`,
      timestamp: Date.now(),
      from: AgentType.COORDINATOR,
      to: AgentType.COMBAT,
      type: 'request',
      payload: {
        action: 'remove_status_effect',
        data: {
          combatId,
          unitId,
          effectId,
        },
      },
      metadata: {
        priority: 'normal' as const,
        requiresResponse: true,
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || '移除效果失败');
    }

    const data = response.data as { unit: CombatUnit };
    return data.unit;
  }

  private logWriteOperation(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): void {
    gameLog.info('backend', `CombatDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
