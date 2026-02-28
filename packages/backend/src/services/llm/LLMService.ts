import type {
  LLMAdapter,
  Message,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  ModelCapabilities,
  LLMProviderConfig,
} from '@ai-rpg/shared';
import { DeepSeekAdapter } from './DeepSeekAdapter';
import { GLMAdapter } from './GLMAdapter';
import { KimiAdapter } from './KimiAdapter';

export interface LLMServiceConfig {
  defaultProvider: string;
  defaultModel: string;
  providers: Record<string, LLMProviderConfig>;
  agentModelMapping: Record<string, string>;
}

export class LLMService {
  private adapters: Map<string, LLMAdapter> = new Map();
  private config: LLMServiceConfig;
  private defaultAdapter: string = 'deepseek';

  constructor(config?: Partial<LLMServiceConfig>) {
    this.config = {
      defaultProvider: config?.defaultProvider || 'deepseek',
      defaultModel: config?.defaultModel || 'deepseek-chat',
      providers: config?.providers || {},
      agentModelMapping: config?.agentModelMapping || {},
    };
    this.defaultAdapter = this.config.defaultProvider;
  }

  async initialize(): Promise<void> {
    for (const [provider, providerConfig] of Object.entries(this.config.providers)) {
      if (providerConfig.apiKey) {
        await this.registerProvider(provider, providerConfig);
      }
    }
    console.log(`[LLMService] Initialized with ${this.adapters.size} adapters`);
  }

  async registerProvider(provider: string, config: LLMProviderConfig): Promise<void> {
    let adapter: LLMAdapter;

    switch (provider) {
      case 'deepseek':
        adapter = new DeepSeekAdapter();
        break;
      case 'glm':
        adapter = new GLMAdapter();
        break;
      case 'kimi':
        adapter = new KimiAdapter();
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    await adapter.initialize({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.defaultModel,
      temperature: undefined,
      maxTokens: undefined,
    });

    this.adapters.set(provider, adapter);
    console.log(`[LLMService] Registered adapter: ${provider}`);
  }

  getAdapter(provider?: string): LLMAdapter {
    const targetProvider = provider || this.defaultAdapter;
    const adapter = this.adapters.get(targetProvider);

    if (!adapter) {
      throw new Error(`Adapter not found: ${targetProvider}`);
    }

    return adapter;
  }

  async chat(
    messages: Message[],
    options?: ChatOptions & { provider?: string }
  ): Promise<ChatResponse> {
    const provider = options?.provider || this.defaultAdapter;
    const adapter = this.getAdapter(provider);
    return adapter.chat(messages, options);
  }

  async *chatStream(
    messages: Message[],
    options?: ChatOptions & { provider?: string }
  ): AsyncIterable<StreamChunk> {
    const provider = options?.provider || this.defaultAdapter;
    const adapter = this.getAdapter(provider);
    yield* adapter.chatStream(messages, options);
  }

  getCapabilities(provider?: string): ModelCapabilities {
    const adapter = this.getAdapter(provider);
    return adapter.getCapabilities();
  }

  getAllCapabilities(): ModelCapabilities[] {
    const capabilities: ModelCapabilities[] = [];
    for (const adapter of this.adapters.values()) {
      capabilities.push(adapter.getCapabilities());
    }
    return capabilities;
  }

  setDefaultProvider(provider: string): void {
    if (!this.adapters.has(provider)) {
      throw new Error(`Provider not registered: ${provider}`);
    }
    this.defaultAdapter = provider;
    console.log(`[LLMService] Default provider set to: ${provider}`);
  }

  setAgentModel(agentType: string, provider: string, model?: string): void {
    this.config.agentModelMapping[agentType] = model 
      ? `${provider}:${model}` 
      : provider;
    console.log(`[LLMService] Agent ${agentType} mapped to: ${this.config.agentModelMapping[agentType]}`);
  }

  getAgentAdapter(agentType: string): LLMAdapter {
    const mapping = this.config.agentModelMapping[agentType];
    
    if (mapping) {
      const [provider] = mapping.split(':');
      return this.getAdapter(provider);
    }

    return this.getAdapter();
  }

  getConfig(): LLMServiceConfig {
    return { ...this.config };
  }

  updateProviderConfig(provider: string, config: Partial<LLMProviderConfig>): void {
    if (config.apiKey !== undefined) {
      this.config.providers[provider] = {
        ...this.config.providers[provider],
        apiKey: config.apiKey,
      };
    }
    if (config.baseURL !== undefined) {
      this.config.providers[provider] = {
        ...this.config.providers[provider],
        baseURL: config.baseURL,
      };
    }
    if (config.defaultModel !== undefined) {
      this.config.providers[provider] = {
        ...this.config.providers[provider],
        defaultModel: config.defaultModel,
      };
    }
  }

  isProviderConfigured(provider: string): boolean {
    const config = this.config.providers[provider];
    return !!(config?.apiKey);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.adapters.keys());
  }

  removeProvider(provider: string): void {
    this.adapters.delete(provider);
    delete this.config.providers[provider];
    console.log(`[LLMService] Removed adapter: ${provider}`);
  }
}

let llmService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmService) {
    throw new Error('LLMService not initialized. Call initializeLLMService() first.');
  }
  return llmService;
}

export async function initializeLLMService(config?: Partial<LLMServiceConfig>): Promise<LLMService> {
  if (llmService) {
    return llmService;
  }

  llmService = new LLMService(config);
  await llmService.initialize();
  return llmService;
}
