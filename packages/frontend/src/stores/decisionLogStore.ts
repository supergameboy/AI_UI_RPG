import { create } from 'zustand';
import { decisionLogService, QueryOptions } from '../services/decisionLogService';
import type { 
  DecisionLog, 
  DecisionLogSummary, 
  DecisionLogTraceback,
  AgentType 
} from '@ai-rpg/shared';

export interface DecisionLogState {
  logs: DecisionLog[];
  summaries: DecisionLogSummary[];
  currentLog: DecisionLog | null;
  tracebackResult: DecisionLogTraceback | null;
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  
  // 统计信息
  stats: {
    total: number;
    successCount: number;
    failureCount: number;
    conflictCount: number;
    averageDuration: number;
    agentStats: Record<AgentType, { count: number; avgDuration: number }>;
  } | null;
  
  // 基础方法
  fetchLogs: (options?: QueryOptions) => Promise<void>;
  fetchSummaries: (options?: QueryOptions) => Promise<void>;
  fetchLogById: (id: string) => Promise<void>;
  fetchByRequestId: (requestId: string) => Promise<void>;
  fetchByTimeRange: (start: number, end: number) => Promise<void>;
  traceback: (requestId: string) => Promise<DecisionLogTraceback>;
  
  // 过滤方法
  fetchLogsWithConflicts: (limit?: number) => Promise<void>;
  fetchFailedLogs: (limit?: number) => Promise<void>;
  
  // 统计方法
  fetchStats: (saveId?: string) => Promise<void>;
  
  // 清理方法
  clearCurrentLog: () => void;
  clearTraceback: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  logs: [],
  summaries: [],
  currentLog: null,
  tracebackResult: null,
  loading: false,
  error: null,
  total: 0,
  hasMore: false,
  stats: null,
};

export const useDecisionLogStore = create<DecisionLogState>((set) => ({
  ...initialState,

  fetchLogs: async (options: QueryOptions = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await decisionLogService.getLogs(options);
      set({
        logs: result.logs,
        total: result.total,
        hasMore: result.hasMore,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取决策日志失败',
        loading: false,
      });
    }
  },

  fetchSummaries: async (options: QueryOptions = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await decisionLogService.getSummaries(options);
      set({
        summaries: result.logs,
        total: result.total,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取决策日志摘要失败',
        loading: false,
      });
    }
  },

  fetchLogById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const log = await decisionLogService.getLogById(id);
      set({
        currentLog: log,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取决策日志详情失败',
        loading: false,
      });
    }
  },

  fetchByRequestId: async (requestId: string) => {
    set({ loading: true, error: null });
    try {
      const logs = await decisionLogService.getLogsByRequestId(requestId);
      set({
        logs,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '按请求ID获取日志失败',
        loading: false,
      });
    }
  },

  fetchByTimeRange: async (start: number, end: number) => {
    set({ loading: true, error: null });
    try {
      const logs = await decisionLogService.getLogsByTimeRange(start, end);
      set({
        logs,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '按时间范围获取日志失败',
        loading: false,
      });
    }
  },

  traceback: async (requestId: string) => {
    set({ loading: true, error: null });
    try {
      const result = await decisionLogService.traceback(requestId);
      set({
        tracebackResult: result,
        currentLog: result.log,
        loading: false,
      });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '追溯问题失败',
        loading: false,
      });
      throw error;
    }
  },

  fetchLogsWithConflicts: async (limit?: number) => {
    set({ loading: true, error: null });
    try {
      const logs = await decisionLogService.getLogsWithConflicts(limit);
      set({
        logs,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取冲突日志失败',
        loading: false,
      });
    }
  },

  fetchFailedLogs: async (limit?: number) => {
    set({ loading: true, error: null });
    try {
      const logs = await decisionLogService.getFailedLogs(limit);
      set({
        logs,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取失败日志失败',
        loading: false,
      });
    }
  },

  fetchStats: async (saveId?: string) => {
    set({ loading: true, error: null });
    try {
      const stats = await decisionLogService.getStats(saveId);
      set({
        stats,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取统计信息失败',
        loading: false,
      });
    }
  },

  clearCurrentLog: () => {
    set({ currentLog: null });
  },

  clearTraceback: () => {
    set({ tracebackResult: null });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
