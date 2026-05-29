import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { hashToken } from '~/shared/utils/crypto.util';
import crypto from 'crypto';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Auth Refresh Token Integration', () => {
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

  async function createUserAndLogin(overrides: Record<string, unknown> = {}) {
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
      email_confirmed_at: new Date(),
      is_active: true,
      ...overrides,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: overrides.email || 'test@email.com', password: 'Test@123' });

    const cookies = loginRes.headers['set-cookie'];
    return { userId, cookies, loginRes };
  }

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token successfully with rotation', async () => {
      const { cookies } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.role).toBe('adopter');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 if no refresh token cookie', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
    });

    it('should return 401 if user is deactivated between refreshes', async () => {
      const { userId, cookies } = await createUserAndLogin();

      const db = getTestDb();
      await db('users').where({ id: userId }).update({ is_active: false });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(401);
    });

    it('should reflect updated role after refresh', async () => {
      const { userId, cookies } = await createUserAndLogin();

      const db = getTestDb();
      await db('users').where({ id: userId }).update({ role: 'system_admin' });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('system_admin');
    });

    it('should return 401 for revoked token', async () => {
      const { cookies } = await createUserAndLogin();

      // First refresh revokes the original
      await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      // Second attempt with original cookie should fail
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(res.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      const db = getTestDb();
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('Test@123', 12);
      await db('users').insert({
        id: userId,
        name: 'Test User',
        email: 'expired@email.com',
        password_hash: passwordHash,
        role: 'adopter',
        ong_id: null,
        email_confirmed_at: new Date(),
        is_active: true,
      });

      const rawToken = crypto.randomBytes(64).toString('hex');
      const tokenHash = hashToken(rawToken);
      await db('refresh_tokens').insert({
        id: uuidv4(),
        user_id: userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() - 1000), // expired
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${rawToken}; Path=/api/v1/auth; HttpOnly`]);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const { cookies } = await createUserAndLogin();

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logout');

      // Verify refresh no longer works
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(refreshRes.status).toBe(401);
    });
  });
});
