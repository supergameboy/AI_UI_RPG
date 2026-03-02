/**
 * Token 使用记录
 */
export interface TokenUsageRecord {
  id: string;
  timestamp: number;
  agentType: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  duration: number;
}

/**
 * Token 价格配置
 */
export interface TokenPricing {
  inputPricePer1k: number;   // 输入每1k token价格（美元）
  outputPricePer1k: number;  // 输出每1k token价格（美元）
}

/**
 * 提供商价格配置
 */
export interface ProviderPricing {
  [model: string]: TokenPricing;
}

/**
 * Token 统计信息
 */
export interface TokenStatistics {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  byAgent: Record<string, {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    requestCount: number;
  }>;
  byProvider: Record<string, {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    requestCount: number;
  }>;
}

/**
 * Token 使用查询参数
 */
export interface TokenUsageQuery {
  startTime?: number;
  endTime?: number;
  agentType?: string;
  provider?: string;
  limit?: number;
}

/**
 * 默认价格配置（美元/1k tokens）
 */
export const DEFAULT_PRICING: Record<string, ProviderPricing> = {
  deepseek: {
    'deepseek-chat': { inputPricePer1k: 0.0005, outputPricePer1k: 0.001 },
    'deepseek-reasoner': { inputPricePer1k: 0.001, outputPricePer1k: 0.002 },
  },
  glm: {
    'glm-4': { inputPricePer1k: 0.014, outputPricePer1k: 0.014 },
    'glm-4-flash': { inputPricePer1k: 0.0001, outputPricePer1k: 0.0001 },
  },
  kimi: {
    'moonshot-v1-8k': { inputPricePer1k: 0.012, outputPricePer1k: 0.012 },
    'moonshot-v1-32k': { inputPricePer1k: 0.024, outputPricePer1k: 0.024 },
  },
  openai: {
    'gpt-4o': { inputPricePer1k: 0.005, outputPricePer1k: 0.015 },
    'gpt-4o-mini': { inputPricePer1k: 0.00015, outputPricePer1k: 0.0006 },
  },
};
