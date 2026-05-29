import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';

export function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(HttpStatus.FORBIDDEN).json({
        error: { code: 'FORBIDDEN', message: 'Você não tem permissão para acessar esta página.' },
      });
      return;
    }
    next();
  };
}
