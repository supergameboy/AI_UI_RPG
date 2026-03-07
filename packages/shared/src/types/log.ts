export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'frontend' | 'backend' | 'agent' | 'system' | 'llm' | 'prompt-editor' | 'dialogue' | 'combat' | 'decision' | 'context' | 'conflict' | 'database' | 'api' | 'store';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: Record<string, unknown>;
}

// 扩展日志类型，用于日志关联跳转
export interface LogEntryWithLinks extends LogEntry {
  relatedId?: string;
  relatedType?: 'decision' | 'context' | 'conflict' | 'request';
}

// 决策日志数据
export interface DecisionLogData {
  decisionId: string;
  agentType: string;
  action: string;
  reasoning?: string;
  success: boolean;
}

// 上下文变更日志数据
export interface ContextChangeLogData {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  agentId: string;
  reason: string;
}

// 冲突日志数据
export interface ConflictLogData {
  conflictId: string;
  path: string;
  agents: string[];
  values: unknown[];
  resolution: string;
}
