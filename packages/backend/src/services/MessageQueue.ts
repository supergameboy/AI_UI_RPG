import type {
  AgentType,
  AgentMessage,
  MessagePriority,
  AgentLog,
} from '@ai-rpg/shared';

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

  constructor(queue: MessageQueue) {
    this.queue = queue;
  }

  registerHandler(
    agentType: AgentType,
    handler: (message: AgentMessage) => Promise<AgentMessage>
  ): void {
    this.handlers.set(agentType, handler);
    console.log(`[MessageRouter] Registered handler for: ${agentType}`);
  }

  unregisterHandler(agentType: AgentType): void {
    this.handlers.delete(agentType);
    console.log(`[MessageRouter] Unregistered handler for: ${agentType}`);
  }

  async route(message: AgentMessage): Promise<AgentMessage> {
    const targets = Array.isArray(message.to) ? message.to : [message.to];
    const results: AgentMessage[] = [];

    for (const target of targets) {
      const handler = this.handlers.get(target);
      
      if (!handler) {
        console.warn(`[MessageRouter] No handler registered for: ${target}`);
        continue;
      }

      try {
        this.queue.setProcessing(target, true);
        const response = await handler(message);
        results.push(response);
      } catch (error) {
        console.error(`[MessageRouter] Error routing to ${target}:`, error);
        throw error;
      } finally {
        this.queue.setProcessing(target, false);
      }
    }

    return results[0];
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
