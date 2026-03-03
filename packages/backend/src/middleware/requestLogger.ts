import type { Request, Response, NextFunction } from 'express';
import { gameLog } from '../services/GameLogService';

export interface RequestLogOptions {
  logBody?: boolean;
  logQuery?: boolean;
  logParams?: boolean;
  excludePaths?: string[];
}

const defaultOptions: RequestLogOptions = {
  logBody: true,
  logQuery: true,
  logParams: true,
  excludePaths: ['/api/health', '/api/logs'],
};

function truncateContent(content: unknown, maxLength: number = 500): string {
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + `... [truncated, total: ${str.length} chars]`;
}

export function requestLogger(options: RequestLogOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (opts.excludePaths?.some(path => req.path.startsWith(path))) {
      next();
      return;
    }

    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const logData: Record<string, unknown> = {
      method: req.method,
      path: req.path,
      requestId,
    };

    if (opts.logQuery && Object.keys(req.query).length > 0) {
      logData.query = truncateContent(req.query);
    }

    if (opts.logParams && Object.keys(req.params).length > 0) {
      logData.params = truncateContent(req.params);
    }

    if (opts.logBody && req.body && Object.keys(req.body).length > 0) {
      logData.body = truncateContent(req.body, 1000);
    }

    gameLog.debug('backend', `API请求: ${req.method} ${req.path}`, logData);

    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      const duration = Date.now() - startTime;
      
      const responseLog: Record<string, unknown> = {
        requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };

      if (body) {
        const success = (body as Record<string, unknown>)?.success;
        if (success !== undefined) {
          responseLog.success = success;
        }
        if ((body as Record<string, unknown>)?.error) {
          responseLog.error = truncateContent((body as Record<string, unknown>)?.error, 300);
        }
      }

      const level = res.statusCode >= 400 ? 'warn' : 'info';
      gameLog[level]('backend', `API响应: ${req.method} ${req.path}`, responseLog);

      return originalJson(body);
    };

    next();
  };
}
