import { create } from 'zustand';
import type { AgentType, AgentStatus, AgentConfig, AgentLog } from '@ai-rpg/shared';
import { agentService, AgentServiceStatus, AgentConfigWithMeta, AgentLogQuery } from '../services/agentService';

export type { AgentType } from '@ai-rpg/shared';
export type { AgentConfigWithMeta, AgentLogQuery };

export interface AgentState {
  initialized: boolean;
  started: boolean;
  agents: AgentStatus[];
  configs: AgentConfigWithMeta[];
  statuses: AgentStatus[];
  logs: AgentLog[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  expandedAgent: AgentType | null;
  editingConfig: AgentConfigWithMeta | null;
  refreshInterval: number;
  autoRefresh: boolean;

  fetchStatus: () => Promise<void>;
  fetchStatuses: () => Promise<void>;
  fetchAgentStatus: () => Promise<void>;
  fetchConfigs: () => Promise<void>;
  fetchAgentConfigs: () => Promise<void>;
  fetchLogs: (query?: AgentLogQuery) => Promise<void>;
  clearLogs: () => Promise<void>;
  updateConfig: (type: AgentType, config: Partial<AgentConfig>) => Promise<void>;
  updateAgentConfig: (type: AgentType, config: Partial<AgentConfig>) => Promise<void>;
  resetConfig: (type: AgentType) => Promise<void>;
  resetAgentConfig: (type: AgentType) => Promise<void>;
  startService: () => Promise<void>;
  stopService: () => Promise<void>;
  startAgentService: () => Promise<void>;
  stopAgentService: () => Promise<void>;
  testAgent: (request: { agentType: AgentType; action: string; data: Record<string, unknown> }) => Promise<{ success: boolean; response?: unknown; error?: string }>;
  setExpandedAgent: (agent: AgentType | null) => void;
  setEditingConfig: (config: AgentConfigWithMeta | null) => void;
  setRefreshInterval: (interval: number) => void;
  setAutoRefresh: (enabled: boolean) => void;
  clearError: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

async function apiRequest<T>(
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

export const useAgentStore = create<AgentState>((set, get) => ({
  initialized: false,
  started: false,
  agents: [],
  configs: [],
  statuses: [],
  logs: [],
  loading: false,
  saving: false,
  error: null,
  expandedAgent: null,
  editingConfig: null,
  refreshInterval: 5000,
  autoRefresh: true,

  fetchStatus: async () => {
    set({ loading: true, error: null });
    try {
      const status: AgentServiceStatus = await agentService.getStatus();
      set({
        initialized: status.initialized,
        started: status.started,
        agents: status.agents,
        statuses: status.agents,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取状态失败',
        loading: false,
      });
    }
  },

  fetchStatuses: async () => {
    await get().fetchStatus();
  },

  fetchAgentStatus: async () => {
    await get().fetchStatus();
  },

  fetchConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const result = await agentService.getAllConfigs();
      set({
        configs: result.configs,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取配置失败',
        loading: false,
      });
    }
  },

  fetchAgentConfigs: async () => {
    await get().fetchConfigs();
  },

  fetchLogs: async (query?: AgentLogQuery) => {
    set({ loading: true, error: null });
    try {
      const result = await agentService.getLogs(query);
      set({
        logs: result.logs,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取日志失败',
        loading: false,
      });
    }
  },

  clearLogs: async () => {
    set({ loading: true, error: null });
    try {
      await agentService.clearLogs();
      set({ logs: [], loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '清除日志失败',
        loading: false,
      });
    }
  },

  updateConfig: async (type: AgentType, config: Partial<AgentConfig>) => {
    set({ saving: true, error: null });
    try {
      await agentService.updateAgentConfig(type, config);
      await get().fetchConfigs();
      set({ saving: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新配置失败',
        saving: false,
      });
      throw error;
    }
  },

  updateAgentConfig: async (type: AgentType, config: Partial<AgentConfig>) => {
    await get().updateConfig(type, config);
  },

  resetConfig: async (type: AgentType) => {
    set({ saving: true, error: null });
    try {
      await agentService.resetAgentConfig(type);
      await get().fetchConfigs();
      const cfg = get().configs.find(c => c.type === type);
      set({ editingConfig: cfg || null, saving: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '重置配置失败',
        saving: false,
      });
      throw error;
    }
  },

  resetAgentConfig: async (type: AgentType) => {
    await get().resetConfig(type);
  },

  startService: async () => {
    set({ loading: true, error: null });
    try {
      const result = await agentService.startService();
      if (result.success) {
        set({ started: result.started, loading: false });
        await get().fetchStatus();
      } else {
        set({ error: result.message, loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '启动服务失败',
        loading: false,
      });
    }
  },

  stopService: async () => {
    set({ loading: true, error: null });
    try {
      const result = await agentService.stopService();
      if (result.success) {
        set({ started: false, loading: false });
        await get().fetchStatus();
      } else {
        set({ error: result.message, loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '停止服务失败',
        loading: false,
      });
    }
  },

  startAgentService: async () => {
    await get().startService();
  },

  stopAgentService: async () => {
    await get().stopService();
  },

  testAgent: async (request: { agentType: AgentType; action: string; data: Record<string, unknown> }) => {
    set({ loading: true, error: null });
    try {
      const result = await apiRequest<{ success: boolean; response?: unknown; error?: string }>('/api/agents/test', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      set({ loading: false });
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : '测试智能体失败',
      };
      set({ error: errorResult.error, loading: false });
      return errorResult;
    }
  },

  setExpandedAgent: (agent: AgentType | null) => {
    const state = get();
    if (agent) {
      const config = state.configs.find(c => c.type === agent);
      set({ expandedAgent: agent, editingConfig: config || null });
    } else {
      set({ expandedAgent: null, editingConfig: null });
    }
  },

  setEditingConfig: (config: AgentConfigWithMeta | null) => {
    set({ editingConfig: config });
  },

  setRefreshInterval: (interval: number) => {
    set({ refreshInterval: interval });
  },

  setAutoRefresh: (enabled: boolean) => {
    set({ autoRefresh: enabled });
  },

  clearError: () => {
    set({ error: null });
  },
}));
