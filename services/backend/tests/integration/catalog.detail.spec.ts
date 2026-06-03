import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { getTestApp, getTestDb, setupTestDb, cleanTestDb, destroyTestDb } from '../helpers/setup';

describe('Catalog Detail Integration', () => {
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

  async function createOng(overrides: Record<string, unknown> = {}) {
    const db = getTestDb();
    const id = uuidv4();
    await db('ongs').insert({
      id,
      name: 'ONG Teste',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      address: 'Rua Oculta 123',
      city: 'São Paulo',
      state: 'SP',
      description: 'ONG para testes de catálogo.',
      capacity: 10,
      status: 'approved',
      ...overrides,
    });
    return id;
  }

  async function createAnimal(ongId: string, overrides: Record<string, unknown> = {}) {
    const db = getTestDb();
    const id = uuidv4();
    await db('animals').insert({
      id,
      ong_id: ongId,
      name: 'Rex',
      species: 'dog',
      breed: 'Labrador',
      sex: 'male',
      castration: 'yes',
      temperament: JSON.stringify(['dócil', 'brincalhão']),
      estimated_age_category: 'adult',
      estimated_age_months: 24,
      size: 'large',
      weight_kg: 30,
      height_cm: 60,
      length_cm: 80,
      special_needs: false,
      special_needs_description: null,
      rescue_observations: null,
      general_observations: 'Animal saudável',
      status: 'available',
      ...overrides,
    });
    return id;
  }

  async function createAnimalMedia(animalId: string, overrides: Record<string, unknown> = {}) {
    const db = getTestDb();
    const id = uuidv4();
    await db('animal_media').insert({
      id,
      animal_id: animalId,
      type: 'photo',
      url: 'https://example.com/photo.jpg',
      original_name: 'photo.jpg',
      size_bytes: 102400,
      mime_type: 'image/jpeg',
      sort_order: 1,
      ...overrides,
    });
    return id;
  }

  describe('GET /api/v1/catalog/:id', () => {
    it('should return 200 with full details for an available animal', async () => {
      const ongId = await createOng();
      const animalId = await createAnimal(ongId);
      await createAnimalMedia(animalId);

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(animalId);
      expect(res.body.data.name).toBe('Rex');
      expect(res.body.data.species).toBe('dog');
      expect(res.body.data.breed).toBe('Labrador');
      expect(res.body.data.sex).toBe('male');
      expect(res.body.data.castration).toBe('yes');
      expect(res.body.data.temperament).toEqual(['dócil', 'brincalhão']);
      expect(res.body.data.estimated_age_category).toBe('adult');
      expect(res.body.data.size).toBe('large');
      expect(res.body.data.weight_kg).toBe(30);
      expect(res.body.data.special_needs).toBe(false);
      expect(res.body.data.status).toBe('available');
      expect(res.body.data.media).toHaveLength(1);
      expect(res.body.data.media[0].type).toBe('photo');
      expect(res.body.data.ong.name).toBe('ONG Teste');
      expect(res.body.data.ong.city).toBe('São Paulo');
      expect(res.body.data.ong.state).toBe('SP');
    });

    it('should return 200 for animal in adoption process', async () => {
      const ongId = await createOng();
      const animalId = await createAnimal(ongId, { status: 'in_adoption_process' });

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_adoption_process');
    });

    it('should return 404 for non-existent animal', async () => {
      const fakeId = uuidv4();

      const res = await request(app).get(`/api/v1/catalog/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ANIMAL_NOT_FOUND');
    });

    it('should return 404 for adopted animal', async () => {
      const ongId = await createOng();
      const animalId = await createAnimal(ongId, { status: 'adopted' });

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ANIMAL_NOT_FOUND');
    });

    it('should return 404 for inactive animal', async () => {
      const ongId = await createOng();
      const animalId = await createAnimal(ongId, { status: 'inactive' });

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ANIMAL_NOT_FOUND');
    });

    it('should return 404 when ONG is not approved', async () => {
      const ongId = await createOng({ status: 'pending' });
      const animalId = await createAnimal(ongId);

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('ANIMAL_NOT_FOUND');
    });

    it('should return 400 for non-UUID id', async () => {
      const res = await request(app).get('/api/v1/catalog/not-a-uuid');

      expect(res.status).toBe(422);
    });

    it('should NOT expose sensitive ONG data', async () => {
      const ongId = await createOng();
      const animalId = await createAnimal(ongId);

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.ong.cnpj).toBeUndefined();
      expect(res.body.data.ong.address).toBeUndefined();
      expect(res.body.data.ong_id).toBeUndefined();
    });

    it('should return media ordered by sort_order', async () => {
      const ongId = await createOng();
      const animalId = await createAnimal(ongId);
      await createAnimalMedia(animalId, { sort_order: 2, url: 'https://example.com/b.jpg' });
      await createAnimalMedia(animalId, { sort_order: 1, url: 'https://example.com/a.jpg' });

      const res = await request(app).get(`/api/v1/catalog/${animalId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.media).toHaveLength(2);
      expect(res.body.data.media[0].url).toBe('https://example.com/a.jpg');
      expect(res.body.data.media[1].url).toBe('https://example.com/b.jpg');
    });
  });
});
