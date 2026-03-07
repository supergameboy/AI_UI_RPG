import type {
  AgentType,
  Agent,
  AgentConfig,
  AgentMessage,
  AgentResponse,
  AgentMemory,
  AgentMemorySystem,
  AgentBinding,
  MessagePriority,
  Message,
  ChatResponse,
  StreamChunk,
  PromptContext,
  ToolType,
  ToolResponse,
  ToolCallContext,
  ToolPermission,
  InitializationContext,
  InitializationResult,
} from '@ai-rpg/shared';
import { getMessageRouter, getMessageQueue } from '../services/MessageQueue';
import { getLLMService } from '../services/llm/LLMService';
import { getAgentConfigService } from '../services/AgentConfigService';
import { getDeveloperLogService } from '../services/DeveloperLogService';
import { getToolRegistry, ToolRegistry } from '../tools/ToolRegistry';
import type { ToolBase } from '../tools/ToolBase';
import { gameLog } from '../services/GameLogService';
import {
  DEFAULT_PROCESS_INTERVAL_MS,
  MAX_SHORT_TERM_MEMORY,
  MAX_MID_TERM_MEMORY,
  DEFAULT_LLM_CONFIG,
} from '../constants';

export abstract class AgentBase implements Agent {
  abstract readonly type: AgentType;
  /** 依赖的 Tool 类型列表 */
  abstract readonly tools: ToolType[];
  /** 可调用的 Agent 绑定配置 */
  abstract readonly bindings: AgentBinding[];
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  config: AgentConfig;
  memory: AgentMemorySystem;
  status: 'idle' | 'processing' | 'waiting' | 'error' = 'idle';

  protected isRunning: boolean = false;
  protected processInterval: ReturnType<typeof setInterval> | null = null;
  protected processIntervalMs: number = DEFAULT_PROCESS_INTERVAL_MS;
  protected toolRegistry: ToolRegistry;

  constructor(config?: Partial<AgentConfig>, toolRegistry?: ToolRegistry) {
    this.id = this.generateId();
    this.name = this.getAgentName();
    this.description = this.getAgentDescription();
    this.capabilities = this.getAgentCapabilities();
    this.config = {
      provider: config?.provider ?? DEFAULT_LLM_CONFIG.provider,
      model: config?.model ?? DEFAULT_LLM_CONFIG.model,
      temperature: config?.temperature ?? DEFAULT_LLM_CONFIG.temperature,
      maxTokens: config?.maxTokens ?? DEFAULT_LLM_CONFIG.maxTokens,
      timeout: config?.timeout ?? DEFAULT_LLM_CONFIG.timeout,
      maxRetries: config?.maxRetries ?? DEFAULT_LLM_CONFIG.maxRetries,
    };
    this.memory = {
      shortTerm: [],
      midTerm: [],
      longTerm: [],
      compressed: '',
    };
    // 使用传入的 ToolRegistry 或获取全局实例
    this.toolRegistry = toolRegistry ?? getToolRegistry();
  }

  abstract processMessage(message: AgentMessage): Promise<AgentResponse>;

  /**
   * 初始化方法（可选实现）
   * 用于游戏开始时的数据初始化
   * 子类可以重写此方法以实现特定的初始化逻辑
   */
  async initialize?(context: InitializationContext): Promise<InitializationResult>;

  /**
   * 从 ToolRegistry 获取 Tool 实例
   * @param toolType Tool 类型
   * @returns Tool 实例或 undefined
   */
  getTool<T extends ToolBase>(toolType: ToolType): T | undefined {
    return this.toolRegistry.getTool<T>(toolType);
  }

