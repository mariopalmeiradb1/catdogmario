import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adoption Requests - Create Integration', () => {
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
      name: 'ONG Teste Adoção',
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

  async function createAnimal(ongId: string, status = 'available'): Promise<string> {
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
      status,
      castration: 'yes',
      estimated_age_category: 'adult',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return animalId;
  }

  function getToken(userId: string, role: string, ongId: string | null): string {
    return generateAccessToken({
      userId,
      role: role as 'ong_admin' | 'ong_volunteer' | 'adopter' | 'system_admin',
      ongId,
    });
  }

  describe('POST /api/v1/adoption-requests', () => {
    it('should create an adoption request successfully', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: animalId });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.animal_id).toBe(animalId);
      expect(res.body.status).toBe('pending');
      expect(res.body.created_at).toBeDefined();

      const db = getTestDb();
      const record = await db('adoption_requests').where('id', res.body.id).first();
      expect(record).toBeDefined();
      expect(record.adopter_id).toBe(adopterId);
      expect(record.ong_id).toBe(ongId);
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .send({ animal_id: crypto.randomUUID() });

      expect(res.status).toBe(401);
    });

    it('should return 403 when user is ong_volunteer', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('ong_volunteer', ongId);
      const token = getToken(userId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: crypto.randomUUID() });

      expect(res.status).toBe(403);
    });

    it('should return 422 when animal_id is not a valid UUID', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: 'not-a-uuid' });

      expect(res.status).toBe(422);
    });

    it('should return 422 when animal does not exist', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: '00000000-0000-4000-a000-000000000000' });

      expect(res.status).toBe(422);
    });

    it('should return 422 when animal is adopted', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId, 'adopted');
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: animalId });

      expect(res.status).toBe(422);
    });

    it('should return 409 when duplicate active request exists', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const token = getToken(adopterId, 'adopter', null);

      await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: animalId });

      const res = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: animalId });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_ADOPTION_REQUEST');
    });

    it('should allow adopter to create requests for animals from different ONGs', async () => {
      const ongId1 = await createApprovedOng();
      const ongId2 = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId1 = await createAnimal(ongId1);
      const animalId2 = await createAnimal(ongId2);
      const token = getToken(adopterId, 'adopter', null);

      const res1 = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: animalId1 });

      const res2 = await request(app)
        .post('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`)
        .send({ animal_id: animalId2 });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
    });
  });
});
