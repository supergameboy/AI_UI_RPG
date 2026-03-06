import type {
  ToolResponse,
  ToolCallContext,
  BaseAttributeName,
  DamageCalculationParams,
  HealingCalculationParams,
  AddExperienceRequest,
  AttributeModification,
  StatusEffect,
  CalculateAttributesRequest,
  CalculateDerivedRequest,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getNumericalService, type RegisterCharacterData } from '../../services/NumericalService';
import { gameLog } from '../../services/GameLogService';

export class NumericalTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.NUMERICAL;
  protected readonly toolDescription = '数值管理工具，负责属性计算、战斗数值、经验值和等级管理';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    this.registerMethod('getCharacter', '获取角色数值数据', true, { characterId: 'string' }, 'Character');
    this.registerMethod('getCharacterStats', '获取角色完整统计', true, { characterId: 'string' }, 'CharacterStatsResponse');
    this.registerMethod('getAllCharacters', '获取所有角色', true, {}, 'Character[]');
    this.registerMethod('calculateBaseAttributes', '计算基础属性', true, { level: 'number', race: 'string?', class: 'string?' }, 'AttributesResult');
    this.registerMethod('calculateDerivedAttributes', '计算派生属性', true, { baseAttributes: 'object', level: 'number' }, 'DerivedAttributesResult');
    this.registerMethod('calculateDamage', '计算伤害', true, { params: 'DamageCalculationParams' }, 'DamageResult');
    this.registerMethod('calculateHealing', '计算治疗', true, { params: 'HealingCalculationParams' }, 'HealingResult');
    this.registerMethod('getExperienceForLevel', '获取升级所需经验', true, { level: 'number' }, 'ExperienceResult');
    this.registerMethod('checkLevelUp', '检查是否可升级', true, { characterId: 'string' }, 'LevelCheckResult');
    this.registerMethod('getCombatStatistics', '获取战斗统计', true, { characterId: 'string' }, 'CombatStatistics');
    this.registerMethod('createSnapshot', '创建角色快照', true, { characterId: 'string' }, 'CharacterSnapshot');
    this.registerMethod('getSnapshot', '获取角色快照', true, { characterId: 'string', timestamp: 'number?' }, 'SnapshotResult');

    this.registerMethod('registerCharacter', '注册新角色', false, { id: 'string', name: 'string', race: 'string?', class: 'string?' }, 'Character');
    this.registerMethod('modifyAttribute', '修改角色属性', false, { targetId: 'string', attribute: 'string', value: 'number', type: 'string' }, 'ModificationResult');
    this.registerMethod('addExperience', '添加经验值', false, { characterId: 'string', amount: 'number' }, 'AddExperienceResult');
    this.registerMethod('setLevel', '设置角色等级', false, { characterId: 'string', level: 'number' }, 'SetLevelResult');
    this.registerMethod('applyDamage', '应用伤害', false, { targetId: 'string', damage: 'number', damageType: 'string' }, 'DamageApplyResult');
    this.registerMethod('applyHealing', '应用治疗', false, { targetId: 'string', healing: 'number' }, 'HealingApplyResult');
    this.registerMethod('applyStatusEffect', '应用状态效果', false, { characterId: 'string', effect: 'StatusEffect' }, 'StatusEffectResult');
    this.registerMethod('removeStatusEffect', '移除状态效果', false, { characterId: 'string', effectId: 'string' }, 'StatusEffectResult');
    this.registerMethod('recalculateAll', '重新计算所有属性', false, { characterId: 'string' }, 'Character');
    this.registerMethod('setGrowthCurve', '设置成长曲线', false, { attribute: 'string', config: 'AttributeGrowthConfig' }, 'GrowthCurveResult');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getNumericalService();

    try {
      let result: unknown;

      switch (method) {
        case 'getCharacter':
          result = service.getCharacter(params.characterId as string);
          if (!result) {
            return this.createError<T>('CHARACTER_NOT_FOUND', `Character not found: ${params.characterId}`);
          }
          break;

        case 'getCharacterStats':
          result = this.handleApiResponse(service.getCharacterStats(params.characterId as string));
          break;

        case 'getAllCharacters':
          result = service.getAllCharacters();
          break;

        case 'calculateBaseAttributes':
          result = this.handleApiResponse(service.calculateBaseAttributes(params as unknown as CalculateAttributesRequest));
          break;

        case 'calculateDerivedAttributes':
          result = this.handleApiResponse(service.calculateDerivedAttributes(params as unknown as CalculateDerivedRequest));
          break;

        case 'calculateDamage':
          result = service.calculateDamage(params.params as DamageCalculationParams);
          break;

        case 'calculateHealing':
          result = service.calculateHealing(params.params as HealingCalculationParams);
          break;

        case 'getExperienceForLevel':
          result = this.handleApiResponse(service.getExperienceForLevelApi(params.level as number));
          break;

        case 'checkLevelUp':
          result = this.handleApiResponse(service.checkLevelUp(params.characterId as string));
          break;

        case 'getCombatStatistics':
          result = this.handleApiResponse(service.getCombatStatistics(params.characterId as string));
          break;

        case 'createSnapshot':
          result = this.handleApiResponse(service.createSnapshot(params.characterId as string));
          break;

        case 'getSnapshot':
          result = this.handleApiResponse(
            service.getSnapshot(
              params.characterId as string,
              params.timestamp as number | undefined,
              params.index as number | undefined
            )
          );
          break;

        case 'registerCharacter':
          result = this.handleApiResponse(service.registerCharacter(params as unknown as RegisterCharacterData));
          this.logWriteOperation(method, params, context);
          break;

        case 'modifyAttribute':
          result = this.handleApiResponse(service.modifyAttribute(params as unknown as AttributeModification));
          this.logWriteOperation(method, params, context);
          break;

        case 'addExperience':
          result = this.handleApiResponse(service.addExperience(params as unknown as AddExperienceRequest));
          this.logWriteOperation(method, params, context);
          break;

        case 'setLevel':
          result = this.handleApiResponse(
            service.setLevel(
              params.characterId as string,
              params.level as number,
              params.recalculateAttributes as boolean | undefined
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'applyDamage':
          result = this.handleApiResponse(
            service.applyDamage(
              params.targetId as string,
              params.damage as number,
              params.damageType as 'physical' | 'magical' | 'true',
              params.source as string | undefined
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'applyHealing':
          result = this.handleApiResponse(
            service.applyHealing(
              params.targetId as string,
              params.healing as number,
              params.source as string | undefined
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'applyStatusEffect':
          result = this.handleApiResponse(
            service.applyStatusEffect(
              params.characterId as string,
              params.effect as StatusEffect
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'removeStatusEffect':
          result = this.handleApiResponse(
            service.removeStatusEffect(
              params.characterId as string,
              params.effectId as string
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'recalculateAll':
          result = this.handleApiResponse(service.recalculateAll(params.characterId as string));
          this.logWriteOperation(method, params, context);
          break;

        case 'setGrowthCurve':
          result = this.handleApiResponse(
            service.setGrowthCurve(
              params.attribute as BaseAttributeName,
              params.config as Parameters<typeof service.setGrowthCurve>[1]
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in NumericalTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `NumericalTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private handleApiResponse<T>(response: { success: boolean; data?: T; error?: string }): T {
    if (!response.success) {
      throw new Error(response.error ?? 'Unknown error');
    }
    return response.data as T;
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `NumericalTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
