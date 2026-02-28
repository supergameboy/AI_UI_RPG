import type { AgentType } from './agent';

export type WSMessageType = 'llm_request' | 'llm_update' | 'agent_message' | 'log';

export type LLMRequestStatus = 'pending' | 'success' | 'error';

export interface LLMRequestLog {
  id: string;
  timestamp: number;
  agentType: AgentType | 'unknown';
  provider: string;
  model: string;
  status: LLMRequestStatus;
  duration: number;
  promptTokens: number;
  completionTokens: number;
  prompt: string;
  response?: string;
  error?: string;
}

export type AgentMessageStatus = 'sent' | 'received' | 'error';

export interface AgentMessageLog {
  id: string;
  timestamp: number;
  from: AgentType;
  to: AgentType;
  type: string;
  action: string;
  status: AgentMessageStatus;
  payload?: unknown;
  error?: string;
}

export interface WSMessage {
  type: WSMessageType;
  payload: LLMRequestLog | Partial<LLMRequestLog> | AgentMessageLog | unknown;
  timestamp: number;
}

export interface WSConnectionState {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
}
