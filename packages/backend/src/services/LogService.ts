import fs from 'fs';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSource = 'frontend' | 'backend' | 'agent';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: Record<string, unknown>;
}

const MAX_LOGS = 2000;
const LOGS_DIR = path.join(process.cwd(), 'logs');

class LogService {
  private logs: LogEntry[] = [];
  private currentLogFile: string = '';

  constructor() {
    this.initLogFile();
  }

  private initLogFile(): void {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    this.updateLogFile();
  }

  private updateLogFile(): void {
    const today = new Date().toISOString().split('T')[0];
    const newLogFile = path.join(LOGS_DIR, `app-${today}.log`);
    
    if (this.currentLogFile !== newLogFile) {
      this.currentLogFile = newLogFile;
    }
  }

  private writeToFile(entry: LogEntry): void {
    this.updateLogFile();
    
    const timestamp = new Date(entry.timestamp).toISOString();
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    const logLine = `[${timestamp}] [${entry.level.toUpperCase().padEnd(5)}] [${entry.source.padEnd(8)}] ${entry.message}${dataStr}\n`;
    
    try {
      fs.appendFileSync(this.currentLogFile, logLine);
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

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

    this.writeToFile(entry);

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
    startTime?: number;
    endTime?: number;
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

    if (options.startTime) {
      filtered = filtered.filter((log) => log.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      filtered = filtered.filter((log) => log.timestamp <= options.endTime!);
    }

    return filtered;
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogFiles(): string[] {
    if (!fs.existsSync(LOGS_DIR)) {
      return [];
    }
    return fs.readdirSync(LOGS_DIR)
      .filter((f) => f.endsWith('.log'))
      .sort()
      .reverse();
  }

  getLogFilePath(filename: string): string | null {
    const filePath = path.join(LOGS_DIR, filename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
}

let logService: LogService | null = null;

export function getLogService(): LogService {
  if (!logService) {
    logService = new LogService();
  }
  return logService;
}

export function initializeLogService(): LogService {
  return getLogService();
}
