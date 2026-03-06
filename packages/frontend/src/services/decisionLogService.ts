import type { 
  DecisionLog, 
  DecisionLogSummary, 
  DecisionLogTraceback,
  AgentType 
} from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export interface DecisionLogListResponse {
  logs: DecisionLog[];
  total: number;
  hasMore: boolean;
}

export interface DecisionLogSummaryResponse {
  logs: DecisionLogSummary[];
  total: number;
}

export interface QueryOptions {
  requestId?: string;
  playerId?: string;
  saveId?: string;
  startTime?: number;
  endTime?: number;
  agentId?: AgentType;
  hasConflicts?: boolean;
  success?: boolean;
  limit?: number;
  offset?: number;
}

class DecisionLogService {
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

    const json = await response.json();
    // 后端返回 { success, data, meta } 格式，需要提取 data
    return json.data !== undefined ? json.data : json;
  }

  /**
   * 获取决策日志列表
   */
  async getLogs(options: QueryOptions = {}): Promise<DecisionLogListResponse> {
    const params = new URLSearchParams();
    if (options.requestId) params.set('requestId', options.requestId);
    if (options.playerId) params.set('playerId', options.playerId);
    if (options.saveId) params.set('saveId', options.saveId);
    if (options.startTime) params.set('startTime', String(options.startTime));
    if (options.endTime) params.set('endTime', String(options.endTime));
    if (options.agentId) params.set('agentId', options.agentId);
    if (options.hasConflicts !== undefined) params.set('hasConflicts', String(options.hasConflicts));
    if (options.success !== undefined) params.set('success', String(options.success));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    return this.request<DecisionLogListResponse>(`/api/decision-logs${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 获取决策日志摘要列表
   */
  async getSummaries(options: QueryOptions = {}): Promise<DecisionLogSummaryResponse> {
    const params = new URLSearchParams();
    if (options.requestId) params.set('requestId', options.requestId);
    if (options.playerId) params.set('playerId', options.playerId);
    if (options.saveId) params.set('saveId', options.saveId);
    if (options.startTime) params.set('startTime', String(options.startTime));
    if (options.endTime) params.set('endTime', String(options.endTime));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const queryString = params.toString();
    return this.request<DecisionLogSummaryResponse>(`/api/decision-logs/summaries${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 获取单个决策日志详情
   */
  async getLogById(id: string): Promise<DecisionLog> {
    return this.request<DecisionLog>(`/api/decision-logs/${id}`);
  }

  /**
   * 按 requestId 获取决策日志
   */
  async getLogsByRequestId(requestId: string): Promise<DecisionLog[]> {
    return this.request<DecisionLog[]>(`/api/decision-logs/request/${requestId}`);
  }

  /**
   * 按时间范围获取决策日志
   */
  async getLogsByTimeRange(startTime: number, endTime: number): Promise<DecisionLog[]> {
    const params = new URLSearchParams();
    params.set('startTime', String(startTime));
    params.set('endTime', String(endTime));
    return this.request<DecisionLog[]>(`/api/decision-logs/time-range?${params.toString()}`);
  }

  /**
   * 追溯问题 - 获取相关日志和状态变化
   */
  async traceback(requestId: string): Promise<DecisionLogTraceback> {
    return this.request<DecisionLogTraceback>(`/api/decision-logs/traceback/${requestId}`);
  }

  /**
   * 获取有冲突的决策日志
   */
  async getLogsWithConflicts(limit?: number): Promise<DecisionLog[]> {
    const params = new URLSearchParams();
    params.set('hasConflicts', 'true');
    if (limit) params.set('limit', String(limit));
    return this.request<DecisionLog[]>(`/api/decision-logs?${params.toString()}`);
  }

  /**
   * 获取失败的决策日志
   */
  async getFailedLogs(limit?: number): Promise<DecisionLog[]> {
    const params = new URLSearchParams();
    params.set('success', 'false');
    if (limit) params.set('limit', String(limit));
    return this.request<DecisionLog[]>(`/api/decision-logs?${params.toString()}`);
  }

  /**
   * 获取统计信息
   */
  async getStats(saveId?: string): Promise<{
    total: number;
    successCount: number;
    failureCount: number;
    conflictCount: number;
    averageDuration: number;
    agentStats: Record<AgentType, { count: number; avgDuration: number }>;
  }> {
    const params = new URLSearchParams();
    if (saveId) params.set('saveId', saveId);
    const queryString = params.toString();
    return this.request(`/api/decision-logs/stats${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 删除决策日志
   */
  async deleteLog(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/decision-logs/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * 清理过期日志
   */
  async cleanup(olderThanDays: number): Promise<{ success: boolean; deletedCount: number }> {
    return this.request<{ success: boolean; deletedCount: number }>('/api/decision-logs/cleanup', {
      method: 'POST',
      body: JSON.stringify({ olderThanDays }),
    });
  }

  /**
   * 导出决策日志
   */
  async exportLogs(options: QueryOptions = {}): Promise<Blob> {
    const params = new URLSearchParams();
    if (options.saveId) params.set('saveId', options.saveId);
    if (options.startTime) params.set('startTime', String(options.startTime));
    if (options.endTime) params.set('endTime', String(options.endTime));

    const queryString = params.toString();
    const url = `${API_BASE}/api/decision-logs/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to export logs');
    }
    return response.blob();
  }
}

export const decisionLogService = new DecisionLogService();
