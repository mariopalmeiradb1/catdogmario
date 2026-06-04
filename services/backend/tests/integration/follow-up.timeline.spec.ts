import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Follow-Up Timeline - Integration', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await cleanTestDb();
    const db = getTestDb();
    await db('follow_up_contacts').del();
    await db('follow_up_reminders').del();
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
      name: 'ONG Teste Timeline',
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

  async function createUser(role: string, ongId: string | null, name?: string): Promise<string> {
    const db = getTestDb();
    const userId = crypto.randomUUID();
    await db('users').insert({
      id: userId,
      name: name || `Test ${role}`,
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

  async function createCompletedAdoption(ongId: string, adopterId: string, animalName = 'Rex'): Promise<string> {
    const db = getTestDb();
    const animalId = crypto.randomUUID();
    await db('animals').insert({
      id: animalId,
      ong_id: ongId,
      name: animalName,
      species: 'dog',
      breed: 'Labrador',
      sex: 'male',
      size: 'medium',
      estimated_age_months: 24,
      temperament: JSON.stringify(['docile']),
      status: 'adopted',
      castration: 'yes',
      estimated_age_category: 'adult',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const requestId = crypto.randomUUID();
    await db('adoption_requests').insert({
      id: requestId,
      animal_id: animalId,
      adopter_id: adopterId,
      ong_id: ongId,
      status: 'completed',
      completed_at: new Date('2026-05-01'),
      created_at: new Date(),
      updated_at: new Date(),
    });

    return requestId;
  }

  async function createReminder(
    adoptionRequestId: string,
    ongId: string,
    reminderNumber: number,
    status: string = 'pending',
    dueDate?: string,
  ): Promise<string> {
    const db = getTestDb();
    const reminderId = crypto.randomUUID();
    await db('follow_up_reminders').insert({
      id: reminderId,
      adoption_request_id: adoptionRequestId,
      ong_id: ongId,
      reminder_number: reminderNumber,
      due_date: dueDate || '2026-06-01',
      status,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return reminderId;
  }

  async function createContact(
    reminderId: string,
    registeredBy: string,
    ongId: string,
    status: string = 'positive',
  ): Promise<string> {
    const db = getTestDb();
    const contactId = crypto.randomUUID();
    await db('follow_up_contacts').insert({
      id: contactId,
      reminder_id: reminderId,
      registered_by: registeredBy,
      ong_id: ongId,
      contact_date: '2026-06-01',
      status,
      observation: 'Observação do contato de teste realizado.',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return contactId;
  }

  function getToken(userId: string, role: string, ongId: string | null): string {
    return generateAccessToken({
      userId,
      role: role as 'ong_admin' | 'ong_volunteer' | 'adopter' | 'system_admin',
      ongId,
    });
  }

  describe('GET /api/v1/follow-up/adoptions/:adoptionRequestId/timeline', () => {
    it('should return timeline with 3 entries for an adoption with reminders', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId, 'Voluntário João');
      const adopterId = await createUser('adopter', null, 'Maria Tutora');
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId, 'Rex');

      const r1 = await createReminder(adoptionRequestId, ongId, 1, 'completed', '2026-05-31');
      const r2 = await createReminder(adoptionRequestId, ongId, 2, 'completed', '2026-06-30');
      await createReminder(adoptionRequestId, ongId, 3, 'pending', '2026-07-30');

      await createContact(r1, volunteerId, ongId, 'positive');
      await createContact(r2, volunteerId, ongId, 'neutral');

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entries).toHaveLength(3);
      expect(res.body.data.animal_name).toBe('Rex');
      expect(res.body.data.adopter_name).toBe('Maria Tutora');
      expect(res.body.data.is_complete).toBe(false);
      expect(res.body.data.has_no_response_pattern).toBe(false);
      expect(res.body.data.entries[0].reminder_number).toBe(1);
      expect(res.body.data.entries[0].contact).not.toBeNull();
      expect(res.body.data.entries[2].contact).toBeNull();
    });

    it('should return is_complete=true when all 3 reminders are completed', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);

      const r1 = await createReminder(adoptionRequestId, ongId, 1, 'completed', '2026-05-31');
      const r2 = await createReminder(adoptionRequestId, ongId, 2, 'completed', '2026-06-30');
      const r3 = await createReminder(adoptionRequestId, ongId, 3, 'completed', '2026-07-30');

      await createContact(r1, volunteerId, ongId, 'positive');
      await createContact(r2, volunteerId, ongId, 'positive');
      await createContact(r3, volunteerId, ongId, 'positive');

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.is_complete).toBe(true);
    });

    it('should return has_no_response_pattern=true when 2+ consecutive no_response', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);

      const r1 = await createReminder(adoptionRequestId, ongId, 1, 'completed', '2026-05-31');
      const r2 = await createReminder(adoptionRequestId, ongId, 2, 'completed', '2026-06-30');
      await createReminder(adoptionRequestId, ongId, 3, 'pending', '2026-07-30');

      await createContact(r1, volunteerId, ongId, 'no_response');
      await createContact(r2, volunteerId, ongId, 'no_response');

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.has_no_response_pattern).toBe(true);
    });

    it('should return has_no_response_pattern=false with only 1 no_response', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);

      const r1 = await createReminder(adoptionRequestId, ongId, 1, 'completed', '2026-05-31');
      const r2 = await createReminder(adoptionRequestId, ongId, 2, 'completed', '2026-06-30');
      await createReminder(adoptionRequestId, ongId, 3, 'pending', '2026-07-30');

      await createContact(r1, volunteerId, ongId, 'no_response');
      await createContact(r2, volunteerId, ongId, 'positive');

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.has_no_response_pattern).toBe(false);
    });

    it('should return 404 when adoption belongs to another ONG', async () => {
      const ongA = await createApprovedOng();
      const ongB = await createApprovedOng();
      const volunteerB = await createUser('ong_volunteer', ongB);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongA, adopterId);

      await createReminder(adoptionRequestId, ongA, 1);

      const token = getToken(volunteerB, 'ong_volunteer', ongB);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when adoption has no reminders', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return entries ordered by reminder_number', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);

      await createReminder(adoptionRequestId, ongId, 3, 'pending', '2026-07-30');
      await createReminder(adoptionRequestId, ongId, 1, 'completed', '2026-05-31');
      await createReminder(adoptionRequestId, ongId, 2, 'pending', '2026-06-30');

      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .get(`/api/v1/follow-up/adoptions/${adoptionRequestId}/timeline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.entries[0].reminder_number).toBe(1);
      expect(res.body.data.entries[1].reminder_number).toBe(2);
      expect(res.body.data.entries[2].reminder_number).toBe(3);
    });
  });
});
