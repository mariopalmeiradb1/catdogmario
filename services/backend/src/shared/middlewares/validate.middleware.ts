import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpStatus } from '~/shared/constants/http-status';

export function validate(schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!fields[path]) {
            fields[path] = issue.message;
          }
        }
        res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos.',
            fields,
          },
        });
        return;
      }
      next(error);
    }
  };
}
