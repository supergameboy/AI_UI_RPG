import type {
  LLMAdapter,
  Message,
  ChatOptions,
  ChatResponse,
  StreamChunk,
  ModelCapabilities,
  LLMProviderConfig,
  AgentType,
} from '@ai-rpg/shared';
import { DeepSeekAdapter } from './DeepSeekAdapter';
import { GLMAdapter } from './GLMAdapter';
import { KimiAdapter } from './KimiAdapter';
import { getDeveloperLogService } from '../DeveloperLogService';
import { getTokenUsageService } from '../TokenUsageService';
import { gameLog } from '../GameLogService';

const MAX_LOG_LENGTH = 2000;

function truncateContent(content: string, maxLength: number = MAX_LOG_LENGTH): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + `... [truncated, total: ${content.length} chars]`;
}

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
    options?: ChatOptions & { provider?: string; agentType?: string }
  ): Promise<ChatResponse> {
    const provider = options?.provider || this.defaultAdapter;
    const adapter = this.getAdapter(provider);
    const startTime = Date.now();
    
    const logService = getDeveloperLogService();
    
    const capabilities = adapter.getCapabilities();
    
    // GameLog: LLM调用开始
    gameLog.debug('llm', 'LLM调用开始', { 
      provider, 
      model: capabilities.model, 
      messageCount: messages.length 
    });
    
    // GameLog: LLM调用输入
    gameLog.debug('llm', 'LLM调用输入', { 
      provider, 
      model: capabilities.model,
      messages: messages.map(m => ({
        role: m.role,
        content: truncateContent(m.content)
      }))
    });
    
    const requestLog = logService.addLLMRequest({
      agentType: (options?.agentType as AgentType) || 'unknown',
      provider,
      model: capabilities.model,
      status: 'pending',
      duration: 0,
      promptTokens: 0,
      completionTokens: 0,
      prompt: JSON.stringify(messages, null, 2),
    });
    const requestId = requestLog.id;

    try {
      const response = await adapter.chat(messages, options);
      
      logService.updateLLMRequest(requestId, {
        status: 'success',
        duration: Date.now() - startTime,
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        response: response.content,
      });
      
      // 记录 Token 使用
      const usage = response.usage;
      if (usage) {
        getTokenUsageService().recordUsage({
          agentType: (options?.agentType as string) || 'unknown',
          provider,
          model: capabilities.model,
          promptTokens: usage.promptTokens || 0,
          completionTokens: usage.completionTokens || 0,
          duration: Date.now() - startTime,
        });
      }
      
      // GameLog: LLM调用成功
      gameLog.info('llm', 'LLM调用成功', { 
        provider, 
        model: capabilities.model, 
        promptTokens: usage?.promptTokens || 0,
        completionTokens: usage?.completionTokens || 0,
        duration: Date.now() - startTime 
      });
      
      // GameLog: LLM调用输出
      gameLog.debug('llm', 'LLM调用输出', { 
        provider, 
        model: capabilities.model,
        response: truncateContent(response.content),
        usage: response.usage
      });
      
      return response;
    } catch (error) {
      logService.updateLLMRequest(requestId, {
        status: 'error',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // GameLog: LLM调用失败
      gameLog.error('llm', 'LLM调用失败', { 
        provider, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      throw error;
    }
  }

  async *chatStream(
    messages: Message[],
    options?: ChatOptions & { provider?: string; agentType?: string }
  ): AsyncIterable<StreamChunk> {
    const provider = options?.provider || this.defaultAdapter;
    const adapter = this.getAdapter(provider);
    const startTime = Date.now();
    
    const logService = getDeveloperLogService();
    const capabilities = adapter.getCapabilities();
    
    // GameLog: LLM流式调用开始
    gameLog.debug('llm', 'LLM流式调用开始', { 
      provider, 
      model: capabilities.model, 
      messageCount: messages.length 
    });
    
    // GameLog: LLM流式调用输入
    gameLog.debug('llm', 'LLM流式调用输入', { 
      provider, 
      model: capabilities.model,
      messages: messages.map(m => ({
        role: m.role,
        content: truncateContent(m.content)
      }))
    });
    
    const requestLog = logService.addLLMRequest({
      agentType: (options?.agentType as AgentType) || 'unknown',
      provider,
      model: capabilities.model,
      status: 'pending',
      duration: 0,
      promptTokens: 0,
      completionTokens: 0,
      prompt: JSON.stringify(messages, null, 2),
    });
    const requestId = requestLog.id;
    
    let totalContent = '';
    let totalTokens = 0;
    
    try {
      for await (const chunk of adapter.chatStream(messages, options)) {
        totalContent += chunk.delta || '';
        if (chunk.usage) {
          totalTokens = chunk.usage.completionTokens || 0;
        }
        yield chunk;
      }
      
      logService.updateLLMRequest(requestId, {
        status: 'success',
        duration: Date.now() - startTime,
        completionTokens: totalTokens,
        response: totalContent.substring(0, 1000),
      });
      
      // GameLog: LLM流式调用成功
      gameLog.info('llm', 'LLM流式调用成功', { 
        provider, 
        model: capabilities.model, 
        completionTokens: totalTokens,
        duration: Date.now() - startTime 
      });
      
      // GameLog: LLM流式调用输出
      gameLog.debug('llm', 'LLM流式调用输出', { 
        provider, 
        model: capabilities.model,
        response: truncateContent(totalContent),
        completionTokens: totalTokens
      });
    } catch (error) {
      logService.updateLLMRequest(requestId, {
        status: 'error',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // GameLog: LLM流式调用失败
      gameLog.error('llm', 'LLM流式调用失败', { 
        provider, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      throw error;
    }
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
