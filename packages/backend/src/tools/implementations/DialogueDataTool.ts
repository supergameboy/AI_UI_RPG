import type {
  ToolResponse,
  ToolCallContext,
  DialogueHistoryEntry,
  EmotionRecord,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getDialogueService } from '../../services/DialogueService';
import { gameLog } from '../../services/GameLogService';

/**
 * 对话数据工具
 * 负责对话历史管理、上下文构建、情绪记录
 */
export class DialogueDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.DIALOGUE_DATA;
  protected readonly toolDescription = '对话数据工具，负责对话历史管理、上下文构建、情绪记录';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    // 读方法
    this.registerMethod('getHistory', '获取对话历史', true, { characterId: 'string', limit: 'number?' }, 'DialogueHistoryEntry[]');
    this.registerMethod('getContext', '获取对话上下文', true, { characterId: 'string' }, 'DialogueContext');
    this.registerMethod('getEmotionHistory', '获取情绪历史', true, { characterId: 'string', npcId: 'string?' }, 'EmotionRecord[]');

    // 写方法
    this.registerMethod('addHistory', '添加对话历史', false, { characterId: 'string', entry: 'DialogueHistoryEntry' }, 'DialogueHistoryEntry');
    this.registerMethod('recordEmotion', '记录情绪', false, { characterId: 'string', npcId: 'string', emotion: 'EmotionRecord' }, 'EmotionRecord');
    this.registerMethod('clearHistory', '清空对话历史', false, { characterId: 'string' }, 'boolean');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getDialogueService();

    try {
      let result: unknown;

      switch (method) {
        case 'getHistory':
          result = service.getHistory(
            params.characterId as string,
            params.limit as number | undefined
          );
          break;

        case 'getContext':
          result = service.getContext(params.characterId as string);
          break;

        case 'getEmotionHistory':
          result = service.getEmotionHistory(
            params.characterId as string,
            params.npcId as string | undefined
          );
          break;

        case 'addHistory':
          result = service.addHistory(
            params.characterId as string,
            params.entry as DialogueHistoryEntry
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'recordEmotion':
          result = service.recordEmotion(
            params.characterId as string,
            params.npcId as string,
            params.emotion as EmotionRecord
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'clearHistory':
          result = service.clearHistory(params.characterId as string);
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in DialogueDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `DialogueDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `DialogueDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
