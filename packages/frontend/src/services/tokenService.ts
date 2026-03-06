import type { TokenStatistics, TokenUsageRecord, TokenUsageQuery } from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

class TokenService {
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

  async getStatistics(query?: TokenUsageQuery): Promise<TokenStatistics> {
    const params = new URLSearchParams();
    if (query?.startTime) params.set('startTime', String(query.startTime));
    if (query?.endTime) params.set('endTime', String(query.endTime));
    if (query?.agentType) params.set('agentType', query.agentType);
    if (query?.provider) params.set('provider', query.provider);

    return this.request<TokenStatistics>(`/api/token/statistics?${params}`);
  }

  async getUsage(query?: TokenUsageQuery): Promise<TokenUsageRecord[]> {
    const params = new URLSearchParams();
    if (query?.startTime) params.set('startTime', String(query.startTime));
    if (query?.endTime) params.set('endTime', String(query.endTime));
    if (query?.agentType) params.set('agentType', query.agentType);
    if (query?.provider) params.set('provider', query.provider);
    if (query?.limit) params.set('limit', String(query.limit));

    return this.request<TokenUsageRecord[]>(`/api/token/usage?${params}`);
  }

  async reset(): Promise<void> {
    await this.request<void>('/api/token/reset', { method: 'POST' });
  }
}

export const tokenService = new TokenService();
