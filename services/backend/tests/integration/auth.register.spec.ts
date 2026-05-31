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
      description: 'Uma ONG dedicada ao resgate e cuidado de animais abandonados nas ruas da cidade.',
      capacity: 20,
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
      expect(ong.cnpj).toBe('12345678000190');
      expect(ong.description).toBe(validData.description);
      expect(ong.capacity).toBe(20);
    });

    it('should return 409 if CNPJ already exists', async () => {
      await request(app).post('/api/v1/auth/register/ong').send(validData);
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, email: 'outro@email.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CNPJ_ALREADY_EXISTS');
    });

    it('should return 422 when description is missing', async () => {
      const { description: _, ...dataWithoutDescription } = validData;
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send(dataWithoutDescription);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 when description has less than 50 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, description: 'Texto curto demais para ser aceito.' });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.description).toBeDefined();
    });

    it('should return 422 when description has more than 500 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, description: 'a'.repeat(501) });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.description).toBeDefined();
    });

    it('should return 422 when description is only whitespace', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, description: ' '.repeat(60) });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.description).toBeDefined();
    });

    it('should return 422 when capacity is zero', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, capacity: 0 });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.capacity).toBeDefined();
    });

    it('should return 422 when capacity is negative', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, capacity: -1 });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.capacity).toBeDefined();
    });

    it('should return 422 when capacity is a decimal', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, capacity: 3.5 });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.capacity).toBeDefined();
    });

    it('should return 422 when capacity is not a number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, capacity: 'abc' });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.capacity).toBeDefined();
    });

    it('should accept description with exactly 50 characters', async () => {
      const desc50 = 'a'.repeat(50);
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, email: 'border@test.com', description: desc50 });

      expect(res.status).toBe(201);

      const db = getTestDb();
      const user = await db('users').where({ email: 'border@test.com' }).first();
      const ong = await db('ongs').where({ id: user.ong_id }).first();
      expect(ong.description).toBe(desc50);
    });

    it('should accept capacity of exactly 1', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register/ong')
        .send({ ...validData, email: 'cap1@test.com', capacity: 1 });

      expect(res.status).toBe(201);

      const db = getTestDb();
      const user = await db('users').where({ email: 'cap1@test.com' }).first();
      const ong = await db('ongs').where({ id: user.ong_id }).first();
      expect(ong.capacity).toBe(1);
    });
  });
});
