import jwt from 'jsonwebtoken';
import { env } from '~/config/env';
import { Role } from '~/shared/constants/roles';

export interface TokenPayload {
  userId: string;
  role: Role;
  ongId: string | null;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY as unknown as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload & jwt.JwtPayload;
  return {
    userId: decoded.userId,
    role: decoded.role,
    ongId: decoded.ongId,
  };
}

export function generateResetToken(userId: string): string {
  return jwt.sign({ userId, purpose: 'password_reset' }, env.JWT_SECRET, { expiresIn: '5m' });
}

export function verifyResetToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; purpose: string };
  if (decoded.purpose !== 'password_reset') {
    throw new Error('Invalid token purpose');
  }
  return { userId: decoded.userId };
}
