import { BaseLLMAdapter } from './BaseLLMAdapter';
import type {
  LLMConfig,
  Message,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  ModelCapabilities,
  TokenUsage,
} from '@ai-rpg/shared';

interface KimiChatRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
}

interface KimiChatChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string | null;
}

interface KimiChatResponse {
  id: string;
  created: number;
  model: string;
  choices: KimiChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface KimiStreamResponse {
  id: string;
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
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const KIMI_MODELS: ModelCapabilities[] = [
  {
    provider: 'kimi',
    model: 'moonshot-v1-8k',
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctionCall: false,
    supportsVision: false,
    supportsJSON: true,
    contextWindow: 8192,
  },
  {
    provider: 'kimi',
    model: 'moonshot-v1-32k',
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctionCall: false,
    supportsVision: false,
    supportsJSON: true,
    contextWindow: 32768,
  },
  {
    provider: 'kimi',
    model: 'moonshot-v1-128k',
    maxTokens: 4096,
    supportsStreaming: true,
    supportsFunctionCall: false,
    supportsVision: false,
    supportsJSON: true,
    contextWindow: 131072,
  },
];

export class KimiAdapter extends BaseLLMAdapter {
  readonly name = 'Kimi';
  readonly provider = 'kimi';

  private baseURL = 'https://api.moonshot.cn/v1';
  private defaultModel = 'moonshot-v1-8k';

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
    const request: KimiChatRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.3,
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

      const data: KimiChatResponse = await response.json();
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
    const request: KimiChatRequest = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.3,
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
              const parsed: KimiStreamResponse = JSON.parse(data);
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

  protected parseChatResponse(data: KimiChatResponse): ChatResponse {
    const content = data.choices
      .map((c) => c.message?.content || '')
      .join('');

    const usage: TokenUsage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };
    this.updateTokenUsage(usage);

    return {
      id: data.id,
      content,
      model: data.model,
      usage,
      finishReason: this.mapFinishReason(data.choices[0]?.finish_reason),
      created: data.created,
    };
  }

  protected parseStreamChunk(data: KimiStreamResponse): StreamChunk | null {
    if (!data.choices || data.choices.length === 0) {
      return null;
    }

    const delta = data.choices[0]?.delta?.content || '';
    const done = data.choices[0]?.finish_reason === 'stop';

    let usage: TokenUsage | undefined;
    if (data.usage) {
      usage = {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      };
    }

    return {
      id: data.id,
      delta,
      done,
      usage,
    };
  }

  getCapabilities(): ModelCapabilities {
    const model = this.defaultModel;
    const capabilities = KIMI_MODELS.find((m) => m.model === model);
    if (capabilities) {
      return capabilities;
    }
    return KIMI_MODELS[0];
  }

  private mapFinishReason(reason: string | null): ChatResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      default:
        return 'stop';
    }
  }
}
