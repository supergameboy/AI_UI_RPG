import type {
  ToolType,
  ToolResponse,
  ToolPermission,
  ToolCallContext,
  AgentType,
} from '@ai-rpg/shared';
import { getToolRegistry } from '../tools/ToolRegistry';
import { gameLog } from './GameLogService';

/**
 * Tool 调用请求
 */
export interface ToolCall {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  permission: ToolPermission;
}

/**
 * 重试配置选项
 */
export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始延迟时间（毫秒） */
  initialDelay: number;
  /** 最大延迟时间（毫秒） */
  maxDelay: number;
  /** 退避乘数 */
  backoffMultiplier: number;
  /** 可重试的错误码列表 */
  retryableErrorCodes?: string[];
}

/**
 * 批量执行配置
 */
export interface BatchOptions {
  /** 最大并发数 */
  maxConcurrency: number;
  /** 是否在部分失败时继续执行 */
  continueOnError: boolean;
  /** 单个调用的超时时间（毫秒） */
  timeout?: number;
}

/**
 * 执行器配置
 */
export interface ExecutorConfig {
  /** 默认重试配置 */
  defaultRetryOptions: RetryOptions;
  /** 默认批量执行配置 */
  defaultBatchOptions: BatchOptions;
  /** 是否启用执行日志 */
  enableLogging: boolean;
  /** 结果注入时的最大内容长度 */
  maxResultLength: number;
}

const DEFAULT_CONFIG: ExecutorConfig = {
  defaultRetryOptions: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },
  defaultBatchOptions: {
    maxConcurrency: 10,
    continueOnError: true,
  },
  enableLogging: true,
  maxResultLength: 2000,
};

/**
 * Tool 调用执行器服务
 * 负责执行 Tool 调用、批量处理、重试机制和结果注入
 */
export class ToolCallExecutor {
  private config: ExecutorConfig;

