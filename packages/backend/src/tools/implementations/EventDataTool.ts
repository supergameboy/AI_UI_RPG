import type {
  ToolResponse,
  ToolCallContext,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getEventService, type GameEvent, type EventContext, type EventTriggerRecord, type EventType } from '../../services/EventService';
import { gameLog } from '../../services/GameLogService';

/**
 * 事件筛选条件
 */
export interface EventFilters {
  type?: EventType;
  isActive?: boolean;
  limit?: number;
}

/**
 * 创建事件数据
 */
export interface CreateEventData {
  saveId: string;
  type: EventType;
  name: string;
  description: string;
  trigger: {
    probability?: number;
    locationId?: string;
    conditions?: Array<{
      type: 'attribute' | 'item' | 'quest' | 'flag' | 'location' | 'time' | 'custom';
      target: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'has' | 'not_has';
      value: unknown;
    }>;
    storyFlag?: string;
  };
  effects: Array<{
    type: 'dialogue' | 'combat' | 'item' | 'quest' | 'teleport' | 'flag' | 'stat' | 'custom';
    action: string;
    params: Record<string, unknown>;
  }>;
  chain?: {
    nextEventId: string;
    triggerDelay?: number;
  };
  metadata: {
    priority: number;
    repeatable: boolean;
    cooldown?: number;
    maxTriggers?: number;
  };
  id?: string;
}

/**
 * 事件结果
 */
export interface EventResult {
  success: boolean;
  effects: string[];
}

/**
 * 条件检查结果
 */
export interface ConditionCheckResult {
  satisfied: boolean;
  failedConditions: Array<{
    type: string;
    target: string;
    operator: string;
    value: unknown;
  }>;
}

/**
 * 事件链进度
 */
export interface ChainProgressResult {
  currentEvent: GameEvent;
  chainEvents: GameEvent[];
  progress: number;
  isComplete: boolean;
}

/**
 * 触发事件结果
 */
export interface TriggerEventResult {
  success: boolean;
  event?: GameEvent;
  effects?: Array<{
    type: string;
    action: string;
    params: Record<string, unknown>;
  }>;
  error?: string;
}

/**
 * 事件数据工具
 * 负责事件 CRUD、条件检查、触发记录、事件链管理
 */
export class EventDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.EVENT_DATA;
  protected readonly toolDescription = '事件数据工具，负责事件 CRUD、条件检查、触发记录、事件链管理';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    // 读方法
    this.registerMethod('getEvent', '获取事件', true, { eventId: 'string' }, 'GameEvent | undefined');
    this.registerMethod('listEvents', '列出事件', true, { saveId: 'string', filters: 'EventFilters?' }, 'GameEvent[]');
    this.registerMethod('checkConditions', '检查条件', true, { eventId: 'string', context: 'EventContext' }, 'ConditionCheckResult');
    this.registerMethod('getTriggerHistory', '获取触发历史', true, { characterId: 'string', eventId: 'string?' }, 'EventTriggerRecord[]');
    this.registerMethod('getNextEvent', '获取下一个事件', true, { eventId: 'string' }, 'GameEvent | undefined');
    this.registerMethod('getChainProgress', '获取事件链进度', true, { eventId: 'string' }, 'ChainProgressResult');

    // 写方法
    this.registerMethod('createEvent', '创建事件', false, { data: 'CreateEventData' }, 'GameEvent');
    this.registerMethod('updateEvent', '更新事件', false, { eventId: 'string', updates: 'Partial<GameEvent>' }, 'GameEvent | undefined');
    this.registerMethod('deleteEvent', '删除事件', false, { eventId: 'string' }, 'boolean');
    this.registerMethod('triggerEvent', '触发事件', false, { eventId: 'string', context: 'EventContext' }, 'TriggerEventResult');
    this.registerMethod('recordTrigger', '记录触发', false, { eventId: 'string', characterId: 'string', result: 'EventResult' }, 'EventTriggerRecord');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getEventService();

    try {
      let result: unknown;

      switch (method) {
        // 读方法
        case 'getEvent':
          result = service.getEvent(params.eventId as string);
          break;

        case 'listEvents': {
          const filters = params.filters as EventFilters | undefined;
          result = service.listEvents({
            saveId: params.saveId as string,
            type: filters?.type,
            isActive: filters?.isActive,
            limit: filters?.limit,
          });
          break;
        }

        case 'checkConditions': {
          const event = service.getEvent(params.eventId as string);
          if (!event) {
            return this.createError<T>('NOT_FOUND', `Event '${params.eventId}' not found`);
          }
          const conditions = event.trigger.conditions || [];
          const checkResult = service.checkConditions(conditions, params.context as EventContext);
          result = {
            satisfied: checkResult.satisfied,
            failedConditions: checkResult.failedConditions.map(c => ({
              type: c.type,
              target: c.target,
              operator: c.operator,
              value: c.value,
            })),
          } as ConditionCheckResult;
          break;
        }

        case 'getTriggerHistory': {
          const options: {
            characterId?: string;
            eventId?: string;
            limit?: number;
          } = {
            characterId: params.characterId as string,
            limit: 100,
          };
          if (params.eventId) {
            options.eventId = params.eventId as string;
          }
          result = service.getTriggerHistory(options);
          break;
        }

        case 'getNextEvent':
          result = service.getNextEvent(params.eventId as string);
          break;

        case 'getChainProgress':
          try {
            result = service.getChainProgress(params.eventId as string) as ChainProgressResult;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return this.createError<T>('NOT_FOUND', errorMessage);
          }
          break;

        // 写方法
        case 'createEvent': {
          const data = params.data as CreateEventData;
          result = service.createEvent({
            saveId: data.saveId,
            type: data.type,
            name: data.name,
            description: data.description,
            trigger: data.trigger,
            effects: data.effects,
            chain: data.chain,
            metadata: data.metadata,
            id: data.id,
          });
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'updateEvent': {
          const eventId = params.eventId as string;
          const updates = params.updates as Partial<GameEvent>;
          result = service.updateEvent(eventId, updates);
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'deleteEvent':
          result = service.deleteEvent(params.eventId as string);
          this.logWriteOperation(method, params, context);
          break;

        case 'triggerEvent': {
          const triggerResult = service.triggerEvent(
            params.eventId as string,
            params.context as EventContext
          );
          result = {
            success: triggerResult.success,
            event: triggerResult.event,
            effects: triggerResult.effects,
            error: triggerResult.error,
          } as TriggerEventResult;
          this.logWriteOperation(method, params, context);
          break;
        }

        case 'recordTrigger': {
          const eventId = params.eventId as string;
          const characterId = params.characterId as string;
          const eventResult = params.result as EventResult;

          const event = service.getEvent(eventId);
          if (!event) {
            return this.createError<T>('NOT_FOUND', `Event '${eventId}' not found`);
          }

          // 构造触发记录
          const record: EventTriggerRecord = {
            id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId,
            saveId: event.saveId,
            characterId,
            timestamp: Date.now(),
            context: {
              location: '',
              previousEvents: [],
              playerChoices: [],
            },
            result: {
              success: eventResult.success,
              effects: eventResult.effects,
            },
          };

          result = record;
          this.logWriteOperation(method, params, context);
          break;
        }

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in EventDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `EventDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `EventDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
