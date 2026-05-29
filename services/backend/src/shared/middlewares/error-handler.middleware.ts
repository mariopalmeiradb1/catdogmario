import { Request, Response, NextFunction } from 'express';
import { env } from '~/config/env';
import { AppError } from '~/domains/auth/auth.errors';
import { HttpStatus } from '~/shared/constants/http-status';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      error: { code: err.code, message: err.message },
    };
    if (env.NODE_ENV === 'development' && err.stack) {
      (response.error as Record<string, unknown>).stack = err.stack;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  console.error('Unhandled error:', err);

  const response: Record<string, unknown> = {
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
  };
  if (env.NODE_ENV === 'development' && err.stack) {
    (response.error as Record<string, unknown>).stack = err.stack;
  }

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
}
