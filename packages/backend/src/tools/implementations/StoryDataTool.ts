import type {
  ToolResponse,
  ToolCallContext,
  StoryNode,
  StorySummary,
  PlotPoint,
  CreateNodeRequest,
  RecordChoiceRequest,
  PlotPointType,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getStoryService } from '../../services/StoryService';
import { gameLog } from '../../services/GameLogService';

export class StoryDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.STORY_DATA;
  protected readonly toolDescription = '故事数据工具，负责剧情节点管理、选择记录、摘要存储';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    // 读方法
    this.registerMethod('getNode', '获取节点', true, { nodeId: 'string' }, 'StoryNode | null');
    this.registerMethod('getActiveNodes', '获取活动节点', true, { saveId: 'string' }, 'StoryNode[]');
    this.registerMethod('getBranch', '获取分支', true, { branchId: 'string' }, 'StoryBranch | null');
    this.registerMethod('getCurrentBranch', '获取当前分支', true, { saveId: 'string' }, 'StoryBranch | null');
    this.registerMethod('getChoices', '获取选择历史', true, { saveId: 'string', limit: 'number?' }, 'DecisionRecord[]');
    this.registerMethod('getSummary', '获取摘要', true, { saveId: 'string' }, 'StorySummary | null');
    this.registerMethod('getCurrentNode', '获取当前节点', true, { saveId: 'string' }, 'StoryNode | null');
    this.registerMethod('getStoryPath', '获取故事路径', true, { saveId: 'string', fromNodeId: 'string?' }, 'StoryPathResponse');
    this.registerMethod('getPlotPoints', '获取剧情点', true, { saveId: 'string', type: 'PlotPointType?' }, 'PlotPoint[]');

    // 写方法
    this.registerMethod('createNode', '创建节点', false, { data: 'CreateNodeRequest' }, 'CreateNodeResponse');
    this.registerMethod('updateNode', '更新节点', false, { nodeId: 'string', updates: 'Partial<StoryNode>' }, 'StoryNode | null');
    this.registerMethod('deleteNode', '删除节点', false, { nodeId: 'string' }, 'boolean');
    this.registerMethod('recordChoice', '记录选择', false, { saveId: 'string', nodeId: 'string', choiceId: 'string' }, 'RecordChoiceResponse');
    this.registerMethod('undoChoice', '撤销选择', false, { saveId: 'string', nodeId: 'string' }, 'boolean');
    this.registerMethod('saveSummary', '保存摘要', false, { saveId: 'string', summary: 'Partial<StorySummary>' }, 'boolean');
    this.registerMethod('addPlotPoint', '添加剧情点', false, { saveId: 'string', plotPoint: 'Omit<PlotPoint, "id" | "timestamp">' }, 'PlotPoint');
    this.registerMethod('navigateToNode', '导航到节点', false, { saveId: 'string', nodeId: 'string' }, 'StoryNode | null');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getStoryService();

    try {
      await service.initialize();

      let result: unknown;

      switch (method) {
        // 读方法
        case 'getNode':
          result = service.getNode(params.nodeId as string);
          break;

        case 'getActiveNodes':
          result = service.getActiveNodes(params.saveId as string);
          break;

        case 'getBranch':
          result = service.getBranch(params.branchId as string);
          break;

        case 'getCurrentBranch':
          result = service.getCurrentBranch(params.saveId as string);
          break;

        case 'getChoices':
          result = service.getChoices(
            params.saveId as string,
            params.limit as number | undefined
          );
          break;

        case 'getSummary':
          result = service.getSummary(params.saveId as string);
          break;

        case 'getCurrentNode':
          result = service.getCurrentNode(params.saveId as string);
          break;

        case 'getStoryPath':
          result = service.getStoryPath(
            params.saveId as string,
            params.fromNodeId as string | undefined
          );
          break;

        case 'getPlotPoints':
          result = service.getPlotPoints(
            params.saveId as string,
            params.type as PlotPointType | undefined
          );
          break;

        // 写方法
        case 'createNode':
          result = service.createNode(params.data as CreateNodeRequest);
          this.logWriteOperation(method, params, context);
          break;

        case 'updateNode':
          result = service.updateNode(
            params.nodeId as string,
            params.updates as Partial<StoryNode>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'deleteNode':
          result = service.deleteNode(params.nodeId as string);
          this.logWriteOperation(method, params, context);
          break;

        case 'recordChoice': {
          const request: RecordChoiceRequest = {
            saveId: params.saveId as string,
            nodeId: params.nodeId as string,
            choiceId: params.choiceId as string,
          };
          result = service.recordChoice(request);
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'undoChoice':
          result = service.undoChoice(
            params.saveId as string,
            params.nodeId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'saveSummary': {
          const existingSummary = service.getSummary(params.saveId as string);
          const summaryInput = params.summary as Partial<StorySummary>;

          if (existingSummary) {
            // 合并现有摘要和更新
            const mergedSummary: StorySummary = {
              ...existingSummary,
              ...summaryInput,
              id: existingSummary.id,
              characterId: existingSummary.characterId,
            };
            result = service.saveSummary(mergedSummary);
          } else if (summaryInput.id && summaryInput.characterId) {
            // 创建新摘要
            result = service.saveSummary(summaryInput as StorySummary);
          } else {
            result = false;
          }
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'addPlotPoint': {
          const plotPointInput = params.plotPoint as Omit<PlotPoint, 'id' | 'timestamp'>;
          result = service.addPlotPoint(
            params.saveId as string,
            plotPointInput.characterId,
            plotPointInput.type,
            plotPointInput.title,
            plotPointInput.description,
            plotPointInput.relatedNodes,
            plotPointInput.importance
          );
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'navigateToNode':
          result = service.navigateToNode(
            params.saveId as string,
            params.nodeId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in StoryDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `StoryDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `StoryDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
