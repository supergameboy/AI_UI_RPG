import type { AgentType } from './agent';
import type { ToolCallPayload, ToolResponsePayload } from './agent';
import type { GameState, DynamicUIData } from './gameState';

export type { ToolCallPayload, ToolResponsePayload };

export type WSMessageType = 'llm_request' | 'llm_update' | 'agent_message' | 'log' | 'game_state_update' | 'dynamic_ui_update';

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

/**
 * 扩展的消息类型
 */
export type ExtendedMessageType =
  | 'request'
  | 'response'
  | 'notification'
  | 'error'
  | 'tool_call'
  | 'tool_response'
  | 'context_change'
  | 'conflict_detected';

/**
 * 上下文变更载荷
 */
export interface ContextChangePayload {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  source: string;
  reason?: string;
}

/**
 * 冲突检测载荷
 */
export interface ConflictDetectedPayload {
  conflictType: 'data' | 'state' | 'action' | 'resource';
  description: string;
  conflictingParties: string[];
  conflictingData?: Record<string, unknown>;
  resolution?: 'auto' | 'manual' | 'priority' | 'timestamp';
  resolvedBy?: string;
}

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
  /** 扩展消息类型的载荷 */
  toolCall?: ToolCallPayload;
  toolResponse?: ToolResponsePayload;
  contextChange?: ContextChangePayload;
  conflictDetected?: ConflictDetectedPayload;
}

export interface WSMessage {
  type: WSMessageType;
  payload?: LLMRequestLog | Partial<LLMRequestLog> | AgentMessageLog | unknown;
  timestamp: number;
  // 游戏状态更新消息字段
  saveId?: string;
  characterId?: string;
  data?: Partial<GameState>;
  dynamicUI?: DynamicUIData;
}

export interface WSConnectionState {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
}
