export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'frontend' | 'backend' | 'agent' | 'system' | 'llm' | 'prompt-editor' | 'dialogue' | 'combat';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: Record<string, unknown>;
}
