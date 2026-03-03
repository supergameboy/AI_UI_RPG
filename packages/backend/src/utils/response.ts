import type { Response } from 'express';
import type { APIResponse, ResponseMeta, PaginatedData } from '@ai-rpg/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: ResponseMeta): void {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: Date.now(),
      ...meta,
    },
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: unknown
): void {
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

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number
): void {
  const paginatedData: PaginatedData<T> = {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  sendSuccess(res, paginatedData, 200, { page, total, limit });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
