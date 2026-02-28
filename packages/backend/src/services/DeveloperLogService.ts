import type { LLMRequestLog, AgentMessageLog, AgentType } from '@ai-rpg/shared';
import { getWebSocketService } from './WebSocketService';

const MAX_LOGS = 100;

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class DeveloperLogService {
  private llmRequests: LLMRequestLog[] = [];
  private agentMessages: AgentMessageLog[] = [];

  addLLMRequest(request: Omit<LLMRequestLog, 'id' | 'timestamp'>): LLMRequestLog {
    const log: LLMRequestLog = {
      ...request,
      id: generateId(),
      timestamp: Date.now(),
    };

    this.llmRequests.unshift(log);
    if (this.llmRequests.length > MAX_LOGS) {
      this.llmRequests = this.llmRequests.slice(0, MAX_LOGS);
    }

    getWebSocketService().broadcastLLMRequest(log);
    return log;
  }

  updateLLMRequest(id: string, updates: Partial<LLMRequestLog>): void {
    const index = this.llmRequests.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.llmRequests[index] = { ...this.llmRequests[index], ...updates };
      getWebSocketService().broadcastLLMUpdate({ id, ...updates });
    }
  }

  addAgentMessage(message: Omit<AgentMessageLog, 'id' | 'timestamp'>): AgentMessageLog {
    const log: AgentMessageLog = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    this.agentMessages.unshift(log);
    if (this.agentMessages.length > MAX_LOGS) {
      this.agentMessages = this.agentMessages.slice(0, MAX_LOGS);
    }

    getWebSocketService().broadcastAgentMessage(log);
    return log;
  }

  getLLMRequests(limit: number = 50): LLMRequestLog[] {
    return this.llmRequests.slice(0, limit);
  }

  getAgentMessages(limit: number = 50): AgentMessageLog[] {
    return this.agentMessages.slice(0, limit);
  }

  clearLLMRequests(): void {
    this.llmRequests = [];
  }

  clearAgentMessages(): void {
    this.agentMessages = [];
  }

  logAgentMessage(
    from: AgentType,
    to: AgentType,
    action: string,
    status: 'sent' | 'received' | 'error',
    payload?: unknown,
    error?: string
  ): AgentMessageLog {
    return this.addAgentMessage({
      from,
      to,
      type: 'agent_message',
      action,
      status,
      payload,
      error,
    });
  }
}

let developerLogService: DeveloperLogService | null = null;

export function getDeveloperLogService(): DeveloperLogService {
  if (!developerLogService) {
    developerLogService = new DeveloperLogService();
  }
  return developerLogService;
}
