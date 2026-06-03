import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adopter Management - Create Integration', () => {
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

  async function createUser(role: string, ongId: string | null): Promise<string> {
    const db = getTestDb();
    const userId = crypto.randomUUID();
    await db('users').insert({
      id: userId,
      name: `Test ${role}`,
      email: `${userId}@test.com`,
      password_hash: '$2b$10$dummyhashfortest',
      role,
      ong_id: ongId,
      email_confirmed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });
    return userId;
  }

  function getToken(userId: string, role: string, ongId: string | null): string {
    return generateAccessToken({
      userId,
      role: role as 'ong_admin' | 'ong_volunteer' | 'adopter' | 'system_admin',
      ongId,
    });
  }

  const validProfileData = {
    full_name: 'Maria da Silva',
    cpf: '529.982.247-25',
    rg: '123456789',
    birth_date: '1990-05-15',
    phone: '11999999999',
    cep: '01001000',
    street: 'Rua dos Testes',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    has_current_animals: false,
    had_animals_before: false,
  };

  describe('POST /api/v1/adopter-management', () => {
    it('should create adopter profile successfully', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validProfileData);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.full_name).toBe('Maria da Silva');
      expect(res.body.data.cpf).toBe('52998224725');
      expect(res.body.data.status).toBe('active');

      const db = getTestDb();
      const record = await db('adopter_profiles').where('user_id', adopterId).first();
      expect(record).toBeDefined();
      expect(record.cpf).toBe('52998224725');
    });

    it('should return 409 when CPF is already registered', async () => {
      const adopterId1 = await createUser('adopter', null);
      const adopterId2 = await createUser('adopter', null);
      const token1 = getToken(adopterId1, 'adopter', null);
      const token2 = getToken(adopterId2, 'adopter', null);

      await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token1}`)
        .send(validProfileData);

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token2}`)
        .send(validProfileData);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CPF_ALREADY_REGISTERED');
    });

    it('should return 422 when CPF is invalid (all same digits)', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validProfileData, cpf: '111.111.111-11' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_CPF');
    });

    it('should return 422 when adopter is under 18', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const today = new Date();
      const underageBirthDate = `${today.getFullYear() - 17}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validProfileData, birth_date: underageBirthDate });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('UNDERAGE_ADOPTER');
    });

    it('should return 409 when user already has profile', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validProfileData);

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validProfileData, cpf: '111.444.777-35' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ADOPTER_PROFILE_ALREADY_EXISTS');
    });

    it('should return 422 when required fields are missing', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send({ full_name: 'Incomplete' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/adopter-management')
        .send(validProfileData);

      expect(res.status).toBe(401);
    });

    it('should return 403 when user is ong_volunteer', async () => {
      const db = getTestDb();
      const ongId = crypto.randomUUID();
      await db('ongs').insert({
        id: ongId,
        name: 'ONG Teste',
        cnpj: `${Date.now()}`.slice(0, 14),
        phone: '11999999999',
        address: 'Rua Teste, 123',
        description: 'ONG dedicada ao resgate de animais abandonados para garantir proteção e cuidado.',
        capacity: 50,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const volunteerId = await createUser('ong_volunteer', ongId);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post('/api/v1/adopter-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validProfileData);

      expect(res.status).toBe(403);
    });
  });
});
