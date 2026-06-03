import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adoption Requests - Cancel Integration', () => {
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
      name: 'ONG Teste Cancel',
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

  describe('PATCH /api/v1/adoption-requests/:id/cancel', () => {
    it('should cancel a pending request', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const requestId = await createAdoptionRequest(animalId, adopterId, ongId, 'pending');
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .patch(`/api/v1/adoption-requests/${requestId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const db = getTestDb();
      const updated = await db('adoption_requests').where('id', requestId).first();
      expect(updated.status).toBe('cancelled');
      expect(updated.cancelled_by).toBe('adopter');
    });

    it('should cancel an in_review request', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const requestId = await createAdoptionRequest(animalId, adopterId, ongId, 'in_review');
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .patch(`/api/v1/adoption-requests/${requestId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });

    it('should return 422 for approved request', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const requestId = await createAdoptionRequest(animalId, adopterId, ongId, 'approved');
      const token = getToken(adopterId, 'adopter', null);

      const res = await request(app)
        .patch(`/api/v1/adoption-requests/${requestId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('CANNOT_CANCEL_REQUEST');
    });

    it('should return 404 when trying to cancel another adopter request', async () => {
      const ongId = await createApprovedOng();
      const adopter1 = await createUser('adopter', null);
      const adopter2 = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const requestId = await createAdoptionRequest(animalId, adopter1, ongId, 'pending');
      const token = getToken(adopter2, 'adopter', null);

      const res = await request(app)
        .patch(`/api/v1/adoption-requests/${requestId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const requestId = crypto.randomUUID();
      const res = await request(app)
        .patch(`/api/v1/adoption-requests/${requestId}/cancel`);

      expect(res.status).toBe(401);
    });

    it('should return 403 for ong_volunteer', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);
      const requestId = crypto.randomUUID();

      const res = await request(app)
        .patch(`/api/v1/adoption-requests/${requestId}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
