import type {
  TokenUsageRecord,
  TokenStatistics,
  TokenUsageQuery,
  TokenPricing,
  ProviderPricing,
} from '@ai-rpg/shared';
import { DEFAULT_PRICING } from '@ai-rpg/shared';

const MAX_RECORDS = 1000;

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class TokenUsageService {
  private records: TokenUsageRecord[] = [];
  private pricing: Record<string, ProviderPricing> = DEFAULT_PRICING;

  recordUsage(params: {
    agentType: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    duration: number;
  }): TokenUsageRecord {
    const totalTokens = params.promptTokens + params.completionTokens;
    const estimatedCost = this.calculateCost(
      params.provider,
      params.model,
      params.promptTokens,
      params.completionTokens
    );

    const record: TokenUsageRecord = {
      id: generateId(),
      timestamp: Date.now(),
      agentType: params.agentType,
      provider: params.provider,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens,
      estimatedCost,
      duration: params.duration,
    };

    this.records.unshift(record);
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(0, MAX_RECORDS);
    }

    return record;
  }

  calculateCost(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const providerPricing = this.pricing[provider];
    if (!providerPricing) return 0;

    const modelPricing = providerPricing[model];
    if (!modelPricing) return 0;

    const inputCost = (promptTokens / 1000) * modelPricing.inputPricePer1k;
    const outputCost = (completionTokens / 1000) * modelPricing.outputPricePer1k;
    return inputCost + outputCost;
  }

  getStatistics(query?: TokenUsageQuery): TokenStatistics {
    let filtered = this.records;

    if (query?.startTime) {
      filtered = filtered.filter(r => r.timestamp >= query.startTime!);
    }
    if (query?.endTime) {
      filtered = filtered.filter(r => r.timestamp <= query.endTime!);
    }
    if (query?.agentType) {
      filtered = filtered.filter(r => r.agentType === query.agentType);
    }
    if (query?.provider) {
      filtered = filtered.filter(r => r.provider === query.provider);
    }

    const stats: TokenStatistics = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      requestCount: filtered.length,
      byAgent: {},
      byProvider: {},
    };

    for (const record of filtered) {
      stats.totalPromptTokens += record.promptTokens;
      stats.totalCompletionTokens += record.completionTokens;
      stats.totalTokens += record.totalTokens;
      stats.totalCost += record.estimatedCost;

      if (!stats.byAgent[record.agentType]) {
        stats.byAgent[record.agentType] = {
          promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, requestCount: 0,
        };
      }
      stats.byAgent[record.agentType].promptTokens += record.promptTokens;
      stats.byAgent[record.agentType].completionTokens += record.completionTokens;
      stats.byAgent[record.agentType].totalTokens += record.totalTokens;
      stats.byAgent[record.agentType].cost += record.estimatedCost;
      stats.byAgent[record.agentType].requestCount++;

      if (!stats.byProvider[record.provider]) {
        stats.byProvider[record.provider] = {
          promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, requestCount: 0,
        };
      }
      stats.byProvider[record.provider].promptTokens += record.promptTokens;
      stats.byProvider[record.provider].completionTokens += record.completionTokens;
      stats.byProvider[record.provider].totalTokens += record.totalTokens;
      stats.byProvider[record.provider].cost += record.estimatedCost;
      stats.byProvider[record.provider].requestCount++;
    }

    return stats;
  }

  getRecords(query?: TokenUsageQuery): TokenUsageRecord[] {
    let filtered = this.records;
    if (query?.startTime) filtered = filtered.filter(r => r.timestamp >= query.startTime!);
    if (query?.endTime) filtered = filtered.filter(r => r.timestamp <= query.endTime!);
    if (query?.agentType) filtered = filtered.filter(r => r.agentType === query.agentType);
    if (query?.provider) filtered = filtered.filter(r => r.provider === query.provider);
    return filtered.slice(0, query?.limit || 100);
  }

  reset(): void {
    this.records = [];
  }

  getPricing(): Record<string, ProviderPricing> {
    return { ...this.pricing };
  }

  updatePricing(provider: string, model: string, pricing: TokenPricing): void {
    if (!this.pricing[provider]) this.pricing[provider] = {};
    this.pricing[provider][model] = pricing;
  }
}

let tokenUsageService: TokenUsageService | null = null;

export function getTokenUsageService(): TokenUsageService {
  if (!tokenUsageService) {
    tokenUsageService = new TokenUsageService();
  }
  return tokenUsageService;
}
