import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adoption Requests - Auto Close on Confirm Adoption', () => {
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
      name: 'ONG Teste Auto Close',
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

  async function createAnimal(ongId: string, status = 'in_adoption_process'): Promise<string> {
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

  describe('PATCH /api/v1/animal-management/:id/confirm-adoption', () => {
    it('should cancel pending requests when adoption is confirmed', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopter1Id = await createUser('adopter', null);
      const adopter2Id = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const requestId1 = await createAdoptionRequest(animalId, adopter1Id, ongId, 'pending');
      const requestId2 = await createAdoptionRequest(animalId, adopter2Id, ongId, 'pending');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .patch(`/api/v1/animal-management/${animalId}/confirm-adoption`)
        .set('Authorization', `Bearer ${token}`)
        .send({ responsibility_term_number: 'TR-2026-001' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('adopted');

      const db = getTestDb();
      const req1 = await db('adoption_requests').where('id', requestId1).first();
      const req2 = await db('adoption_requests').where('id', requestId2).first();

      expect(req1.status).toBe('cancelled');
      expect(req1.cancelled_by).toBe('system');
      expect(req1.cancellation_reason).toBe('Animal adotado por outro tutor.');

      expect(req2.status).toBe('cancelled');
      expect(req2.cancelled_by).toBe('system');
      expect(req2.cancellation_reason).toBe('Animal adotado por outro tutor.');
    });

    it('should only cancel pending and in_review requests, not approved ones', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopter1Id = await createUser('adopter', null);
      const adopter2Id = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const approvedRequestId = await createAdoptionRequest(animalId, adopter1Id, ongId, 'approved');
      const pendingRequestId = await createAdoptionRequest(animalId, adopter2Id, ongId, 'pending');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .patch(`/api/v1/animal-management/${animalId}/confirm-adoption`)
        .set('Authorization', `Bearer ${token}`)
        .send({ responsibility_term_number: 'TR-2026-002' });

      expect(res.status).toBe(200);

      const db = getTestDb();
      const approvedReq = await db('adoption_requests').where('id', approvedRequestId).first();
      const pendingReq = await db('adoption_requests').where('id', pendingRequestId).first();

      expect(approvedReq.status).toBe('approved');
      expect(pendingReq.status).toBe('cancelled');
      expect(pendingReq.cancelled_by).toBe('system');
    });

    it('should confirm adoption normally when animal has no active requests', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const animalId = await createAnimal(ongId);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .patch(`/api/v1/animal-management/${animalId}/confirm-adoption`)
        .set('Authorization', `Bearer ${token}`)
        .send({ responsibility_term_number: 'TR-2026-003' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('adopted');
      expect(res.body.data.responsibility_term_number).toBe('TR-2026-003');
    });

    it('should cancel in_review requests when adoption is confirmed', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const animalId = await createAnimal(ongId);
      const inReviewRequestId = await createAdoptionRequest(animalId, adopterId, ongId, 'in_review');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .patch(`/api/v1/animal-management/${animalId}/confirm-adoption`)
        .set('Authorization', `Bearer ${token}`)
        .send({ responsibility_term_number: 'TR-2026-004' });

      expect(res.status).toBe(200);

      const db = getTestDb();
      const inReviewReq = await db('adoption_requests').where('id', inReviewRequestId).first();

      expect(inReviewReq.status).toBe('cancelled');
      expect(inReviewReq.cancelled_by).toBe('system');
      expect(inReviewReq.cancellation_reason).toBe('Animal adotado por outro tutor.');
    });
  });
});
