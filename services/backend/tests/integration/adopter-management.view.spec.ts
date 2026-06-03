import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adopter Management - View Integration', () => {
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

  async function createApprovedOng(): Promise<string> {
    const db = getTestDb();
    const ongId = crypto.randomUUID();
    await db('ongs').insert({
      id: ongId,
      name: 'ONG Teste View',
      cnpj: `${Date.now()}`.slice(0, 14),
      phone: '11999999999',
      address: 'Rua dos Animais, 123',
      description: 'ONG dedicada ao resgate de animais abandonados para garantir proteção e cuidado.',
      capacity: 50,
      status: 'approved',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return ongId;
  }

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

  async function createAnimal(ongId: string): Promise<string> {
    const db = getTestDb();
    const animalId = crypto.randomUUID();
    await db('animals').insert({
      id: animalId,
      ong_id: ongId,
      name: 'Rex',
      species: 'dog',
      breed: 'Labrador',
      sex: 'male',
      size: 'medium',
      estimated_age_months: 24,
      temperament: JSON.stringify(['docile']),
      status: 'available',
      castration: 'yes',
      estimated_age_category: 'adult',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return animalId;
  }

  async function createAdoptionRequest(adopterId: string, ongId: string, animalId: string): Promise<string> {
    const db = getTestDb();
    const requestId = crypto.randomUUID();
    await db('adoption_requests').insert({
      id: requestId,
      animal_id: animalId,
      adopter_id: adopterId,
      ong_id: ongId,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return requestId;
  }

  describe('GET /api/v1/adopter-management/:id', () => {
    it('should return masked profile for volunteer with adoption request in ONG', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const profileId = await createAdopterWithProfile(adopterId);
      const volunteerId = await createUser('ong_volunteer', ongId);
      const animalId = await createAnimal(ongId);
      await createAdoptionRequest(adopterId, ongId, animalId);

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/adopter-management/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cpf).toBe('***.982.247-**');
      expect(res.body.data.rg).toBe('*****6789');
      expect(res.body.data.full_name).toBe('Maria da Silva');
    });

    it('should return 403 when volunteer has no adoption request in ONG for this adopter', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const profileId = await createAdopterWithProfile(adopterId);
      const volunteerId = await createUser('ong_volunteer', ongId);

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/adopter-management/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED_PROFILE_ACCESS');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .get(`/api/v1/adopter-management/${crypto.randomUUID()}`);

      expect(res.status).toBe(401);
    });

    it('should return 403 when adopter tries to access another adopter profile', async () => {
      const adopterId = await createUser('adopter', null);
      const profileId = await createAdopterWithProfile(adopterId);
      const anotherAdopterId = await createUser('adopter', null);
      const token = getToken(anotherAdopterId, 'adopter', null);

      const res = await request(app)
        .get(`/api/v1/adopter-management/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/adopter-management/me', () => {
    it('should return full profile for adopter', async () => {
      const adopterId = await createUser('adopter', null);
      await createAdopterWithProfile(adopterId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .get('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cpf).toBe('52998224725');
      expect(res.body.data.full_name).toBe('Maria da Silva');
    });

    it('should return 404 when adopter has no profile', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .get('/api/v1/adopter-management/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ADOPTER_PROFILE_NOT_FOUND');
    });
  });
});