  /**
   * 调用 Tool 方法
   * @param toolType Tool 类型
   * @param method 方法名
   * @param params 参数
   * @param permission 权限类型，默认 'read'
   * @returns Tool 响应
   */
  async callTool<T = unknown>(
    toolType: ToolType,
    method: string,
    params: unknown,
    permission: ToolPermission = 'read'
  ): Promise<ToolResponse<T>> {
    // 检查 Tool 是否存在
    if (!this.toolRegistry.hasTool(toolType)) {
      gameLog.warn('agent', `Tool '${toolType}' not found in registry`, {
        agentType: this.type,
        method,
      });
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${toolType}' not found in registry`,
        },
      };
    }

    // 构建调用上下文
    const context: ToolCallContext = {
      agentId: this.type,
      requestId: this.generateMessageId(),
      timestamp: Date.now(),
      permission,
    };

    gameLog.debug('agent', `Calling tool: ${toolType}.${method}`, {
      agentType: this.type,
      requestId: context.requestId,
      permission,
    });

    return this.toolRegistry.executeTool<T>(
      toolType,
      method,
      params as Record<string, unknown>,
      context
    );
  }

  /**
   * 调用其他 Agent
   * @param agentType 目标 Agent 类型
   * @param message Agent 消息
   * @returns Agent 响应
   */
  async callAgent(
    agentType: AgentType,
    message: AgentMessage
  ): Promise<AgentResponse> {
    // 检查是否在绑定配置中允许调用该 Agent
    const binding = this.bindings.find(
      (b) => b.agentType === agentType && b.enabled !== false
    );

    if (!binding) {
      gameLog.warn('agent', `Agent '${agentType}' not in bindings or disabled`, {
        callerAgent: this.type,
        targetAgent: agentType,
      });
      return {
        success: false,
        error: `Agent '${agentType}' is not accessible from '${this.type}'`,
      };
    }

    gameLog.debug('agent', `Calling agent: ${agentType}`, {
      callerAgent: this.type,
      targetAgent: agentType,
      action: message.payload.action,
    });

    // 发送消息到目标 Agent
    const responseMessage = await this.sendMessage(
      agentType,
      message.payload.action,
      message.payload.data,
      {
        priority: message.metadata.priority,
        requiresResponse: true,
        timeout: message.metadata.timeout ?? this.config.timeout,
        context: message.payload.context,
      }
    );

    // 解析响应
    const data = responseMessage.payload.data as Record<string, unknown>;
    return {
      success: data.success !== false,
      data: data.data ?? data,
      error: data.error as string | undefined,
      uiInstructions: data.uiInstructions as AgentResponse['uiInstructions'],
      requiresFollowUp: data.requiresFollowUp as boolean | undefined,
    };
  }

  /**
   * 初始化 Agent 状态（内部方法）
   * 在 start() 之前调用，设置初始状态
   */
  async initAgent(): Promise<void> {
    gameLog.info('agent', 'Initializing', { agentName: this.name });
    this.status = 'idle';
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      gameLog.warn('agent', 'Already running', { agentName: this.name });
      return;
    }

    gameLog.info('agent', 'Starting', { agentName: this.name });
    this.isRunning = true;
    this.status = 'idle';

    const router = getMessageRouter();
    router.registerHandler(this.type, this.handleMessage.bind(this));

    this.startMessageLoop();
    gameLog.info('agent', 'Started successfully', { agentName: this.name });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    gameLog.info('agent', 'Stopping', { agentName: this.name });
    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    const router = getMessageRouter();
    router.unregisterHandler(this.type);

    this.status = 'idle';
    gameLog.info('agent', 'Stopped successfully', { agentName: this.name });
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
        data,
        undefined,
        'request'
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

    if (this.memory.shortTerm.length > MAX_SHORT_TERM_MEMORY) {
      const overflow = this.memory.shortTerm.splice(0, this.memory.shortTerm.length - MAX_SHORT_TERM_MEMORY);
      this.memory.midTerm.push(...overflow);
    }

    if (this.memory.midTerm.length > MAX_MID_TERM_MEMORY) {
      const overflow = this.memory.midTerm.splice(0, this.memory.midTerm.length - MAX_MID_TERM_MEMORY);
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

  /**
   * 从 LLM 响应中解析 JSON
   * 处理 Markdown 代码块包裹的 JSON
   * @param response LLM 响应字符串
   * @returns 解析后的对象或 null
   */
  parseJsonResponse<T>(response: string): T | null {
    if (!response || typeof response !== 'string') {
      return null;
    }

    let jsonStr = response.trim();

    // 处理 Markdown 代码块包裹的 JSON
    // 匹配 ```json ... ``` 或 ``` ... ``` 格式
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // 尝试提取 JSON 对象或数组
    const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
    const jsonArrayMatch = jsonStr.match(/\[[\s\S]*\]/);

    const extractedJson = jsonObjectMatch?.[0] || jsonArrayMatch?.[0];
    if (!extractedJson) {
      gameLog.warn('agent', 'No valid JSON found in response', {
        agentName: this.name,
        responseLength: response.length,
      });
      return null;
    }

    try {
      return JSON.parse(extractedJson) as T;
    } catch (error) {
      gameLog.error('agent', 'Failed to parse JSON from response', {
        agentName: this.name,
        error: error instanceof Error ? error.message : String(error),
        jsonPreview: extractedJson.substring(0, 200),
      });
      return null;
    }
  }

  /**
   * 统一处理 LLM 调用错误
   * 记录错误日志并抛出标准化的错误
   * @param error 原始错误对象
   * @param context 错误上下文描述
   * @throws 永远抛出错误，不会返回
   */
  handleLLMError(error: unknown, context: string): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    gameLog.error('agent', `LLM error: ${context}`, {
      agentName: this.name,
      error: errorMessage,
      stack: errorStack,
    });

    // 抛出标准化的错误
    throw new Error(`[${this.name}] LLM Error - ${context}: ${errorMessage}`);
  }

  updateConfig(config: Partial<AgentConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    gameLog.debug('agent', 'Config updated', { agentName: this.name, config: this.config });
  }

  protected async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    this.status = 'processing';
    
    const logService = getDeveloperLogService();
    logService.logAgentMessage(
      message.from,
      this.type,
      message.payload?.action || 'unknown',
      'received',
      message.payload?.data,
      undefined,
      message.type
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
      gameLog.error('agent', 'Error processing message', {
        agentName: this.name,
        error: error instanceof Error ? error.message : String(error),
      });

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
          gameLog.error('agent', 'Unhandled error in message loop', {
            agentName: this.name,
            error: error instanceof Error ? error.message : String(error),
          });
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
