import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '~/shared/utils/token.util';
import { HttpStatus } from '~/shared/constants/http-status';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      error: { code: 'UNAUTHORIZED', message: 'Token inválido ou ausente.' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(HttpStatus.UNAUTHORIZED).json({
      error: { code: 'UNAUTHORIZED', message: 'Token inválido ou ausente.' },
    });
  }
}
