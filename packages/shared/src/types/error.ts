export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BaseErrorOptions {
  message: string;
  code: string;
  statusCode?: number;
  details?: unknown;
  severity?: ErrorSeverity;
  cause?: Error;
}

export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly severity: ErrorSeverity;
  public readonly cause?: Error;
  public readonly timestamp: number;

  constructor(options: BaseErrorOptions) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.details = options.details;
    this.severity = options.severity ?? 'medium';
    this.cause = options.cause;
    this.timestamp = Date.now();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      severity: this.severity,
      timestamp: this.timestamp,
    };
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details,
      severity: 'low',
    });
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    super({
      message: id ? `${resource} not found: ${id}` : `${resource} not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
      severity: 'low',
    });
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      code: 'BAD_REQUEST',
      statusCode: 400,
      details,
      severity: 'low',
    });
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized') {
    super({
      message,
      code: 'UNAUTHORIZED',
      statusCode: 401,
      severity: 'medium',
    });
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden') {
    super({
      message,
      code: 'FORBIDDEN',
      statusCode: 403,
      severity: 'medium',
    });
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      code: 'CONFLICT',
      statusCode: 409,
      details,
      severity: 'medium',
    });
  }
}

export class InternalError extends BaseError {
  constructor(message: string, cause?: Error) {
    super({
      message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      severity: 'high',
      cause,
    });
  }
}

export class LLMError extends BaseError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      code: 'LLM_ERROR',
      statusCode: 502,
      details,
      severity: 'high',
    });
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, cause?: Error) {
    super({
      message,
      code: 'DATABASE_ERROR',
      statusCode: 500,
      severity: 'high',
      cause,
    });
  }
}

export class GameError extends BaseError {
  constructor(message: string, details?: unknown) {
    super({
      message,
      code: 'GAME_ERROR',
      statusCode: 400,
      details,
      severity: 'medium',
    });
  }
}

export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

export function getErrorCode(error: unknown): string {
  if (isBaseError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}
