import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adopter Management - Update Integration', () => {
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

  async function createAdopterWithProfile(userId: string): Promise<string> {
    const db = getTestDb();
    const profileId = crypto.randomUUID();
    await db('adopter_profiles').insert({
      id: profileId,
      user_id: userId,
      full_name: 'Maria da Silva',
      cpf: '52998224725',
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
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return profileId;
  }

  describe('PUT /api/v1/adopter-management/me', () => {
    it('should update phone and address successfully', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11888888888', street: 'Rua Nova' });

      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('11888888888');
      expect(res.body.data.street).toBe('Rua Nova');
      expect(res.body.data.cpf).toBe('52998224725');
    });

    it('should ignore cpf field in body (not updateable)', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11888888888', cpf: '11144477735' });

      expect(res.status).toBe(200);
      expect(res.body.data.cpf).toBe('52998224725');
    });

    it('should return 422 when birth_date makes adopter under 18', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const today = new Date();
      const underageBirthDate = `${today.getFullYear() - 10}-01-01`;

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ birth_date: underageBirthDate });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('UNDERAGE_ADOPTER');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .send({ phone: '11888888888' });

      expect(res.status).toBe(401);
    });
  });
});
