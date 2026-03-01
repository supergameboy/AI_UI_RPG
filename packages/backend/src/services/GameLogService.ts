import * as fs from 'fs';
import * as path from 'path';
import { getWebSocketService } from './WebSocketService';
import type { LogLevel, LogSource, LogEntry } from '@ai-rpg/shared';

export type { LogLevel, LogSource, LogEntry };

const MAX_LOGS = 1000;
const LOG_DIR = path.join(process.cwd(), 'logs');

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getLogFileName(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  return path.join(LOG_DIR, `game-${dateStr}.log`);
}

function formatLogForFile(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${timestamp}] [${entry.level.toUpperCase().padEnd(5)}] [${entry.source.padEnd(8)}] ${entry.message}${dataStr}\n`;
}

class GameLogService {
  private logs: LogEntry[] = [];
  private fileLoggingEnabled: boolean = true;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
  } | null = null;

  constructor() {
    ensureLogDir();
  }

  installConsoleOverride(): void {
    if (this.originalConsole) return;
    
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
    };

    const self = this;

    console.log = (...args: unknown[]) => {
      self.originalConsole!.log(...args);
      const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      self.log('info', 'backend', message);
    };

    console.error = (...args: unknown[]) => {
      self.originalConsole!.error(...args);
      const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      self.log('error', 'backend', message);
    };

    console.warn = (...args: unknown[]) => {
      self.originalConsole!.warn(...args);
      const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      self.log('warn', 'backend', message);
    };
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
      id: generateId(),
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

    try {
      getWebSocketService().broadcastLog(entry);
    } catch {
      // WebSocket might not be initialized yet
    }

    if (this.fileLoggingEnabled) {
      this.writeToFile(entry);
    }
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const logFile = getLogFileName();
      const logLine = formatLogForFile(entry);
      fs.appendFileSync(logFile, logLine, 'utf-8');
    } catch (error) {
      if (this.originalConsole) {
        this.originalConsole.error('[GameLogService] Failed to write log file:', error);
      }
    }
  }

  getLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  getFilteredLogs(options: {
    level?: LogLevel;
    source?: LogSource;
    search?: string;
    limit?: number;
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

    const limit = options.limit || 100;
    return filtered.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  setFileLogging(enabled: boolean): void {
    this.fileLoggingEnabled = enabled;
  }

  getLogFilePath(): string {
    return getLogFileName();
  }
}

let gameLogService: GameLogService | null = null;

export function getGameLogService(): GameLogService {
  if (!gameLogService) {
    gameLogService = new GameLogService();
  }
  return gameLogService;
}

export function initializeGameLogService(): GameLogService {
  const service = getGameLogService();
  service.installConsoleOverride();
  return service;
}

export const gameLog = {
  debug: (source: LogSource, message: string, data?: Record<string, unknown>) => 
    getGameLogService().debug(source, message, data),
  info: (source: LogSource, message: string, data?: Record<string, unknown>) => 
    getGameLogService().info(source, message, data),
  warn: (source: LogSource, message: string, data?: Record<string, unknown>) => 
    getGameLogService().warn(source, message, data),
  error: (source: LogSource, message: string, data?: Record<string, unknown>) => 
    getGameLogService().error(source, message, data),
};
