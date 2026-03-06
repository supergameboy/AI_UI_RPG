import type { ToolType, ToolStatus, ToolResponse, ToolConfig } from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export interface ToolStatusResponse {
  tools: ToolStatus[];
}

export interface ToolConfigResponse {
  configs: ToolConfig[];
}

export interface ToolCallRequest {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  agentId?: string;
  requestId?: string;
}

export interface ToolCallResponse {
  success: boolean;
  callId: string;
  response: ToolResponse;
  duration: number;
}

class ToolService {
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
   * 获取所有工具状态
   */
  async getStatuses(): Promise<ToolStatusResponse> {
    const data = await this.request<{ tools: ToolStatus[] }>('/api/tools');
    return { tools: data.tools };
  }

  /**
   * 获取单个工具状态
   */
  async getStatus(toolType: ToolType): Promise<ToolStatus> {
    const data = await this.request<{ status: ToolStatus }>(`/api/tools/${toolType}`);
    return data.status;
  }

  /**
   * 获取所有工具配置
   */
  async getConfigs(): Promise<ToolConfigResponse> {
    const data = await this.request<{ tools: ToolStatus[] }>('/api/tools');
    const configs: ToolConfig[] = data.tools.map((t) => ({
      id: t.type,
      name: t.name,
      description: '',
      version: '1.0.0',
    }));
    return { configs };
  }

  /**
   * 获取单个工具配置
   */
  async getConfig(toolType: ToolType): Promise<ToolConfig> {
    const data = await this.request<{ config: ToolConfig }>(`/api/tools/${toolType}`);
    return data.config;
  }

  /**
   * 调用工具方法
   */
  async callTool(request: ToolCallRequest): Promise<ToolCallResponse> {
    return this.request<ToolCallResponse>('/api/tools/call', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 批量调用工具
   */
  async callBatch(requests: ToolCallRequest[]): Promise<ToolCallResponse[]> {
    return this.request<ToolCallResponse[]>('/api/tools/call/batch', {
      method: 'POST',
      body: JSON.stringify({ calls: requests }),
    });
  }

  /**
   * 重置工具状态
   */
  async resetStatus(toolType: ToolType): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/tools/status/${toolType}/reset`, {
      method: 'POST',
    });
  }

  /**
   * 获取工具调用历史
   */
  async getHistory(toolType?: ToolType, limit?: number): Promise<{ calls: ToolCallResponse[] }> {
    const params = new URLSearchParams();
    if (toolType) params.set('toolType', toolType);
    if (limit) params.set('limit', String(limit));

    const queryString = params.toString();
    return this.request<{ calls: ToolCallResponse[] }>(`/api/tools/history${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * 清除工具调用历史
   */
  async clearHistory(toolType?: ToolType): Promise<{ success: boolean; message: string }> {
    const params = new URLSearchParams();
    if (toolType) params.set('toolType', toolType);

    const queryString = params.toString();
    return this.request<{ success: boolean; message: string }>(`/api/tools/history${queryString ? `?${queryString}` : ''}`, {
      method: 'DELETE',
    });
  }
}

export const toolService = new ToolService();
