import { v4 as uuidv4 } from 'uuid';
import { db } from '~/config/database';
import {
  User,
  Ong,
  EmailConfirmation,
  PasswordReset,
  RefreshToken,
  CreateUserData,
  CreateOngData,
} from './auth.types';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email: email.toLowerCase() }).first();
    return user || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = await db('users').where({ id }).first();
    return user || null;
  }

  async findOngByCnpj(cnpj: string): Promise<Ong | null> {
    const ong = await db('ongs').where({ cnpj }).first();
    return ong || null;
  }

  async findOngById(id: string): Promise<Ong | null> {
    const ong = await db('ongs').where({ id }).first();
    return ong || null;
  }

  async createUser(data: CreateUserData): Promise<string> {
    const id = data.id || uuidv4();
    await db('users').insert({
      ...data,
      id,
      email: data.email.toLowerCase(),
    });
    return id;
  }

  async createOng(data: CreateOngData): Promise<string> {
    const id = data.id || uuidv4();
    await db('ongs').insert({ ...data, id });
    return id;
  }

  async confirmUserEmail(userId: string): Promise<void> {
    await db('users').where({ id: userId }).update({ email_confirmed_at: db.fn.now() });
  }

  async createEmailConfirmation(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    await db('email_confirmations').insert({
      id: uuidv4(),
      user_id: data.userId,
      token: data.token,
      expires_at: data.expiresAt,
    });
  }

  async findEmailConfirmationByToken(token: string): Promise<EmailConfirmation | null> {
    const confirmation = await db('email_confirmations').where({ token }).first();
    return confirmation || null;
  }

  async markEmailConfirmationUsed(id: string): Promise<void> {
    await db('email_confirmations').where({ id }).update({ used_at: db.fn.now() });
  }

  async createPasswordReset(data: {
    userId: string;
    code: string;
    expiresAt: Date;
  }): Promise<void> {
    await db('password_resets').insert({
      id: uuidv4(),
      user_id: data.userId,
      code: data.code,
      expires_at: data.expiresAt,
    });
  }

  async findPasswordReset(email: string, code: string): Promise<(PasswordReset & { user_email: string }) | null> {
    const reset = await db('password_resets')
      .join('users', 'password_resets.user_id', 'users.id')
      .where({ 'users.email': email.toLowerCase(), 'password_resets.code': code })
      .whereNull('password_resets.used_at')
      .select('password_resets.*', 'users.email as user_email')
      .orderBy('password_resets.created_at', 'desc')
      .first();
    return reset || null;
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    await db('password_resets').where({ id }).update({ used_at: db.fn.now() });
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db('users').where({ id: userId }).update({ password_hash: passwordHash });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: data.userId,
      token_hash: data.tokenHash,
      expires_at: data.expiresAt,
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const token = await db('refresh_tokens').where({ token_hash: tokenHash }).first();
    return token || null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await db('refresh_tokens').where({ id }).update({ revoked_at: db.fn.now() });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db('refresh_tokens')
      .where({ user_id: userId })
      .whereNull('revoked_at')
      .update({ revoked_at: db.fn.now() });
  }
}

export const authRepository = new AuthRepository();
