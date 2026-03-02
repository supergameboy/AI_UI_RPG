import type { TokenStatistics, TokenUsageRecord, TokenUsageQuery } from '@ai-rpg/shared';

const API_BASE = '/api/token';

class TokenService {
  async getStatistics(query?: TokenUsageQuery): Promise<TokenStatistics> {
    const params = new URLSearchParams();
    if (query?.startTime) params.set('startTime', String(query.startTime));
    if (query?.endTime) params.set('endTime', String(query.endTime));
    if (query?.agentType) params.set('agentType', query.agentType);
    if (query?.provider) params.set('provider', query.provider);

    const response = await fetch(`${API_BASE}/statistics?${params}`);
    const data = await response.json();
    return data.data;
  }

  async getUsage(query?: TokenUsageQuery): Promise<TokenUsageRecord[]> {
    const params = new URLSearchParams();
    if (query?.startTime) params.set('startTime', String(query.startTime));
    if (query?.endTime) params.set('endTime', String(query.endTime));
    if (query?.agentType) params.set('agentType', query.agentType);
    if (query?.provider) params.set('provider', query.provider);
    if (query?.limit) params.set('limit', String(query.limit));

    const response = await fetch(`${API_BASE}/usage?${params}`);
    const data = await response.json();
    return data.data;
  }

  async reset(): Promise<void> {
    await fetch(`${API_BASE}/reset`, { method: 'POST' });
  }
}

export const tokenService = new TokenService();
