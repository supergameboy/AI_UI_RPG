import type { 
  GlobalContext, 
  AgentContext, 
  ContextSnapshot, 
  ContextData,
  ContextConflict,
  ContextDiff,
  AgentType 
} from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export interface GlobalContextResponse {
  context: GlobalContext;
  lastUpdated: number;
}

export interface AgentContextResponse {
  contexts: AgentContext[];
}

export interface ContextSnapshotResponse {
  snapshots: ContextSnapshot[];
  total: number;
}

export interface ContextUpdateRequest {
  path: string;
  value: unknown;
  reason: string;
  agentId: AgentType;
}

export interface ContextBatchUpdateRequest {
  updates: ContextUpdateRequest[];
}

export interface ContextMergeRequest {
  agentContexts: AgentContext[];
  strategy?: 'priority' | 'timestamp' | 'manual';
}

export interface ContextMergeResponse {
  success: boolean;
  mergedContext: GlobalContext;
  conflicts: ContextConflict[];
  appliedChanges: ContextData[];
}

class ContextService {
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
   * 获取全局上下文
   */
  async getGlobalContext(saveId: string): Promise<GlobalContextResponse> {
    return this.request<GlobalContextResponse>(`/api/context/global/${saveId}`);
  }

  /**
   * 更新全局上下文
   */
  async updateGlobalContext(saveId: string, data: Partial<GlobalContext>): Promise<GlobalContext> {
    return this.request<GlobalContext>(`/api/context/global/${saveId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 获取智能体上下文
   */
  async getAgentContext(saveId: string, agentId?: AgentType): Promise<AgentContextResponse> {
    const params = new URLSearchParams();
    if (agentId) params.set('agentId', agentId);
    const queryString = params.toString();
    return this.request<AgentContextResponse>(`/api/context/agents/${saveId}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 更新智能体上下文
   */
  async updateAgentContext(
    saveId: string, 
    agentId: AgentType, 
    data: Record<string, unknown>
  ): Promise<AgentContext> {
    return this.request<AgentContext>(`/api/context/agents/${saveId}/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 应用上下文变更
   */
  async applyChanges(saveId: string, changes: ContextData[]): Promise<{
    success: boolean;
    appliedChanges: ContextData[];
    conflicts: ContextConflict[];
  }> {
    return this.request(`/api/context/changes/${saveId}`, {
      method: 'POST',
      body: JSON.stringify({ changes }),
    });
  }

  /**
   * 批量更新上下文
   */
  async batchUpdate(saveId: string, request: ContextBatchUpdateRequest): Promise<{
    success: boolean;
    updatedCount: number;
    conflicts: ContextConflict[];
  }> {
    return this.request(`/api/context/batch/${saveId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 合并上下文
   */
  async mergeContext(saveId: string, request: ContextMergeRequest): Promise<ContextMergeResponse> {
    return this.request<ContextMergeResponse>(`/api/context/merge/${saveId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 获取上下文快照列表
   */
  async getSnapshots(saveId: string, limit?: number): Promise<ContextSnapshotResponse> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    const queryString = params.toString();
    return this.request<ContextSnapshotResponse>(`/api/context/snapshots/${saveId}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 创建上下文快照
   */
  async createSnapshot(saveId: string, requestId?: string): Promise<ContextSnapshot> {
    return this.request<ContextSnapshot>(`/api/context/snapshots/${saveId}`, {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  /**
   * 恢复上下文快照
   */
  async restoreSnapshot(saveId: string, snapshotId: string): Promise<{
    success: boolean;
    restoredContext: GlobalContext;
  }> {
    return this.request(`/api/context/snapshots/${saveId}/${snapshotId}/restore`, {
      method: 'POST',
    });
  }

  /**
   * 获取上下文差异
   */
  async getDiff(saveId: string, fromTimestamp: number, toTimestamp?: number): Promise<ContextDiff[]> {
    const params = new URLSearchParams();
    params.set('from', String(fromTimestamp));
    if (toTimestamp) params.set('to', String(toTimestamp));
    return this.request<ContextDiff[]>(`/api/context/diff/${saveId}?${params.toString()}`);
  }

  /**
   * 获取上下文冲突列表
   */
  async getConflicts(saveId: string, resolved?: boolean): Promise<ContextConflict[]> {
    const params = new URLSearchParams();
    if (resolved !== undefined) params.set('resolved', String(resolved));
    const queryString = params.toString();
    return this.request<ContextConflict[]>(`/api/context/conflicts/${saveId}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 解决上下文冲突
   */
  async resolveConflict(
    saveId: string, 
    conflictId: string, 
    resolution: {
      strategy: 'priority' | 'timestamp' | 'manual';
      resolvedValue?: unknown;
    }
  ): Promise<ContextConflict> {
    return this.request<ContextConflict>(`/api/context/conflicts/${saveId}/${conflictId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution),
    });
  }

  /**
   * 获取上下文路径值
   */
  async getValue(saveId: string, path: string): Promise<{
    value: unknown;
    previousValue?: unknown;
    timestamp: number;
  }> {
    return this.request(`/api/context/value/${saveId}?path=${encodeURIComponent(path)}`);
  }

  /**
   * 设置上下文路径值
   */
  async setValue(
    saveId: string, 
    path: string, 
    value: unknown, 
    agentId: AgentType,
    reason?: string
  ): Promise<{
    success: boolean;
    previousValue?: unknown;
    newValue: unknown;
  }> {
    return this.request(`/api/context/value/${saveId}`, {
      method: 'PUT',
      body: JSON.stringify({ path, value, agentId, reason }),
    });
  }

  /**
   * 清除智能体上下文
   */
  async clearAgentContext(saveId: string, agentId: AgentType): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/context/agents/${saveId}/${agentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 重置全局上下文
   */
  async resetGlobalContext(saveId: string): Promise<GlobalContext> {
    return this.request<GlobalContext>(`/api/context/global/${saveId}/reset`, {
      method: 'POST',
    });
  }
}

export const contextService = new ContextService();
