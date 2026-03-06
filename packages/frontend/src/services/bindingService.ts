import type { 
  Binding, 
  BindingConfig, 
  BindingTestRequest, 
  BindingTestResult,
  AgentType 
} from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export interface BindingListResponse {
  bindings: Binding[];
  total: number;
}

export interface BindingCreateRequest {
  agentId: AgentType;
  match: Binding['match'];
  priority: number;
  enabled: boolean;
  description?: string;
}

export interface BindingUpdateRequest {
  agentId?: AgentType;
  match?: Binding['match'];
  priority?: number;
  enabled?: boolean;
  description?: string;
}

class BindingService {
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
   * 获取所有绑定
   */
  async getBindings(): Promise<BindingListResponse> {
    const data = await this.request<{ bindings: Binding[]; stats: unknown }>('/api/bindings');
    return { bindings: data.bindings, total: data.bindings.length };
  }

  /**
   * 获取单个绑定
   */
  async getBinding(bindingId: string): Promise<Binding> {
    const data = await this.request<{ bindings: Binding[] }>(`/api/bindings/${bindingId}`);
    return data.bindings[0];
  }

  /**
   * 创建绑定
   */
  async createBinding(request: BindingCreateRequest): Promise<Binding> {
    return this.request<Binding>('/api/bindings', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 更新绑定
   */
  async updateBinding(bindingId: string, request: BindingUpdateRequest): Promise<Binding> {
    return this.request<Binding>(`/api/bindings/${bindingId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * 删除绑定
   */
  async deleteBinding(bindingId: string): Promise<{ success: boolean; message: string }> {
    const data = await this.request<{ deleted: boolean; bindingId: string }>(`/api/bindings/${bindingId}`, {
      method: 'DELETE',
    });
    return { success: true, message: `Binding ${data.bindingId} deleted` };
  }

  /**
   * 启用/禁用绑定
   */
  async toggleBinding(bindingId: string, enabled: boolean): Promise<Binding> {
    return this.request<Binding>(`/api/bindings/${bindingId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  /**
   * 测试绑定匹配
   */
  async testBinding(request: BindingTestRequest): Promise<BindingTestResult> {
    return this.request<BindingTestResult>('/api/bindings/test', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 获取绑定配置
   */
  async getConfig(): Promise<BindingConfig> {
    return this.request<BindingConfig>('/api/bindings/config');
  }

  /**
   * 更新绑定配置
   */
  async updateConfig(config: Partial<BindingConfig>): Promise<BindingConfig> {
    return this.request<BindingConfig>('/api/bindings/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * 重置绑定到默认值
   */
  async resetBindings(): Promise<{ success: boolean; message: string }> {
    await this.request<{ reset: boolean }>('/api/bindings/reset', {
      method: 'POST',
    });
    return { success: true, message: 'Bindings reset successfully' };
  }

  /**
   * 按智能体获取绑定
   */
  async getBindingsByAgent(agentId: AgentType): Promise<Binding[]> {
    const data = await this.request<{ bindings: Binding[] }>(`/api/bindings/agent/${agentId}`);
    return data.bindings;
  }

  /**
   * 批量更新绑定优先级
   */
  async updatePriorities(updates: { id: string; priority: number }[]): Promise<{ success: boolean; message: string }> {
    const data = await this.request<{ updated: number }>('/api/bindings/priorities', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
    return { success: true, message: `Updated ${data.updated} bindings` };
  }
}

export const bindingService = new BindingService();
