import type {
  ToolResponse,
  ToolCallContext,
  SkillLearnParams,
  SkillUpgradeParams,
  SkillUseParams,
  SkillCategory,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getSkillService, type CreateSkillData, type CreateTemplateData } from '../../services/SkillService';
import { gameLog } from '../../services/GameLogService';

export class SkillDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.SKILL_DATA;
  protected readonly toolDescription = '技能数据工具，负责技能 CRUD、冷却管理';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    this.registerMethod('getSkill', '获取技能', true, { skillId: 'string', characterId: 'string' }, 'ExtendedSkill');
    this.registerMethod('getCharacterSkills', '获取角色所有技能', true, { characterId: 'string' }, 'SkillListResponse');
    this.registerMethod('getSkillsByCategory', '按分类获取技能', true, { characterId: 'string', category: 'SkillCategory' }, 'SkillListResponse');
    this.registerMethod('checkSkillAvailability', '检查技能可用性', true, { skillId: 'string', characterId: 'string' }, 'SkillAvailabilityResponse');
    this.registerMethod('getCharacterCooldowns', '获取角色所有冷却', true, { characterId: 'string' }, 'SkillCooldownResponse');
    this.registerMethod('getTemplate', '获取技能模板', true, { templateId: 'string' }, 'SkillTemplate');
    this.registerMethod('getAllTemplates', '获取所有模板', true, {}, 'SkillTemplate[]');
    this.registerMethod('getStatistics', '获取技能统计', true, { characterId: 'string?' }, 'SkillStatistics');

    this.registerMethod('createSkill', '创建技能', false, { data: 'CreateSkillData' }, 'ExtendedSkill');
    this.registerMethod('createSkillFromTemplate', '从模板创建技能', false, { templateId: 'string', characterId: 'string', level: 'number?' }, 'ExtendedSkill');
    this.registerMethod('deleteSkill', '删除技能', false, { skillId: 'string', characterId: 'string' }, 'void');
    this.registerMethod('learnSkill', '学习技能', false, { params: 'SkillLearnParams' }, 'ExtendedSkill');
    this.registerMethod('upgradeSkill', '升级技能', false, { params: 'SkillUpgradeParams' }, 'ExtendedSkill');
    this.registerMethod('useSkill', '使用技能', false, { params: 'SkillUseParams' }, 'SkillEffectResult');
    this.registerMethod('reduceCooldown', '减少冷却', false, { characterId: 'string', skillId: 'string?', amount: 'number?' }, 'void');
    this.registerMethod('resetCooldown', '重置冷却', false, { characterId: 'string', skillId: 'string?' }, 'void');
    this.registerMethod('createTemplate', '创建技能模板', false, { data: 'CreateTemplateData' }, 'SkillTemplate');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getSkillService();

    try {
      let result: unknown;

      switch (method) {
        case 'getSkill':
          result = this.handleApiResponse(
            service.getSkill(params.skillId as string, params.characterId as string)
          );
          break;

        case 'getCharacterSkills':
          result = this.handleApiResponse(service.getCharacterSkills(params.characterId as string));
          break;

        case 'getSkillsByCategory':
          result = this.handleApiResponse(
            service.getSkillsByCategory(params.characterId as string, params.category as SkillCategory)
          );
          break;

        case 'checkSkillAvailability':
          result = this.handleApiResponse(
            service.checkSkillAvailability(params.skillId as string, params.characterId as string)
          );
          break;

        case 'getCharacterCooldowns':
          result = this.handleApiResponse(service.getCharacterCooldowns(params.characterId as string));
          break;

        case 'getTemplate':
          result = this.handleApiResponse(service.getTemplate(params.templateId as string));
          break;

        case 'getAllTemplates':
          result = this.handleApiResponse(service.getAllTemplates());
          break;

        case 'getStatistics':
          result = this.handleApiResponse(
            service.getStatistics(params.characterId as string | undefined)
          );
          break;

        case 'createSkill':
          result = this.handleApiResponse(service.createSkill(params.data as CreateSkillData));
          this.logWriteOperation(method, params, context);
          break;

        case 'createSkillFromTemplate':
          result = this.handleApiResponse(
            service.createSkillFromTemplate(
              params.templateId as string,
              params.characterId as string,
              params.level as number | undefined
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'deleteSkill':
          result = this.handleApiResponse(
            service.deleteSkill(params.skillId as string, params.characterId as string)
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'learnSkill':
          result = this.handleApiResponse(service.learnSkill(params.params as SkillLearnParams));
          this.logWriteOperation(method, params, context);
          break;

        case 'upgradeSkill':
          result = this.handleApiResponse(service.upgradeSkill(params.params as SkillUpgradeParams));
          this.logWriteOperation(method, params, context);
          break;

        case 'useSkill':
          result = this.handleApiResponse(service.useSkill(params.params as SkillUseParams));
          this.logWriteOperation(method, params, context);
          break;

        case 'reduceCooldown':
          result = this.handleApiResponse(
            service.reduceCooldown(
              params.characterId as string,
              params.skillId as string | undefined,
              params.amount as number | undefined
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'resetCooldown':
          result = this.handleApiResponse(
            service.resetCooldown(
              params.characterId as string,
              params.skillId as string | undefined
            )
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'createTemplate':
          result = this.handleApiResponse(service.createTemplate(params.data as CreateTemplateData));
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in SkillDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `SkillDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private async handleApiResponse<T>(response: Promise<{ success: boolean; data?: T; error?: string }>): Promise<T> {
    const result = await response;
    if (!result.success) {
      throw new Error(result.error ?? 'Unknown error');
    }
    return result.data as T;
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `SkillDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
