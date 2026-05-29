import crypto from 'crypto';

export function generateConfirmationToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function generateResetCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
