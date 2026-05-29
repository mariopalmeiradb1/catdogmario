import request from 'supertest';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Auth Login Integration', () => {
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

  async function createUser(overrides: Record<string, unknown> = {}) {
    const db = getTestDb();
    const id = uuidv4();
    const passwordHash = await bcrypt.hash('Test@123', 12);
    await db('users').insert({
      id,
      name: 'Test User',
      email: 'test@email.com',
      password_hash: passwordHash,
      role: 'adopter',
      ong_id: null,
      email_confirmed_at: new Date(),
      is_active: true,
      ...overrides,
    });
    return id;
  }

  async function createOng(status = 'approved') {
    const db = getTestDb();
    const id = uuidv4();
    await db('ongs').insert({
      id,
      name: 'Test ONG',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      address: 'Rua Test',
      status,
    });
    return id;
  }

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully as adopter', async () => {
      await createUser();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@email.com', password: 'Test@123' });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.role).toBe('adopter');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      await createUser();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@email.com', password: 'Wrong@123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@email.com', password: 'Test@123' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('E-mail ou senha incorretos.');
    });

    it('should return 403 if email not confirmed', async () => {
      await createUser({ email_confirmed_at: null });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@email.com', password: 'Test@123' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('EMAIL_NOT_CONFIRMED');
    });

    it('should return 403 if ONG is pending', async () => {
      const ongId = await createOng('pending');
      await createUser({ role: 'ong_admin', ong_id: ongId });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@email.com', password: 'Test@123' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ONG_PENDING_APPROVAL');
    });

    it('should login successfully as system_admin', async () => {
      await createUser({ role: 'system_admin' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@email.com', password: 'Test@123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('system_admin');
    });
  });
});
