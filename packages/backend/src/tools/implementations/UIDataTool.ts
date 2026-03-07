import type {
  ToolResponse,
  ToolCallContext,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getUIService, UIState, UIInstruction, NotificationItem } from '../../services/UIService';
import { gameLog } from '../../services/GameLogService';

/**
 * UI 数据工具
 * 负责 UI 状态管理、组件缓存、指令队列
 */
export class UIDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.UI_DATA;
  protected readonly toolDescription = 'UI数据工具，负责UI状态管理、组件缓存、指令队列';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    // 读方法
    this.registerMethod('getState', '获取UI状态', true, { saveId: 'string', characterId: 'string' }, 'UIState');
    this.registerMethod('getQueue', '获取指令队列', true, { saveId: 'string', characterId: 'string' }, 'UIInstruction[]');
    this.registerMethod('getNotifications', '获取通知', true, { saveId: 'string', characterId: 'string', includeRead: 'boolean?' }, 'NotificationItem[]');
    this.registerMethod('getComponent', '获取缓存组件', true, { componentId: 'string' }, 'UIComponent');

    // 写方法
    this.registerMethod('updateState', '更新UI状态', false, { saveId: 'string', characterId: 'string', updates: 'Partial<UIState>' }, 'UIState');
    this.registerMethod('resetState', '重置UI状态', false, { saveId: 'string', characterId: 'string' }, 'UIState');
    this.registerMethod('openPanel', '打开面板', false, { saveId: 'string', characterId: 'string', panelId: 'string' }, 'UIState');
    this.registerMethod('closePanel', '关闭面板', false, { saveId: 'string', characterId: 'string', panelId: 'string' }, 'UIState');
    this.registerMethod('queueInstruction', '添加指令到队列', false, { saveId: 'string', characterId: 'string', instruction: 'Omit<UIInstruction, "id" | "timestamp">' }, 'UIInstruction');
    this.registerMethod('clearQueue', '清空指令队列', false, { saveId: 'string', characterId: 'string' }, 'void');
    this.registerMethod('showNotification', '显示通知', false, { saveId: 'string', characterId: 'string', notification: 'Omit<NotificationItem, "id" | "createdAt" | "isRead">' }, 'NotificationItem');
    this.registerMethod('dismissNotification', '关闭通知', false, { saveId: 'string', characterId: 'string', notificationId: 'string' }, 'boolean');
    this.registerMethod('cacheComponent', '缓存组件', false, { componentId: 'string', type: 'string', props: 'Record<string, unknown>' }, 'UIComponent');
    this.registerMethod('invalidateComponent', '使缓存失效', false, { componentId: 'string' }, 'boolean');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getUIService();

    try {
      let result: unknown;

      switch (method) {
        // 读方法
        case 'getState':
          result = service.getState(
            params.saveId as string,
            params.characterId as string
          );
          break;

        case 'getQueue':
          result = service.getQueue(
            params.saveId as string,
            params.characterId as string
          );
          break;

        case 'getNotifications':
          result = service.getNotifications(
            params.saveId as string,
            params.characterId as string,
            params.includeRead !== false ? undefined : { unreadOnly: true }
          );
          break;

        case 'getComponent':
          result = service.getComponent(params.componentId as string);
          break;

        // 写方法
        case 'updateState':
          result = service.updateState(
            params.saveId as string,
            params.characterId as string,
            params.updates as Partial<UIState>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'resetState':
          result = service.resetState(
            params.saveId as string,
            params.characterId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'openPanel':
          result = service.openPanel(
            params.saveId as string,
            params.characterId as string,
            params.panelId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'closePanel':
          result = service.closePanel(
            params.saveId as string,
            params.characterId as string,
            params.panelId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'queueInstruction':
          result = service.queueInstruction(
            params.saveId as string,
            params.characterId as string,
            params.instruction as Omit<UIInstruction, 'id' | 'timestamp'>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'clearQueue':
          service.clearQueue(
            params.saveId as string,
            params.characterId as string
          );
          result = undefined;
          this.logWriteOperation(method, params, context);
          break;

        case 'showNotification':
          result = service.showNotification(
            params.saveId as string,
            params.characterId as string,
            params.notification as Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'dismissNotification':
          result = service.dismissNotification(
            params.saveId as string,
            params.characterId as string,
            params.notificationId as string
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'cacheComponent':
          result = service.cacheComponent(
            params.componentId as string,
            params.type as string,
            params.props as Record<string, unknown>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'invalidateComponent':
          result = service.invalidateComponent(params.componentId as string);
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in UIDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `UIDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `UIDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
