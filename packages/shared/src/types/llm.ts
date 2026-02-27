export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  created: number;
}

export interface StreamChunk {
  id: string;
  delta: string;
  done: boolean;
  usage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelCapabilities {
  provider: string;
  model: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsFunctionCall: boolean;
  supportsVision: boolean;
  supportsJSON: boolean;
  contextWindow: number;
}

export interface LLMConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMAdapter {
  readonly name: string;
  readonly provider: string;
  
  initialize(config: LLMConfig): Promise<void>;
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  chatStream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  getCapabilities(): ModelCapabilities;
  isInitialized(): boolean;
}

export interface LLMProviderConfig {
  provider: string;
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  models: ModelCapabilities[];
}

export interface LLMSettings {
  defaultProvider: string;
  defaultModel: string;
  providers: Record<string, LLMProviderConfig>;
  agentModelMapping: Record<string, string>;
}
