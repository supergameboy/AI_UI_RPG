import type {
  ToolResponse,
  ToolCallContext,
  Quest,
  QuestTemplate,
  QuestRewards,
  QuestObjective,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getQuestService } from '../../services/QuestService';
import { gameLog } from '../../services/GameLogService';

export class QuestDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.QUEST_DATA;
  protected readonly toolDescription = '任务数据工具，负责任务 CRUD、进度追踪、奖励发放';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    this.registerMethod('getQuest', '获取任务详情', true, { characterId: 'string', questId: 'string' }, 'Quest');
    this.registerMethod('getCharacterQuests', '获取角色任务列表', true, { characterId: 'string' }, 'QuestListResponse');
    this.registerMethod('getAvailableQuests', '获取可接取任务', true, { characterId: 'string' }, 'GetAvailableQuestsResponse');
    this.registerMethod('checkPrerequisites', '检查前置条件', true, { characterId: 'string', quest: 'Quest' }, 'boolean');
    this.registerMethod('getTemplate', '获取任务模板', true, { templateId: 'string' }, 'QuestTemplate');

    this.registerMethod('acceptQuest', '接取任务', false, { characterId: 'string', questId: 'string', questData: 'Quest?' }, 'AcceptQuestResponse');
    this.registerMethod('completeQuest', '完成任务', false, { characterId: 'string', questId: 'string' }, 'CompleteQuestResponse');
    this.registerMethod('updateProgress', '更新任务进度', false, { characterId: 'string', questId: 'string', objectiveId: 'string', progress: 'number' }, 'UpdateProgressResponse');
    this.registerMethod('incrementProgress', '增加任务进度', false, { characterId: 'string', questId: 'string', objectiveId: 'string', increment: 'number' }, 'UpdateProgressResponse');
    this.registerMethod('abandonQuest', '放弃任务', false, { characterId: 'string', questId: 'string' }, 'AbandonQuestResponse');
    this.registerMethod('grantRewards', '发放奖励', false, { characterId: 'string', rewards: 'QuestRewards' }, 'void');
    this.registerMethod('registerTemplate', '注册任务模板', false, { template: 'QuestTemplate' }, 'void');
    this.registerMethod('registerTemplates', '批量注册任务模板', false, { templates: 'QuestTemplate[]' }, 'void');
    this.registerMethod('updateProgressByType', '按类型更新进度', false, { characterId: 'string', objectiveType: 'string', target: 'string', increment: 'number' }, 'UpdateProgressResponse[]');
    this.registerMethod('autoCompleteQuests', '自动完成任务', false, { characterId: 'string' }, 'CompleteQuestResponse[]');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getQuestService();

    try {
      let result: unknown;

      switch (method) {
        case 'getQuest':
          result = service.getQuest(
            params.characterId as string,
            params.questId as string
          );
          break;

        case 'getCharacterQuests':
          result = service.getCharacterQuests(params.characterId as string);
          break;

        case 'getAvailableQuests':
          result = service.getAvailableQuests(params.characterId as string);
          break;

        case 'checkPrerequisites':
          result = service.checkPrerequisites(
            params.characterId as string,
            params.quest as Quest
          );
          break;

        case 'getTemplate':
          result = service.getTemplate(params.templateId as string);
          if (result === undefined) {
            return this.createError<T>('TEMPLATE_NOT_FOUND', `Template not found: ${params.templateId}`);
          }
          break;

        case 'acceptQuest':
          result = service.acceptQuest(
            params.characterId as string,
            params.questId as string,
            params.questData as Quest | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'completeQuest':
          result = service.completeQuest(
            params.characterId as string,
            params.questId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'updateProgress':
          result = service.updateProgress(
            params.characterId as string,
            params.questId as string,
            params.objectiveId as string,
            params.progress as number
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'incrementProgress':
          result = service.incrementProgress(
            params.characterId as string,
            params.questId as string,
            params.objectiveId as string,
            params.increment as number
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'abandonQuest':
          result = service.abandonQuest(
            params.characterId as string,
            params.questId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'grantRewards':
          service.grantRewards(
            params.characterId as string,
            params.rewards as QuestRewards
          );
          result = { success: true };
          this.logWriteOperation(method, params, context);
          break;

        case 'registerTemplate':
          service.registerTemplate(params.template as QuestTemplate);
          result = { success: true };
          this.logWriteOperation(method, params, context);
          break;

        case 'registerTemplates':
          service.registerTemplates(params.templates as QuestTemplate[]);
          result = { success: true };
          this.logWriteOperation(method, params, context);
          break;

        case 'updateProgressByType':
          result = service.updateProgressByType(
            params.characterId as string,
            params.objectiveType as QuestObjective['type'],
            params.target as string,
            params.increment as number | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'autoCompleteQuests':
          result = service.autoCompleteQuests(params.characterId as string);
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in QuestDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `QuestDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `QuestDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
