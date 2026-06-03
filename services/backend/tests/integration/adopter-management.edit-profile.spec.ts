import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adopter Management - Edit Profile Integration', () => {
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
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      has_current_animals: true,
      current_animals_description: '1 gato',
      had_animals_before: false,
      previous_animals_description: null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return profileId;
  }

  describe('PUT /api/v1/adopter-management/me', () => {
    it('should update phone successfully', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11888888888' });

      expect(res.status).toBe(200);
      expect(res.body.data.phone).toBe('11888888888');

      const db = getTestDb();
      const record = await db('adopter_profiles').where('user_id', adopterId).first();
      expect(record.phone).toBe('11888888888');
    });

    it('should update full address successfully', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cep: '04567000',
          street: 'Avenida Nova',
          number: '456',
          complement: 'Apto 12',
          neighborhood: 'Vila Nova',
          city: 'Rio de Janeiro',
          state: 'RJ',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.street).toBe('Avenida Nova');
      expect(res.body.data.city).toBe('Rio de Janeiro');
      expect(res.body.data.state).toBe('RJ');
      expect(res.body.data.complement).toBe('Apto 12');
    });

    it('should ignore cpf field in body - CPF must not change', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11777777777', cpf: '11144477735' });

      expect(res.status).toBe(200);
      expect(res.body.data.cpf).toBe('52998224725');
      expect(res.body.data.phone).toBe('11777777777');
    });

    it('should return 422 when birth_date makes adopter under 18', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const today = new Date();
      const underageBirthDate = `${today.getFullYear() - 10}-06-01`;

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ birth_date: underageBirthDate });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('UNDERAGE_ADOPTER');
    });

    it('should update has_current_animals from true to false', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ has_current_animals: false, current_animals_description: '' });

      expect(res.status).toBe(200);
      expect(res.body.data.has_current_animals).toBe(false);
    });

    it('should return 200 when sending same data (no changes)', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11999999999' });

      expect(res.status).toBe(200);
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .put('/api/v1/adopter-management/me')
        .send({ phone: '11888888888' });

      expect(res.status).toBe(401);
    });

    it('should record audit log with changed fields', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      await request(app)
        .put('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '11666666666', city: 'Campinas' });

      const db = getTestDb();
      const auditLog = await db('audit_logs')
        .where('action', 'adopter_profile.update')
        .where('user_id', adopterId)
        .orderBy('created_at', 'desc')
        .first();

      expect(auditLog).toBeDefined();
      const metadata = JSON.parse(auditLog.metadata);
      expect(metadata.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'phone', old_value: '11999999999', new_value: '11666666666' }),
          expect.objectContaining({ field: 'city', old_value: 'São Paulo', new_value: 'Campinas' }),
        ]),
      );
    });
  });
});
