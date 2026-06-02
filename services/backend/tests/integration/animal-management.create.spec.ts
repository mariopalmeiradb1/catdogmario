import request from 'supertest';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';
import { generateAccessToken } from '~/shared/utils/token.util';

jest.mock('~/shared/services/mail/mail.service', () => ({
  mailService: { send: jest.fn().mockResolvedValue(undefined) },
}));

describe('Animal Management - Create Integration', () => {
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
    const ongId = 'ong-test-001';
    await db('ongs').insert({
      id: ongId,
      name: 'ONG Teste Animais',
      cnpj: '12345678000100',
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
    const userId = `user-${role}-${Date.now()}`;
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

  const validBody = {
    name: 'Rex',
    species: 'dog',
    breed: 'Labrador',
    sex: 'male',
    castration: 'yes',
    temperament: ['docile', 'playful'],
    estimated_age_category: 'adult',
  };

  describe('POST /api/v1/animal-management', () => {
    it('should create an animal successfully with valid data and volunteer token', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('ong_volunteer', ongId);
      const token = getToken(userId, 'ong_volunteer', ongId);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Rex');
      expect(res.body.data.species).toBe('dog');
      expect(res.body.data.breed).toBe('Labrador');
      expect(res.body.data.status).toBe('available');
      expect(res.body.duplicateWarning).toBe(false);

      const db = getTestDb();
      const animal = await db('animals').where('id', res.body.data.id).first();
      expect(animal).toBeDefined();
      expect(animal.ong_id).toBe(ongId);
      expect(animal.status).toBe('available');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/animal-management')
        .send(validBody);

      expect(res.status).toBe(401);
    });

    it('should return 403 when user is adopter', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('adopter', null);
      const token = getToken(userId, 'adopter', null);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(403);
    });

    it('should return 422 when required field is missing', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('ong_admin', ongId);
      const token = getToken(userId, 'ong_admin', ongId);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Rex' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields).toBeDefined();
    });

    it('should return 422 when temperament array is empty', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('ong_admin', ongId);
      const token = getToken(userId, 'ong_admin', ongId);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, temperament: [] });

      expect(res.status).toBe(422);
      expect(res.body.error.fields.temperament).toBeDefined();
    });

    it('should return 403 when ONG is not approved', async () => {
      const db = getTestDb();
      const ongId = 'ong-pending-001';
      await db('ongs').insert({
        id: ongId,
        name: 'ONG Pendente',
        cnpj: '98765432000199',
        phone: '11888888888',
        address: 'Rua Pendente, 456',
        description: 'ONG pendente de aprovação para testes de cadastro de animais no sistema.',
        capacity: 20,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      });
      const userId = await createUser('ong_admin', ongId);
      const token = getToken(userId, 'ong_admin', ongId);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ONG_NOT_APPROVED');
    });

    it('should return duplicateWarning true when same name+species+breed exists in same ONG', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('ong_volunteer', ongId);
      const token = getToken(userId, 'ong_volunteer', ongId);

      await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.duplicateWarning).toBe(true);
    });

    it('should not warn about duplicates from another ONG', async () => {
      const db = getTestDb();

      const ongId1 = 'ong-first-001';
      await db('ongs').insert({
        id: ongId1,
        name: 'ONG Um',
        cnpj: '11111111000111',
        phone: '11111111111',
        address: 'Rua Um, 1',
        description: 'Primeira ONG para teste de isolamento multi-tenant no sistema de animais.',
        capacity: 10,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const ongId2 = 'ong-second-002';
      await db('ongs').insert({
        id: ongId2,
        name: 'ONG Dois',
        cnpj: '22222222000122',
        phone: '22222222222',
        address: 'Rua Dois, 2',
        description: 'Segunda ONG para teste de isolamento multi-tenant no sistema de animais.',
        capacity: 10,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const user1 = await createUser('ong_admin', ongId1);
      const token1 = getToken(user1, 'ong_admin', ongId1);

      await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token1}`)
        .send(validBody);

      const user2 = await createUser('ong_volunteer', ongId2);
      const token2 = getToken(user2, 'ong_volunteer', ongId2);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token2}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body.duplicateWarning).toBe(false);
    });

    it('should accept optional fields as null without error', async () => {
      const ongId = await createApprovedOng();
      const userId = await createUser('ong_admin', ongId);
      const token = getToken(userId, 'ong_admin', ongId);

      const res = await request(app)
        .post('/api/v1/animal-management')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...validBody,
          size: null,
          weight_kg: null,
          height_cm: null,
          length_cm: null,
          special_needs_description: null,
          rescue_observations: null,
          general_observations: null,
        });

      expect(res.status).toBe(201);
    });
  });
});