  constructor(config?: Partial<ExecutorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 执行单次 Tool 调用
   * @param call Tool 调用请求
   * @param context 调用上下文（可选）
   * @returns Tool 响应
   */
  async executeCall(
    call: ToolCall,
    context?: Partial<ToolCallContext>
  ): Promise<ToolResponse> {
    const registry = getToolRegistry();
    const tool = registry.getTool(call.toolType);

    if (!tool) {
      const error = {
        success: false as const,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${call.toolType}' not found in registry`,
        },
      };
      this.logExecution(call, error, 0, false);
      return error;
    }

    // 验证方法是否存在
    const methodMetadata = tool.getMethodMetadata(call.method);
    if (!methodMetadata) {
      const error = {
        success: false as const,
        error: {
          code: 'METHOD_NOT_FOUND',
          message: `Method '${call.method}' not found in tool '${call.toolType}'`,
        },
      };
      this.logExecution(call, error, 0, false);
      return error;
    }

    // 验证权限
    const isReadMethod = methodMetadata.isRead;
    if (call.permission === 'read' && !isReadMethod) {
      const error = {
        success: false as const,
        error: {
          code: 'PERMISSION_DENIED',
          message: `Method '${call.method}' is a write method but only read permission was granted`,
          details: { method: call.method, permission: call.permission },
        },
      };
      this.logExecution(call, error, 0, false);
      return error;
    }

    // 构建完整的调用上下文
    const fullContext: ToolCallContext = {
      agentId: context?.agentId ?? ('system' as AgentType),
      requestId: context?.requestId ?? this.generateRequestId(),
      timestamp: context?.timestamp ?? Date.now(),
      permission: call.permission,
    };

    const startTime = Date.now();

    try {
      const result = await registry.executeTool(
        call.toolType,
        call.method,
        call.params,
        fullContext
      );

      const duration = Date.now() - startTime;
      this.logExecution(call, result, duration, result.success);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: ToolResponse = {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { toolType: call.toolType, method: call.method },
        },
      };
      this.logExecution(call, result, duration, false);
      return result;
    }
  }

  /**
   * 批量并行执行 Tool 调用
   * @param calls Tool 调用请求数组
   * @param options 批量执行配置
   * @param context 调用上下文（可选）
   * @returns Tool 响应数组
   */
  async executeBatch(
    calls: ToolCall[],
    options?: Partial<BatchOptions>,
    context?: Partial<ToolCallContext>
  ): Promise<ToolResponse[]> {
    const batchOptions = { ...this.config.defaultBatchOptions, ...options };

    if (calls.length === 0) {
      return [];
    }

    this.log('info', 'Starting batch execution', {
      callCount: calls.length,
      maxConcurrency: batchOptions.maxConcurrency,
    });

    // 如果调用数量小于等于最大并发数，直接并行执行
    if (calls.length <= batchOptions.maxConcurrency) {
      return this.executeBatchParallel(calls, batchOptions, context);
    }

    // 分批执行
    const results: ToolResponse[] = [];
    for (let i = 0; i < calls.length; i += batchOptions.maxConcurrency) {
      const batch = calls.slice(i, i + batchOptions.maxConcurrency);
      const batchResults = await this.executeBatchParallel(
        batch,
        batchOptions,
        context
      );
      results.push(...batchResults);
    }

    this.log('info', 'Batch execution completed', {
      totalCalls: calls.length,
      successCount: results.filter((r) => r.success).length,
      errorCount: results.filter((r) => !r.success).length,
    });

    return results;
  }

  /**
   * 并行执行一批调用
   */
  private async executeBatchParallel(
    calls: ToolCall[],
    options: BatchOptions,
    context?: Partial<ToolCallContext>
  ): Promise<ToolResponse[]> {
    const promises = calls.map((call) => {
      const executePromise = this.executeCall(call, context);

      if (options.timeout) {
        return this.withTimeout(executePromise, options.timeout, call);
      }

      return executePromise;
    });

    if (options.continueOnError) {
      // 使用 allSettled 确保部分失败不影响其他调用
      const settled = await Promise.allSettled(promises);
      return settled.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return {
          success: false,
          error: {
            code: 'BATCH_EXECUTION_ERROR',
            message: result.reason?.message ?? 'Unknown error in batch execution',
          },
        };
      });
    } else {
      return Promise.all(promises);
    }
  }

  /**
   * 为单个调用添加超时限制
   */
  private async withTimeout(
    promise: Promise<ToolResponse>,
    timeout: number,
    call: ToolCall
  ): Promise<ToolResponse> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<ToolResponse>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeout}ms`));
      }, timeout);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: error instanceof Error ? error.message : 'Execution timeout',
          details: { toolType: call.toolType, method: call.method, timeout },
        },
      };
    }
  }

  /**
   * 带重试机制的 Tool 调用
   * @param call Tool 调用请求
   * @param options 重试配置
   * @param context 调用上下文（可选）
   * @returns Tool 响应
   */
  async executeWithRetry(
    call: ToolCall,
    options?: Partial<RetryOptions>,
    context?: Partial<ToolCallContext>
  ): Promise<ToolResponse> {
    const retryOptions = { ...this.config.defaultRetryOptions, ...options };
    let lastResult: ToolResponse | null = null;
    let currentDelay = retryOptions.initialDelay;

    for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
      const result = await this.executeCall(call, context);

      // 成功则直接返回
      if (result.success) {
        if (attempt > 0) {
          this.log('info', 'Retry succeeded', {
            toolType: call.toolType,
            method: call.method,
            attempt: attempt + 1,
          });
        }
        return result;
      }

      lastResult = result;

      // 检查是否为可重试的错误
      const errorCode = result.error?.code;
      const isRetryable = this.isRetryableError(errorCode, retryOptions);

      if (!isRetryable || attempt === retryOptions.maxRetries) {
        this.log('warn', 'Retry exhausted', {
          toolType: call.toolType,
          method: call.method,
          attempts: attempt + 1,
          lastError: errorCode,
        });
        break;
      }

      // 等待后重试
      this.log('debug', 'Retrying after delay', {
        toolType: call.toolType,
        method: call.method,
        attempt: attempt + 1,
        delay: currentDelay,
      });

      await this.sleep(currentDelay);

      // 计算下一次延迟（指数退避）
      currentDelay = Math.min(
        currentDelay * retryOptions.backoffMultiplier,
        retryOptions.maxDelay
      );
    }

    return lastResult!;
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(
    errorCode: string | undefined,
    options: RetryOptions
  ): boolean {
    if (!errorCode) {
      return false;
    }

    // 默认可重试的错误码
    const defaultRetryableCodes = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT_EXCEEDED',
      'TEMPORARY_ERROR',
    ];

    const retryableCodes = options.retryableErrorCodes
      ? [...defaultRetryableCodes, ...options.retryableErrorCodes]
      : defaultRetryableCodes;

    return retryableCodes.includes(errorCode);
  }

  /**
   * 将 Tool 调用结果注入到提示词上下文
   * @param prompt 原始提示词
   * @param results Tool 响应数组
   * @returns 注入结果后的提示词
   */
  injectResult(prompt: string, results: ToolResponse[]): string {
    if (results.length === 0) {
      return prompt;
    }

    const formattedResults = this.formatResultsForInjection(results);
    const injectionSection = `\n\n## Tool Call Results\n\n${formattedResults}\n`;

    // 如果提示词中有占位符，替换它
    if (prompt.includes('{{TOOL_RESULTS}}')) {
      return prompt.replace('{{TOOL_RESULTS}}', formattedResults);
    }

    // 否则追加到末尾
    return prompt + injectionSection;
  }

  /**
   * 格式化结果用于注入
   */
  private formatResultsForInjection(results: ToolResponse[]): string {
    const formattedItems = results.map((result, index) => {
      if (result.success) {
        const dataStr = this.truncateContent(
          JSON.stringify(result.data, null, 2)
        );
        return `### Result ${index + 1} (Success)\n\`\`\`json\n${dataStr}\n\`\`\``;
      } else {
        const errorStr = `${result.error?.code}: ${result.error?.message}`;
        const detailsStr = result.error?.details
          ? `\nDetails: ${JSON.stringify(result.error.details)}`
          : '';
        return `### Result ${index + 1} (Failed)\n${errorStr}${detailsStr}`;
      }
    });

    return formattedItems.join('\n\n');
  }

  /**
   * 截断过长的内容
   */
  private truncateContent(content: string): string {
    if (content.length <= this.config.maxResultLength) {
      return content;
    }
    return (
      content.substring(0, this.config.maxResultLength) +
      `... [truncated, total: ${content.length} chars]`
    );
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 异步等待
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 记录执行日志
   */
  private logExecution(
    call: ToolCall,
    result: ToolResponse,
    duration: number,
    success: boolean
  ): void {
    if (!this.config.enableLogging) {
      return;
    }

    const level = success ? 'debug' : 'warn';
    this.log(level, 'Tool execution', {
      toolType: call.toolType,
      method: call.method,
      permission: call.permission,
      success,
      duration,
      errorCode: result.error?.code,
    });
  }

  /**
   * 统一日志方法
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.config.enableLogging) {
      return;
    }

    gameLog[level]('backend', `[ToolCallExecutor] ${message}`, data);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ExecutorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ExecutorConfig {
    return { ...this.config };
  }
}

// 单例实例
let executorInstance: ToolCallExecutor | null = null;

/**
 * 获取 ToolCallExecutor 单例
 */
export function getToolCallExecutor(
  config?: Partial<ExecutorConfig>
): ToolCallExecutor {
  if (!executorInstance) {
    executorInstance = new ToolCallExecutor(config);
  }
  return executorInstance;
}

/**
 * 重置 ToolCallExecutor 单例
 */
export function resetToolCallExecutor(): void {
  executorInstance = null;
}
