/**
 * Agent 相关常量
 */

/**
 * 消息处理间隔（毫秒）
 */
export const DEFAULT_PROCESS_INTERVAL_MS = 100;

/**
 * 短期记忆最大条数
 */
export const MAX_SHORT_TERM_MEMORY = 50;

/**
 * 中期记忆最大条数
 */
export const MAX_MID_TERM_MEMORY = 100;

/**
 * 默认 LLM 配置
 */
export const DEFAULT_LLM_CONFIG = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
  timeout: 30000,
  maxRetries: 3,
} as const;

/**
 * 默认温度参数
 */
export const DEFAULT_TEMPERATURE = 0.7;

/**
 * 默认最大 Token 数
 */
export const DEFAULT_MAX_TOKENS = 2048;

/**
 * 默认超时时间（毫秒）
 */
export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * 默认最大重试次数
 */
export const DEFAULT_MAX_RETRIES = 3;
