import type {
  AgentType,
  AgentMessage,
  MessagePriority,
  AgentLog,
  ToolType,
  ToolResponse,
  ToolCallPayload,
  ToolResponsePayload,
} from '@ai-rpg/shared';
import { gameLog } from './GameLogService';
import { BindingRouter, getBindingRouter } from '../routing/BindingRouter';

const PRIORITY_ORDER: Record<MessagePriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

interface QueuedMessage {
  message: AgentMessage;
  resolve: (value: AgentMessage) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout> | null;
  enqueuedAt: number;
}

export class MessageQueue {
  private queues: Map<string, QueuedMessage[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private logs: AgentLog[] = [];
  private maxLogs: number = 1000;
  private defaultTimeout: number = 30000;

  constructor(options?: { defaultTimeout?: number; maxLogs?: number }) {
    if (options?.defaultTimeout) {
      this.defaultTimeout = options.defaultTimeout;
    }
    if (options?.maxLogs) {
      this.maxLogs = options.maxLogs;
    }
  }

  enqueue(message: AgentMessage): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const targets = Array.isArray(message.to) ? message.to : [message.to];

      for (const target of targets) {
        const queueKey = this.getQueueKey(target);
        
        if (!this.queues.has(queueKey)) {
          this.queues.set(queueKey, []);
        }

        const queue = this.queues.get(queueKey) as QueuedMessage[];
        
        const queuedMessage: QueuedMessage = {
          message,
          resolve: target === targets[0] ? resolve : () => {},
          reject,
          timeoutId: null,
          enqueuedAt: Date.now(),
        };

        queuedMessage.timeoutId = setTimeout(() => {
          this.handleTimeout(queueKey, queuedMessage);
        }, message.metadata.timeout || this.defaultTimeout);

        queue.push(queuedMessage);
        this.sortQueue(queue);

        this.addLog({
          id: this.generateLogId(),
          timestamp: Date.now(),
          agentType: target,
          direction: 'in',
          message,
          status: 'pending',
        });
      }
    });
  }

  dequeue(agentType: AgentType): AgentMessage | null {
    const queueKey = this.getQueueKey(agentType);
    const queue = this.queues.get(queueKey);

    if (!queue || queue.length === 0) {
      return null;
    }

    const queuedMessage = queue.shift();
    if (!queuedMessage) {
      return null;
    }

    if (queuedMessage.timeoutId) {
      clearTimeout(queuedMessage.timeoutId);
    }

    this.updateLogStatus(queuedMessage.message.id, 'success');

    return queuedMessage.message;
  }

  respond(originalMessage: AgentMessage, response: AgentMessage): void {
    const correlationId = originalMessage.id;
    const logEntry = this.findLogByCorrelationId(correlationId);

    if (logEntry) {
      this.addLog({
        id: this.generateLogId(),
        timestamp: Date.now(),
        agentType: response.from,
        direction: 'out',
        message: response,
        status: 'success',
        processingTime: Date.now() - logEntry.timestamp,
      });
    }

    const queueKey = this.getQueueKey(response.to as AgentType);
    const queue = this.queues.get(queueKey);

    if (queue) {
      const pending = queue.find(q => q.message.id === originalMessage.id);
      if (pending) {
        pending.resolve(response);
      }
    }
  }

  getQueueLength(agentType: AgentType): number {
    const queueKey = this.getQueueKey(agentType);
    const queue = this.queues.get(queueKey);
    return queue ? queue.length : 0;
  }

  getLogs(filter?: {
    agentType?: AgentType;
    direction?: 'in' | 'out';
    status?: 'pending' | 'success' | 'error' | 'timeout';
    limit?: number;
  }): AgentLog[] {
    let logs = [...this.logs];

    if (filter?.agentType) {
      logs = logs.filter(log => log.agentType === filter.agentType);
    }
    if (filter?.direction) {
      logs = logs.filter(log => log.direction === filter.direction);
    }
    if (filter?.status) {
      logs = logs.filter(log => log.status === filter.status);
    }

    logs.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      logs = logs.slice(0, filter.limit);
    }

    return logs;
  }

  /**
   * 获取 Tool 调用日志
   * @param toolType 可选的 Tool 类型过滤
   */
  getToolCallLogs(toolType?: ToolType): AgentLog[] {
    let logs = this.logs.filter(log => log.toolCall !== undefined);
    
    if (toolType) {
      logs = logs.filter(log => log.toolCall?.toolType === toolType);
    }
    
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  setProcessing(agentType: AgentType, isProcessing: boolean): void {
    const queueKey = this.getQueueKey(agentType);
    this.processing.set(queueKey, isProcessing);
  }

  isProcessing(agentType: AgentType): boolean {
    const queueKey = this.getQueueKey(agentType);
    return this.processing.get(queueKey) || false;
  }

  private getQueueKey(agentType: AgentType): string {
    return agentType;
  }

  private sortQueue(queue: QueuedMessage[]): void {
    queue.sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[b.message.metadata.priority] - PRIORITY_ORDER[a.message.metadata.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.enqueuedAt - b.enqueuedAt;
    });
  }

  private handleTimeout(queueKey: string, queuedMessage: QueuedMessage): void {
    const queue = this.queues.get(queueKey);
    if (!queue) return;

    const index = queue.indexOf(queuedMessage);
    if (index > -1) {
      queue.splice(index, 1);
      this.updateLogStatus(queuedMessage.message.id, 'timeout');
      queuedMessage.reject(new Error(`Message timeout: ${queuedMessage.message.id}`));
    }
  }

  private addLog(log: AgentLog): void {
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private updateLogStatus(messageId: string, status: AgentLog['status']): void {
    const log = this.logs.find(l => l.message.id === messageId);
    if (log) {
      log.status = status;
    }
  }

  private findLogByCorrelationId(correlationId: string): AgentLog | undefined {
    return this.logs.find(l => l.message.id === correlationId);
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class MessageRouter {
  private queue: MessageQueue;
  private handlers: Map<AgentType, (message: AgentMessage) => Promise<AgentMessage>> = new Map();
  private bindingRouter: BindingRouter;

  constructor(queue: MessageQueue, bindingRouter?: BindingRouter) {
    this.queue = queue;
    this.bindingRouter = bindingRouter || getBindingRouter();
  }

  registerHandler(
    agentType: AgentType,
    handler: (message: AgentMessage) => Promise<AgentMessage>
  ): void {
    this.handlers.set(agentType, handler);
    gameLog.info('agent', `Registered handler for: ${agentType}`);
  }

  unregisterHandler(agentType: AgentType): void {
    this.handlers.delete(agentType);
    gameLog.info('agent', `Unregistered handler for: ${agentType}`);
  }

  /**
   * 通过 Binding 匹配路由消息
   * @param message 要路由的消息
   * @returns 路由结果消息
   */
  async routeByBinding(message: AgentMessage): Promise<AgentMessage> {
    const messageType = message.type;
    const context: Record<string, unknown> = {
      from: message.from,
      to: message.to,
      action: message.payload.action,
      ...message.payload.context,
    };

    const routeResult = this.bindingRouter.route(messageType, context);
    
    gameLog.debug('agent', 'Binding route result', {
      messageType,
      agentId: routeResult.agentId,
      matched: routeResult.matched,
      bindingId: routeResult.binding?.id,
    });

    if (!routeResult.matched) {
      // 没有匹配的 Binding，fallback 到 handler
      return this.route(message);
    }

    const targetAgent = routeResult.agentId;
    const handler = this.handlers.get(targetAgent);
    
    if (!handler) {
      gameLog.warn('agent', `No handler registered for binding target: ${targetAgent}`);
      return this.route(message);
    }

    try {
      this.queue.setProcessing(targetAgent, true);
      const response = await handler(message);
      return response;
    } catch (error) {
      gameLog.error('agent', `Error routing by binding to ${targetAgent}`, { error });
      throw error;
    } finally {
      this.queue.setProcessing(targetAgent, false);
    }
  }

  async route(message: AgentMessage): Promise<AgentMessage> {
    const targets = Array.isArray(message.to) ? message.to : [message.to];
    const results: AgentMessage[] = [];

    for (const target of targets) {
      const handler = this.handlers.get(target);
      
      if (!handler) {
        gameLog.warn('agent', `No handler registered for: ${target}`);
        continue;
      }

      try {
        this.queue.setProcessing(target, true);
        const response = await handler(message);
        results.push(response);
      } catch (error) {
        gameLog.error('agent', `Error routing to ${target}`, { error });
        throw error;
      } finally {
        this.queue.setProcessing(target, false);
      }
    }

    return results[0];
  }

  /**
   * 调用 Tool
   * @param from 调用方 Agent
   * @param toolType Tool 类型
   * @param method 方法名
   * @param params 参数
   * @param permission 权限类型
   * @returns Tool 响应
   */
  async callTool(
    from: AgentType,
    toolType: ToolType,
    method: string,
    params: Record<string, unknown>,
    permission: 'read' | 'write'
  ): Promise<ToolResponse> {
    const startTime = Date.now();
    const messageId = this.generateMessageId();
    
    const toolCallPayload: ToolCallPayload = {
      toolType,
      method,
      params,
      permission,
    };

    const message: AgentMessage = {
      id: messageId,
      timestamp: startTime,
      from,
      to: from, // Tool 响应返回给调用方
      type: 'tool_call',
      payload: {
        action: method,
        data: params,
      },
      metadata: {
        priority: 'high',
        requiresResponse: true,
      },
      toolCall: toolCallPayload,
    };

    gameLog.debug('agent', 'Tool call initiated', {
      toolType,
      method,
      permission,
      from,
    });

    try {
      // 通过 Binding 路由 Tool 调用
      const response = await this.routeByBinding(message);
      
      const duration = Date.now() - startTime;
      
      // 记录 Tool 调用日志
      this.queue['addLog']({
        id: this.queue['generateLogId'](),
        timestamp: startTime,
        agentType: from,
        direction: 'out',
        message,
        status: 'success',
        processingTime: duration,
        toolCall: {
          toolType,
          method,
          duration,
        },
      });

      // 解析响应
      if (response.toolResponse) {
        return {
          success: response.toolResponse.success,
          data: response.toolResponse.data,
          error: response.toolResponse.error ? {
            code: 'TOOL_ERROR',
            message: response.toolResponse.error,
          } : undefined,
          metadata: {
            duration,
            cached: false,
          },
        };
      }

      return {
        success: true,
        data: response.payload.data,
        metadata: {
          duration,
          cached: false,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      gameLog.error('agent', 'Tool call failed', {
        toolType,
        method,
        error: errorMessage,
        duration,
      });

      // 记录失败的 Tool 调用日志
      this.queue['addLog']({
        id: this.queue['generateLogId'](),
        timestamp: startTime,
        agentType: from,
        direction: 'out',
        message,
        status: 'error',
        error: errorMessage,
        processingTime: duration,
        toolCall: {
          toolType,
          method,
          duration,
        },
      });

      return {
        success: false,
        error: {
          code: 'TOOL_CALL_ERROR',
          message: errorMessage,
        },
        metadata: {
          duration,
          cached: false,
        },
      };
    }
  }

  /**
   * 创建 Tool 响应消息
   * @param from 响应方 Agent
   * @param to 目标 Agent
   * @param toolType Tool 类型
   * @param method 方法名
   * @param result 执行结果
   * @returns Tool 响应消息
   */
  async toolResponse(
    from: AgentType,
    to: AgentType,
    toolType: ToolType,
    method: string,
    result: { success: boolean; data?: unknown; error?: string }
  ): Promise<AgentMessage> {
    const toolResponsePayload: ToolResponsePayload = {
      toolType,
      method,
      success: result.success,
      data: result.data,
      error: result.error,
    };

    const message: AgentMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      from,
      to,
      type: 'tool_response',
      payload: {
        action: method,
        data: (result.data as Record<string, unknown>) ?? {},
      },
      metadata: {
        priority: 'high',
        requiresResponse: false,
      },
      toolResponse: toolResponsePayload,
    };

    gameLog.debug('agent', 'Tool response created', {
      toolType,
      method,
      success: result.success,
      from,
      to,
    });

    return message;
  }

  async send(
    from: AgentType,
    to: AgentType | AgentType[],
    action: string,
    data: Record<string, unknown>,
    options?: {
      priority?: MessagePriority;
      requiresResponse?: boolean;
      timeout?: number;
      context?: Record<string, unknown>;
    }
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      from,
      to,
      type: 'request',
      payload: {
        action,
        data,
        context: options?.context,
      },
      metadata: {
        priority: options?.priority || 'normal',
        requiresResponse: options?.requiresResponse ?? true,
        timeout: options?.timeout,
      },
    };

    return this.queue.enqueue(message);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

let messageQueue: MessageQueue | null = null;
let messageRouter: MessageRouter | null = null;

export function getMessageQueue(): MessageQueue {
  if (!messageQueue) {
    messageQueue = new MessageQueue();
  }
  return messageQueue;
}

export function getMessageRouter(): MessageRouter {
  if (!messageRouter) {
    messageRouter = new MessageRouter(getMessageQueue());
  }
  return messageRouter;
}

export function initializeMessageSystem(options?: {
  defaultTimeout?: number;
  maxLogs?: number;
}): { queue: MessageQueue; router: MessageRouter } {
  messageQueue = new MessageQueue(options);
  messageRouter = new MessageRouter(messageQueue);
  return { queue: messageQueue, router: messageRouter };
}
