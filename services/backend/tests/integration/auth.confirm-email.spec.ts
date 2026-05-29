import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { addHours } from '~/shared/utils/date.util';
import { generateConfirmationToken } from '~/shared/utils/crypto.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Auth Confirm Email Integration', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
  });

  afterAll(async () => {
    await destroyTestDb();
  });

  const app = getTestApp();

  async function createUserWithConfirmation(expiresAt?: Date, usedAt?: Date) {
    const db = getTestDb();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash('Test@123', 12);
    await db('users').insert({
      id: userId,
      name: 'Test User',
      email: 'test@email.com',
      password_hash: passwordHash,
      role: 'adopter',
      ong_id: null,
      email_confirmed_at: null,
      is_active: true,
    });

    const token = generateConfirmationToken();
    const confirmationId = uuidv4();
    await db('email_confirmations').insert({
      id: confirmationId,
      user_id: userId,
      token,
      used_at: usedAt || null,
      expires_at: expiresAt || addHours(new Date(), 24),
    });

    return { userId, token };
  }

  describe('POST /api/v1/auth/confirm-email', () => {
    it('should confirm email successfully', async () => {
      const { userId, token } = await createUserWithConfirmation();

      const res = await request(app)
        .post('/api/v1/auth/confirm-email')
        .send({ token });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('confirmado com sucesso');

      const db = getTestDb();
      const user = await db('users').where({ id: userId }).first();
      expect(user.email_confirmed_at).not.toBeNull();
    });

    it('should return 400 for expired token', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      const { token } = await createUserWithConfirmation(expiredDate);

      const res = await request(app)
        .post('/api/v1/auth/confirm-email')
        .send({ token });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should return 400 for already used token', async () => {
      const { token } = await createUserWithConfirmation(undefined, new Date());

      const res = await request(app)
        .post('/api/v1/auth/confirm-email')
        .send({ token });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOKEN_ALREADY_USED');
    });

    it('should return 400 for non-existent token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/confirm-email')
        .send({ token: 'nonexistent-token-value' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });
});
