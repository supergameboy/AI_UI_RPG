export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'frontend' | 'backend' | 'agent' | 'prompt-editor';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: Record<string, unknown>;
}

export interface LLMRequestRecord {
  id: string;
  timestamp: number;
  agentType: string;
  provider: string;
  model: string;
  status: 'pending' | 'success' | 'error';
  duration: number;
  promptTokens: number;
  completionTokens: number;
  prompt?: string;
  response?: string;
  error?: string;
}

export interface AgentMessageRecord {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  type: string;
  action: string;
  status: 'sent' | 'received' | 'error';
  payload?: Record<string, unknown>;
  error?: string;
}

const MAX_LOGS = 1000;

class LogService {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  debug(source: LogSource, message: string, data?: Record<string, unknown>): void {
    this.log('debug', source, message, data);
  }

  info(source: LogSource, message: string, data?: Record<string, unknown>): void {
    this.log('info', source, message, data);
  }

  warn(source: LogSource, message: string, data?: Record<string, unknown>): void {
    this.log('warn', source, message, data);
  }

  error(source: LogSource, message: string, data?: Record<string, unknown>): void {
    this.log('error', source, message, data);
  }

  private log(level: LogLevel, source: LogSource, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      source,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }

    this.notifyListeners();

    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](`[${source}] ${message}`, data || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getFilteredLogs(options: {
    level?: LogLevel;
    source?: LogSource;
    search?: string;
  }): LogEntry[] {
    let filtered = this.logs;

    if (options.level) {
      filtered = filtered.filter((log) => log.level === options.level);
    }

    if (options.source) {
      filtered = filtered.filter((log) => log.source === options.source);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter((log) =>
        log.message.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.logs));
  }

  exportLogs(format: 'json' | 'text'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    return this.logs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toISOString();
        const dataStr = log.data ? ` ${JSON.stringify(log.data)}` : '';
        return `[${timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${dataStr}`;
      })
      .join('\n');
  }

  downloadLogs(format: 'json' | 'text'): void {
    const content = this.exportLogs(format);
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const extension = format === 'json' ? 'json' : 'txt';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-rpg-logs-${timestamp}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logService = new LogService();
