import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adoption Requests - List Integration', () => {
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
      name: 'ONG Teste Listagem',
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

  async function createAdoptionRequest(
    animalId: string,
    adopterId: string,
    ongId: string,
    status = 'pending',
  ): Promise<string> {
    const db = getTestDb();
    const requestId = crypto.randomUUID();
    await db('adoption_requests').insert({
      id: requestId,
      animal_id: animalId,
      adopter_id: adopterId,
      ong_id: ongId,
      status,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return requestId;
  }

  function getToken(userId: string, role: string, ongId: string | null): string {
    return generateAccessToken({
      userId,
      role: role as 'ong_admin' | 'ong_volunteer' | 'adopter' | 'system_admin',
      ongId,
    });
  }

  describe('GET /api/v1/adoption-requests (volunteer)', () => {
    it('should return 200 with list of requests for ong volunteer', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      await createAdoptionRequest(animalId, adopterId, ongId);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.data[0].adopter_name).toBeDefined();
      expect(res.body.data[0].animal_name).toBeDefined();
    });

    it('should filter by status', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      await createAdoptionRequest(animalId, adopterId, ongId, 'pending');
      await createAdoptionRequest(animalId, adopterId, ongId, 'approved');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get('/api/v1/adoption-requests?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('pending');
    });

    it('should filter by animal_id', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const animal1 = await createAnimal(ongId);
      const animal2 = await createAnimal(ongId);
      await createAdoptionRequest(animal1, adopterId, ongId);
      await createAdoptionRequest(animal2, adopterId, ongId);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/adoption-requests?animal_id=${animal1}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/adoption-requests');
      expect(res.status).toBe(401);
    });

    it('should return 403 for adopter role', async () => {
      const adopterId = await createUser('adopter', null);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .get('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should isolate requests by ong (multi-tenant)', async () => {
      const ongId1 = await createApprovedOng();
      const ongId2 = await createApprovedOng();
      const vol1 = await createUser('ong_volunteer', ongId1);
      const adopterId = await createUser('adopter', null);
      const animal1 = await createAnimal(ongId1);
      const animal2 = await createAnimal(ongId2);
      await createAdoptionRequest(animal1, adopterId, ongId1);
      await createAdoptionRequest(animal2, adopterId, ongId2);
      const token = getToken(vol1, 'ong_volunteer', ongId1);

      const res = await request(app)
        .get('/api/v1/adoption-requests')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should respect pagination', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);

      for (let i = 0; i < 3; i++) {
        await createAdoptionRequest(animalId, adopterId, ongId);
      }

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get('/api/v1/adoption-requests?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/v1/adoption-requests/mine (adopter)', () => {
    it('should return 200 with adopter own requests', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      await createAdoptionRequest(animalId, adopterId, ongId);
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .get('/api/v1/adoption-requests/mine')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].ong_name).toBeDefined();
      expect(res.body.data[0].animal_name).toBeDefined();
    });

    it('should filter adopter requests by status', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      await createAdoptionRequest(animalId, adopterId, ongId, 'pending');
      await createAdoptionRequest(animalId, adopterId, ongId, 'cancelled');
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .get('/api/v1/adoption-requests/mine?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('pending');
    });
  });
});
