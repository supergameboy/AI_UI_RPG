import type { Request, Response, NextFunction } from 'express';
import { 
  APIResponse, 
  BaseError, 
  isBaseError, 
  getErrorMessage, 
  getErrorCode 
} from '@ai-rpg/shared';
import { gameLog } from '../services/GameLogService';

export function errorHandler(
  error: Error | BaseError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = isBaseError(error) ? error.statusCode : 500;
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  const details = isBaseError(error) ? error.details : undefined;

  gameLog.error('backend', 'API Error', {
    code,
    message,
    statusCode,
    details,
    stack: error.stack,
  });

  const response: APIResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: Date.now(),
    },
  };

  res.status(statusCode).json(response);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  const response: APIResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
    meta: {
      timestamp: Date.now(),
    },
  };
  res.status(404).json(response);
}
