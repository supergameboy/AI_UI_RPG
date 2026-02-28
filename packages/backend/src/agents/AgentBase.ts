import type {
  AgentType,
  Agent,
  AgentConfig,
  AgentMessage,
  AgentResponse,
  AgentMemory,
  AgentMemorySystem,
  MessagePriority,
  Message,
  ChatResponse,
  StreamChunk,
  PromptContext,
} from '@ai-rpg/shared';
import { getMessageRouter, getMessageQueue } from '../services/MessageQueue';
import { getLLMService } from '../services/llm/LLMService';
import { getAgentConfigService } from '../services/AgentConfigService';
import { getDeveloperLogService } from '../services/DeveloperLogService';

export abstract class AgentBase implements Agent {
  abstract readonly type: AgentType;
  abstract readonly canCallAgents: AgentType[];
  abstract readonly dataAccess: string[];
  abstract readonly systemPrompt: string;

  id: string;
  name: string;
  description: string;
  capabilities: string[];
  config: AgentConfig;
  memory: AgentMemorySystem;
  status: 'idle' | 'processing' | 'waiting' | 'error' = 'idle';

  protected isRunning: boolean = false;
  protected processInterval: ReturnType<typeof setInterval> | null = null;
  protected processIntervalMs: number = 100;

  constructor(config?: Partial<AgentConfig>) {
    this.id = this.generateId();
    this.name = this.getAgentName();
    this.description = this.getAgentDescription();
    this.capabilities = this.getAgentCapabilities();
    this.config = {
      provider: config?.provider || 'deepseek',
      model: config?.model || 'deepseek-chat',
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 2048,
      timeout: config?.timeout ?? 30000,
      maxRetries: config?.maxRetries ?? 3,
    };
    this.memory = {
      shortTerm: [],
      midTerm: [],
      longTerm: [],
      compressed: '',
    };
  }

  abstract processMessage(message: AgentMessage): Promise<AgentResponse>;

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing...`);
    this.status = 'idle';
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`[${this.name}] Already running`);
      return;
    }

    console.log(`[${this.name}] Starting...`);
    this.isRunning = true;
    this.status = 'idle';

    const router = getMessageRouter();
    router.registerHandler(this.type, this.handleMessage.bind(this));

    this.startMessageLoop();
    console.log(`[${this.name}] Started successfully`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log(`[${this.name}] Stopping...`);
    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    const router = getMessageRouter();
    router.unregisterHandler(this.type);

    this.status = 'idle';
    console.log(`[${this.name}] Stopped successfully`);
  }

  async sendMessage(
    to: AgentType | AgentType[],
    action: string,
    data: Record<string, unknown>,
    options?: {
      priority?: MessagePriority;
      requiresResponse?: boolean;
      timeout?: number;
      context?: Record<string, unknown>;
    }
  ): Promise<AgentMessage> {
    const router = getMessageRouter();
    const logService = getDeveloperLogService();
    
    const targets = Array.isArray(to) ? to : [to];
    for (const target of targets) {
      logService.logAgentMessage(
        this.type,
        target,
        action,
        'sent',
        data
      );
    }
    
    return router.send(this.type, to, action, data, options);
  }

  async callLLM(
    messages: Message[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
      context?: PromptContext;
    }
  ): Promise<ChatResponse> {
    const llmService = getLLMService();
    const agentConfigService = getAgentConfigService();
    
    const systemPrompt = agentConfigService.getSystemPrompt(this.type, options?.context);
    
    const allMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...this.buildMemoryMessages(),
      ...messages,
    ];

    return llmService.chat(allMessages, {
      provider: this.config.provider,
      model: this.config.model,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
    });
  }

  async *callLLMStream(
    messages: Message[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      context?: PromptContext;
    }
  ): AsyncIterable<StreamChunk> {
    const llmService = getLLMService();
    const agentConfigService = getAgentConfigService();
    
    const systemPrompt = agentConfigService.getSystemPrompt(this.type, options?.context);
    
    const allMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...this.buildMemoryMessages(),
      ...messages,
    ];

    yield* llmService.chatStream(allMessages, {
      provider: this.config.provider,
      model: this.config.model,
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
    });
  }

  addMemory(
    content: string,
    role: 'user' | 'assistant' = 'assistant',
    importance: number = 5,
    metadata?: Record<string, unknown>
  ): void {
    const memory: AgentMemory = {
      role,
      content,
      timestamp: Date.now(),
      importance,
      metadata,
    };

    this.memory.shortTerm.push(memory);

    if (this.memory.shortTerm.length > 50) {
      const overflow = this.memory.shortTerm.splice(0, this.memory.shortTerm.length - 50);
      this.memory.midTerm.push(...overflow);
    }

    if (this.memory.midTerm.length > 100) {
      const overflow = this.memory.midTerm.splice(0, this.memory.midTerm.length - 100);
      this.memory.longTerm.push(...overflow);
    }
  }

  clearMemory(): void {
    this.memory = {
      shortTerm: [],
      midTerm: [],
      longTerm: [],
      compressed: '',
    };
  }

  updateConfig(config: Partial<AgentConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    console.log(`[${this.name}] Config updated:`, this.config);
  }

  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    this.status = 'processing';
    
    const logService = getDeveloperLogService();
    logService.logAgentMessage(
      message.from,
      this.type,
      message.payload?.action || 'unknown',
      'received',
      message.payload?.data
    );

    try {
      const response = await this.processMessage(message);
      
      const responseMessage: AgentMessage = {
        id: this.generateMessageId(),
        timestamp: Date.now(),
        from: this.type,
        to: message.from,
        type: 'response',
        payload: {
          action: `${message.payload.action}_response`,
          data: (response.data as Record<string, unknown>) || {},
        },
        metadata: {
          priority: message.metadata.priority,
          requiresResponse: false,
        },
        correlationId: message.id,
      };

      this.status = 'idle';
      return responseMessage;
    } catch (error) {
      this.status = 'error';
      console.error(`[${this.name}] Error processing message:`, error);

      const errorMessage: AgentMessage = {
        id: this.generateMessageId(),
        timestamp: Date.now(),
        from: this.type,
        to: message.from,
        type: 'error',
        payload: {
          action: 'error',
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
        metadata: {
          priority: 'high',
          requiresResponse: false,
        },
        correlationId: message.id,
      };

      return errorMessage;
    }
  }

  protected startMessageLoop(): void {
    const queue = getMessageQueue();
    
    this.processInterval = setInterval(() => {
      if (queue.isProcessing(this.type)) {
        return;
      }

      const message = queue.dequeue(this.type);
      if (message) {
        this.handleMessage(message).catch(error => {
          console.error(`[${this.name}] Unhandled error in message loop:`, error);
        });
      }
    }, this.processIntervalMs);
  }

  protected buildMemoryMessages(): Message[] {
    const messages: Message[] = [];

    if (this.memory.compressed) {
      messages.push({
        role: 'system',
        content: `[历史摘要]\n${this.memory.compressed}`,
      });
    }

    const recentMemories = this.memory.shortTerm.slice(-10);
    for (const memory of recentMemories) {
      messages.push({
        role: memory.role,
        content: memory.content,
      });
    }

    return messages;
  }

  protected abstract getAgentName(): string;
  protected abstract getAgentDescription(): string;
  protected abstract getAgentCapabilities(): string[];

  protected generateId(): string {
    return `${this.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
