import type {
  LLMConfig,
  Message,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  ModelCapabilities,
  TokenUsage,
} from '@ai-rpg/shared';
import { BaseLLMAdapter } from './BaseLLMAdapter';

interface DeepSeekChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
}

interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface DeepSeekStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

const DEEPSEEK_MODELS: ModelCapabilities[] = [
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    maxTokens: 8192,
    supportsStreaming: true,
    supportsFunctionCall: true,
    supportsVision: false,
    supportsJSON: true,
    contextWindow: 64000,
  },
  {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    maxTokens: 8192,
    supportsStreaming: true,
    supportsFunctionCall: true,
    supportsVision: false,
    supportsJSON: true,
    contextWindow: 64000,
  },
];

export class DeepSeekAdapter extends BaseLLMAdapter {
  readonly name = 'DeepSeek';
  readonly provider = 'deepseek';

  private baseURL = 'https://api.deepseek.com/v1';
  private defaultModel = 'deepseek-chat';

  async initialize(config: LLMConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;

    if (config.baseURL) {
      this.baseURL = config.baseURL;
    }
    if (config.model) {
      this.defaultModel = config.model;
    }

    this._initialized = true;
    console.log(`[${this.name}] Initialized with model: ${this.defaultModel}`);
    console.log(`[${this.name}] API Key: ${this.maskApiKey(config.apiKey)}`);
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this._initialized || !this.config) {
      throw new Error(`${this.name}: Adapter not initialized`);
    }

    const model = options?.model || this.defaultModel;
    const request: DeepSeekChatRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      top_p: options?.topP,
      stop: options?.stop,
      stream: false,
    };

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${this.name} API error: ${response.status} - ${error}`);
      }

      const data: DeepSeekChatResponse = await response.json();
      return this.parseChatResponse(data);
    });
  }

  async *chatStream(
    messages: Message[],
    options?: ChatOptions
  ): AsyncIterable<StreamChunk> {
    if (!this._initialized || !this.config) {
      throw new Error(`${this.name}: Adapter not initialized`);
    }

    const model = options?.model || this.defaultModel;
    const request: DeepSeekChatRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 4096,
      top_p: options?.topP,
      stop: options?.stop,
      stream: true,
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${this.name} API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let id = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              yield { id, delta: '', done: true };
              return;
            }

            try {
              const parsed: DeepSeekStreamResponse = JSON.parse(data);
              id = parsed.id;
              const chunk = this.parseStreamChunk(parsed);
              if (chunk) {
                yield chunk;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  getCapabilities(): ModelCapabilities {
    const model = this.config?.model || this.defaultModel;
    return (
      DEEPSEEK_MODELS.find((m) => m.model === model) || DEEPSEEK_MODELS[0]
    );
  }

  getAvailableModels(): ModelCapabilities[] {
    return DEEPSEEK_MODELS;
  }

  private parseChatResponse(data: DeepSeekChatResponse): ChatResponse {
    const choice = data.choices[0];
    const usage: TokenUsage = {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    };

    this.updateTokenUsage(usage);

    return {
      id: data.id,
      content: choice.message.content,
      model: data.model,
      usage,
      finishReason: this.mapFinishReason(choice.finish_reason),
      created: data.created,
    };
  }

  protected parseStreamChunk(data: unknown): StreamChunk | null {
    const response = data as DeepSeekStreamResponse;
    if (!response.choices || response.choices.length === 0) {
      return null;
    }

    const choice = response.choices[0];
    const content = choice.delta?.content || '';

    return {
      id: response.id,
      delta: content,
      done: choice.finish_reason !== null,
    };
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'error';
    }
  }
}
