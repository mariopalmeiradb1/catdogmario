import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Adopter Management - Volunteer View Integration', () => {
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
      name: 'ONG Teste Voluntário',
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
      full_name: 'Carlos Oliveira',
      cpf: '52998224725',
      rg: '987654321',
      birth_date: '1985-03-20',
      phone: '11999888777',
      cep: '01001000',
      street: 'Rua do Adotante',
      number: '42',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      has_current_animals: false,
      had_animals_before: true,
      previous_animals_description: '2 gatos',
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
      name: 'Luna',
      species: 'cat',
      breed: 'Siamesa',
      sex: 'female',
      size: 'small',
      estimated_age_months: 12,
      temperament: JSON.stringify(['calm']),
      status: 'available',
      castration: 'yes',
      estimated_age_category: 'young',
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
    it('should return masked CPF for volunteer with adoption request in ONG', async () => {
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
      expect(res.body.data.full_name).toBe('Carlos Oliveira');
    });

    it('should return masked RG for volunteer', async () => {
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
      expect(res.body.data.rg).toBe('*****4321');
    });

    it('should return 403 when volunteer from another ONG tries to access', async () => {
      const ongId1 = await createApprovedOng();
      const ongId2 = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const profileId = await createAdopterWithProfile(adopterId);
      const animalId = await createAnimal(ongId1);
      await createAdoptionRequest(adopterId, ongId1, animalId);

      const volunteerOng2 = await createUser('ong_volunteer', ongId2);
      const token = getToken(volunteerOng2, 'ong_volunteer', ongId2);

      const res = await request(app)
        .get(`/api/v1/adopter-management/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('UNAUTHORIZED_PROFILE_ACCESS');
    });

    it('should allow ong_admin to view masked profile', async () => {
      const ongId = await createApprovedOng();
      const adopterId = await createUser('adopter', null);
      const profileId = await createAdopterWithProfile(adopterId);
      const adminId = await createUser('ong_admin', ongId);
      const animalId = await createAnimal(ongId);
      await createAdoptionRequest(adopterId, ongId, animalId);

      const token = getToken(adminId, 'ong_admin', ongId);

      const res = await request(app)
        .get(`/api/v1/adopter-management/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cpf).toBe('***.982.247-**');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .get(`/api/v1/adopter-management/${crypto.randomUUID()}`);

      expect(res.status).toBe(401);
    });
  });
});
