import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Auth Register Integration', () => {
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

  describe('POST /api/v1/auth/register/adopter', () => {
    const validData = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'Test@123',
      password_confirmation: 'Test@123',
    };

    it('should register an adopter successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register/adopter').send(validData);

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Verifique seu e-mail');

      const db = getTestDb();
      const user = await db('users').where({ email: 'joao@email.com' }).first();
      expect(user).toBeDefined();
      expect(user.role).toBe('adopter');
      expect(user.email_confirmed_at).toBeNull();

      const confirmation = await db('email_confirmations').where({ user_id: user.id }).first();
      expect(confirmation).toBeDefined();
      expect(confirmation.token).toHaveLength(128);
    });

    it('should return 409 if email already exists', async () => {
      await request(app).post('/api/v1/auth/register/adopter').send(validData);
      const res = await request(app).post('/api/v1/auth/register/adopter').send(validData);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 409 for email case-insensitive duplicate', async () => {
      await request(app).post('/api/v1/auth/register/adopter').send(validData);
      const res = await request(app)
        .post('/api/v1/auth/register/adopter')
        .send({ ...validData, email: 'JOAO@EMAIL.COM' });

      expect(res.status).toBe(409);
    });

    it('should return 422 for weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/adopter')
        .send({ ...validData, password: 'weak', password_confirmation: 'weak' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 for mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/adopter')
        .send({ ...validData, password_confirmation: 'Different@1' });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.password_confirmation).toContain('não coincidem');
    });
  });

  describe('POST /api/v1/auth/register/ong', () => {
    const validData = {
      name: 'Maria ONG Admin',
      email: 'maria@ong.com',
      password: 'Test@123',
      password_confirmation: 'Test@123',
      ong_name: 'ONG Patinhas',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      address: 'Rua dos Gatos, 123',
    };

    it('should register ONG admin successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register/ong').send(validData);

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('sua ONG passará por aprovação');

      const db = getTestDb();
      const user = await db('users').where({ email: 'maria@ong.com' }).first();
      expect(user.role).toBe('ong_admin');
      expect(user.ong_id).toBeDefined();

      const ong = await db('ongs').where({ id: user.ong_id }).first();
      expect(ong.status).toBe('pending');
      expect(ong.cnpj).toBe('12.345.678/0001-90');
    });

    it('should return 409 if CNPJ already exists', async () => {
      await request(app).post('/api/v1/auth/register/ong').send(validData);
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, email: 'outro@email.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CNPJ_ALREADY_EXISTS');
    });
  });
});
