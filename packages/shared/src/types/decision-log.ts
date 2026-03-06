import type { AgentType } from './agent';
import type { ToolType } from './tool';
import type { ContextData } from './context';

export interface DecisionLogAgentDecision {
  action: string;
  reasoning?: string;
  llmCall?: DecisionLogLLMCall;
  toolCalls: DecisionLogToolCall[];
}

export interface DecisionLogLLMCall {
  input: {
    role: string;
    content: string;
  }[];
  output: string;
  model: string;
  provider: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
}

export interface DecisionLogToolCall {
  tool: ToolType;
  method: string;
  params: unknown;
  result: unknown;
  isWrite: boolean;
  duration: number;
}

export interface DecisionLogAgent {
  agentId: AgentType;
  contextSnapshot: Record<string, unknown>;
  decisions: DecisionLogAgentDecision[];
  contextChanges: ContextData[];
  duration: number;
}

export interface DecisionLogConflict {
  path: string;
  agents: AgentType[];
  values: unknown[];
  resolution: 'priority' | 'timestamp' | 'manual';
  resolvedValue: unknown;
}

export interface DecisionLogResult {
  success: boolean;
  response: string;
  stateChanges: Record<string, unknown>;
  uiInstructions?: unknown[];
}

export interface DecisionLogMetadata {
  totalTokens: number;
  totalDuration: number;
  agentCount: number;
  toolCallCount: number;
  conflictCount: number;
  version: string;
}

export interface DecisionLog {
  id: string;
  timestamp: number;
  requestId: string;
  playerId: string;
  saveId: string;
  
  playerInput: string;
  inputType: string;
  
  agents: DecisionLogAgent[];
  conflicts: DecisionLogConflict[];
  result: DecisionLogResult;
  metadata: DecisionLogMetadata;
}

export interface DecisionLogQuery {
  id?: string;
  requestId?: string;
  playerId?: string;
  saveId?: string;
  startTime?: number;
  endTime?: number;
  agentId?: AgentType;
  hasConflicts?: boolean;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface DecisionLogSummary {
  id: string;
  timestamp: number;
  playerInput: string;
  success: boolean;
  agentCount: number;
  conflictCount: number;
  duration: number;
}

export interface DecisionLogTraceback {
  log: DecisionLog;
  previousLogs: DecisionLogSummary[];
  relatedLogs: DecisionLogSummary[];
  stateBefore: Record<string, unknown>;
  stateAfter: Record<string, unknown>;
  diff: {
    path: string;
    type: 'added' | 'removed' | 'modified';
    oldValue: unknown;
    newValue: unknown;
  }[];
}

export interface DecisionLogConfig {
  enabled: boolean;
  persistToDatabase: boolean;
  maxLogSize: number;
  retentionDays: number;
  logLLMCalls: boolean;
  logToolCalls: boolean;
  logContextChanges: boolean;
}

export const DEFAULT_DECISION_LOG_CONFIG: DecisionLogConfig = {
  enabled: true,
  persistToDatabase: true,
  maxLogSize: 10000,
  retentionDays: 30,
  logLLMCalls: true,
  logToolCalls: true,
  logContextChanges: true,
};
