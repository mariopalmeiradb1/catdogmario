import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { addMinutes } from '~/shared/utils/date.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Auth Password Reset Integration', () => {
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

  async function createConfirmedUser(email = 'test@email.com') {
    const db = getTestDb();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash('Test@123', 12);
    await db('users').insert({
      id: userId,
      name: 'Test User',
      email,
      password_hash: passwordHash,
      role: 'adopter',
      ong_id: null,
      email_confirmed_at: new Date(),
      is_active: true,
    });
    return userId;
  }

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success message for existing email', async () => {
      await createConfirmedUser();

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@email.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('código de 6 dígitos');

      const db = getTestDb();
      const reset = await db('password_resets').first();
      expect(reset).toBeDefined();
      expect(reset.code).toHaveLength(6);
    });

    it('should return same success message for non-existing email (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody@email.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('código de 6 dígitos');
    });
  });

  describe('POST /api/v1/auth/verify-reset-code', () => {
    it('should return reset_token for valid code', async () => {
      const userId = await createConfirmedUser();
      const db = getTestDb();
      const code = '123456';
      await db('password_resets').insert({
        id: uuidv4(),
        user_id: userId,
        code,
        expires_at: addMinutes(new Date(), 15),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-reset-code')
        .send({ email: 'test@email.com', code });

      expect(res.status).toBe(200);
      expect(res.body.reset_token).toBeDefined();
    });

    it('should return 400 for invalid code', async () => {
      await createConfirmedUser();

      const res = await request(app)
        .post('/api/v1/auth/verify-reset-code')
        .send({ email: 'test@email.com', code: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CODE');
    });

    it('should return 400 for expired code', async () => {
      const userId = await createConfirmedUser();
      const db = getTestDb();
      const code = '123456';
      await db('password_resets').insert({
        id: uuidv4(),
        user_id: userId,
        code,
        expires_at: new Date(Date.now() - 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-reset-code')
        .send({ email: 'test@email.com', code });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CODE_EXPIRED');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password successfully', async () => {
      const userId = await createConfirmedUser();
      const db = getTestDb();
      const code = '123456';
      await db('password_resets').insert({
        id: uuidv4(),
        user_id: userId,
        code,
        expires_at: addMinutes(new Date(), 15),
      });

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-reset-code')
        .send({ email: 'test@email.com', code });

      const resetToken = verifyRes.body.reset_token;

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          reset_token: resetToken,
          password: 'NewPass@1',
          password_confirmation: 'NewPass@1',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Senha alterada com sucesso');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@email.com', password: 'NewPass@1' });

      expect(loginRes.status).toBe(200);
    });
  });
});
