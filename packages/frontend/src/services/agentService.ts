import type { AgentType, AgentStatus, AgentLog, AgentConfig } from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export type AgentStatusType = 'idle' | 'processing' | 'waiting' | 'error';

export interface AgentServiceStatus {
  initialized: boolean;
  started: boolean;
  agents: AgentStatus[];
}

export interface AgentConfigWithMeta extends AgentConfig {
  type: AgentType;
  description?: string;
  capabilities?: string[];
}

export interface AgentLogQuery {
  agentType?: AgentType;
  direction?: 'in' | 'out';
  status?: 'pending' | 'success' | 'error' | 'timeout';
  limit?: number;
}

export interface AgentConfigUpdate {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const STATUS_COLORS: Record<string, string> = {
  idle: '#10b981',
  processing: '#3b82f6',
  waiting: '#f59e0b',
  error: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  idle: '空闲',
  processing: '处理中',
  waiting: '等待',
  error: '错误',
};

const AGENT_NAMES: Record<string, string> = {
  coordinator: '协调器',
  story_context: '故事上下文',
  quest: '任务管理',
  map: '地图管理',
  npc_party: 'NPC管理',
  numerical: '数值管理',
  inventory: '背包系统',
  skill: '技能管理',
  ui: 'UI管理',
  combat: '战斗管理',
  dialogue: '对话管理',
  event: '事件管理',
};

class AgentService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  async getStatus(): Promise<AgentServiceStatus> {
    return this.request<AgentServiceStatus>('/api/agents/status');
  }

  async getAgentStatus(type: AgentType): Promise<AgentStatus> {
    return this.request<AgentStatus>(`/api/agents/status/${type}`);
  }

  async startService(): Promise<{ success: boolean; message: string; started: boolean }> {
    return this.request<{ success: boolean; message: string; started: boolean }>('/api/agents/start', {
      method: 'POST',
    });
  }

  async stopService(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/agents/stop', {
      method: 'POST',
    });
  }

  async getLogs(query: AgentLogQuery = {}): Promise<{ logs: AgentLog[] }> {
    const params = new URLSearchParams();
    if (query.agentType) params.set('agentType', query.agentType);
    if (query.direction) params.set('direction', query.direction);
    if (query.status) params.set('status', query.status);
    if (query.limit) params.set('limit', String(query.limit));
    
    const queryString = params.toString();
    return this.request<{ logs: AgentLog[] }>(`/api/agents/logs${queryString ? `?${queryString}` : ''}`);
  }

  async clearLogs(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/agents/logs', {
      method: 'DELETE',
    });
  }

  async getAgentConfig(type: AgentType): Promise<AgentConfigWithMeta> {
    return this.request<AgentConfigWithMeta>(`/api/agents/config/${type}`);
  }

  async getAllConfigs(): Promise<{ configs: AgentConfigWithMeta[] }> {
    const result = await this.request<{ configs: Record<string, AgentConfigWithMeta> }>('/api/agents/config');
    const configs = Object.entries(result.configs).map(([type, config]) => ({
      ...config,
      type: type as AgentType,
    }));
    return { configs };
  }

  async updateAgentConfig(type: AgentType, config: Partial<AgentConfig>): Promise<AgentConfig> {
    return this.request<AgentConfig>(`/api/agents/config/${type}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async resetAgentConfig(type: AgentType): Promise<AgentConfig> {
    return this.request<AgentConfig>(`/api/agents/config/${type}/reset`, {
      method: 'POST',
    });
  }

  formatProcessingTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  getStatusColor(status: AgentStatusType): string {
    return STATUS_COLORS[status] || STATUS_COLORS.idle;
  }

  getStatusLabel(status: AgentStatusType): string {
    return STATUS_LABELS[status] || status;
  }

  getAgentTypeName(type: string): string {
    return AGENT_NAMES[type] || type;
  }
}

export const agentService = new AgentService();
