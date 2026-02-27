import type {
  LLMAdapter,
  LLMConfig,
  Message,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  ModelCapabilities,
  TokenUsage,
} from '@ai-rpg/shared';

export abstract class BaseLLMAdapter implements LLMAdapter {
  abstract readonly name: string;
  abstract readonly provider: string;

  protected config: LLMConfig | null = null;
  protected _initialized = false;
  protected tokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  abstract initialize(config: LLMConfig): Promise<void>;
  abstract chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  abstract chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  abstract getCapabilities(): ModelCapabilities;

  isInitialized(): boolean {
    return this._initialized;
  }

  protected validateConfig(config: LLMConfig): void {
    if (!config.apiKey) {
      throw new Error(`${this.name}: API key is required`);
    }
  }

  protected maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '****';
    }
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  protected updateTokenUsage(usage: TokenUsage): void {
    this.tokenUsage.promptTokens += usage.promptTokens;
    this.tokenUsage.completionTokens += usage.completionTokens;
    this.tokenUsage.totalTokens += usage.totalTokens;
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (this.isRetryableError(lastError) && attempt < maxRetries - 1) {
          console.warn(
            `${this.name}: Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`,
            lastError.message
          );
          await this.sleep(delayMs * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  protected isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('429')
    );
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected generateId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config?.apiKey}`,
    };
  }

  protected abstract parseStreamChunk(data: unknown): StreamChunk | null;
}
