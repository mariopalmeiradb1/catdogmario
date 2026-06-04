import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Follow-Up Contact - Integration', () => {
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
      name: 'ONG Teste Follow-Up',
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

  function getToken(userId: string, role: string, ongId: string | null): string {
    return generateAccessToken({
      userId,
      role: role as 'ong_admin' | 'ong_volunteer' | 'adopter' | 'system_admin',
      ongId,
    });
  }

  describe('POST /api/v1/follow-up/reminders/:id/contact', () => {
    it('should register a contact successfully for a pending reminder', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Animal adaptado, tutor satisfeito com a adoção.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        reminder_id: reminderId,
        status: 'positive',
        observation: 'Animal adaptado, tutor satisfeito com a adoção.',
      });

      const db = getTestDb();
      const reminder = await db('follow_up_reminders').where({ id: reminderId }).first();
      expect(reminder.status).toBe('completed');
    });

    it('should register a contact for an overdue reminder', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1, 'overdue', '2026-05-15');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'neutral',
          observation: 'Tentativa atrasada de contato, mas concluída com sucesso.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('neutral');
    });

    it('should return 422 when reminder is already completed', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1, 'completed');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Tentando registrar novamente.',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toBe('Este acompanhamento já foi registrado.');
    });

    it('should return 422 when reminder is cancelled', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1, 'cancelled');
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Tentando registrar em lembrete cancelado.',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toBe('Não é possível registrar contato para um acompanhamento cancelado.');
    });

    it('should return 422 when contact date is in the future', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2027-01-01',
          status: 'positive',
          observation: 'Data futura não deveria ser permitida.',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toBe('A data do contato não pode ser posterior a hoje.');
    });

    it('should return 422 when contact date is before adoption date', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-04-01',
          status: 'positive',
          observation: 'Data anterior à adoção não deveria ser permitida.',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('A data do contato não pode ser anterior à data de adoção');
    });

    it('should return 422 when observation is too short', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1);
      const token = getToken(volunteerId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Curta',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.observation).toBe('A observação deve ter no mínimo 10 caracteres.');
    });

    it('should return 404 when volunteer from another ONG tries to register', async () => {
      const ongA = await createApprovedOng();
      const ongB = await createApprovedOng();
      const volunteerB = await createUser('ong_volunteer', ongB);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongA, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongA, 1);
      const token = getToken(volunteerB, 'ong_volunteer', ongB);

      const res = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Voluntário de outra ONG tentando registrar.',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/follow-up/contacts/:id', () => {
    it('should allow admin to edit contact observation', async () => {
      const ongId = await createApprovedOng();
      const adminId = await createUser('ong_admin', ongId);
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1);

      const volunteerToken = getToken(volunteerId, 'ong_volunteer', ongId);
      const createRes = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Observação original do voluntário.',
        });

      const contactId = createRes.body.data.id;
      const adminToken = getToken(adminId, 'ong_admin', ongId);

      const res = await request(app)
        .put(`/api/v1/follow-up/contacts/${contactId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observation: 'Observação editada pelo administrador.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.observation).toBe('Observação editada pelo administrador.');
    });

    it('should return 403 when volunteer tries to edit', async () => {
      const ongId = await createApprovedOng();
      const volunteerId = await createUser('ong_volunteer', ongId);
      const adopterId = await createUser('adopter', null);
      const adoptionRequestId = await createCompletedAdoption(ongId, adopterId);
      const reminderId = await createReminder(adoptionRequestId, ongId, 1);

      const token = getToken(volunteerId, 'ong_volunteer', ongId);
      const createRes = await request(app)
        .post(`/api/v1/follow-up/reminders/${reminderId}/contact`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact_date: '2026-06-01',
          status: 'positive',
          observation: 'Observação do voluntário para teste.',
        });

      const contactId = createRes.body.data.id;

      const res = await request(app)
        .put(`/api/v1/follow-up/contacts/${contactId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          observation: 'Tentativa de edição sem permissão.',
        });

      expect(res.status).toBe(403);
    });
  });
});
