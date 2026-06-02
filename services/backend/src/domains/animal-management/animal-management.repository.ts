import { Knex } from 'knex';
import { db } from '~/config/database';
import { AnimalCreatedResponse, AnimalDetail, AnimalListFilters, AnimalListItem, AnimalMedia, CreateAnimalInput, StatusHistoryEntry } from './animal-management.types';

interface CreateAnimalData extends CreateAnimalInput {
  id: string;
  ong_id: string;
}

interface AnimalRow {
  id: string;
  ong_id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string;
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior';
  size: 'small' | 'medium' | 'large' | null;
  weight_kg: number | null;
  height_cm: number | null;
  length_cm: number | null;
  special_needs: boolean;
  special_needs_description: string | null;
  rescue_observations: string | null;
  general_observations: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  inactivated_at: Date | null;
}

interface CreateMediaData {
  id: string;
  animal_id: string;
  type: 'photo' | 'video';
  url: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  sort_order: number;
}

export class AnimalManagementRepository {
  async create(data: CreateAnimalData): Promise<AnimalCreatedResponse> {
    const now = new Date();

    await db('animals').insert({
      id: data.id,
      ong_id: data.ong_id,
      name: data.name,
      species: data.species,
      breed: data.breed,
      sex: data.sex,
      castration: data.castration,
      temperament: JSON.stringify(data.temperament),
      estimated_age_category: data.estimated_age_category,
      size: data.size || null,
      estimated_age_months: 0,
      weight_kg: data.weight_kg || null,
      height_cm: data.height_cm || null,
      length_cm: data.length_cm || null,
      special_needs: data.special_needs || false,
      special_needs_description: data.special_needs_description || null,
      rescue_observations: data.rescue_observations || null,
      general_observations: data.general_observations || null,
      status: 'available',
      created_at: now,
      updated_at: now,
    });

    return {
      id: data.id,
      name: data.name,
      species: data.species,
      breed: data.breed,
      status: 'available',
      created_at: now,
    };
  }

  async findById(id: string, ongId: string): Promise<AnimalRow | null> {
    const row = await db('animals').where({ id, ong_id: ongId }).first();
    return row || null;
  }

  async findByIdWithMedia(id: string, ongId: string): Promise<AnimalDetail | null> {
    const row = await db('animals').where({ id, ong_id: ongId }).first();
    if (!row) return null;

    const mediaRows = await db('animal_media')
      .where({ animal_id: id })
      .orderBy('sort_order', 'asc');

    const temperament = typeof row.temperament === 'string'
      ? JSON.parse(row.temperament)
      : row.temperament || [];

    return {
      id: row.id,
      ong_id: row.ong_id,
      name: row.name,
      species: row.species,
      breed: row.breed,
      sex: row.sex,
      castration: row.castration,
      temperament,
      estimated_age_category: row.estimated_age_category,
      size: row.size || null,
      weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
      height_cm: row.height_cm != null ? Number(row.height_cm) : null,
      length_cm: row.length_cm != null ? Number(row.length_cm) : null,
      special_needs: !!row.special_needs,
      special_needs_description: row.special_needs_description || null,
      rescue_observations: row.rescue_observations || null,
      general_observations: row.general_observations || null,
      status: row.status,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
      inactivated_at: row.inactivated_at ? new Date(row.inactivated_at).toISOString() : null,
      media: mediaRows.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        type: m.type as 'photo' | 'video',
        url: m.url as string,
        original_name: m.original_name as string,
        size_bytes: Number(m.size_bytes),
        mime_type: m.mime_type as string,
        sort_order: Number(m.sort_order),
      })),
    };
  }

  async list(ongId: string, filters: AnimalListFilters): Promise<{ items: AnimalListItem[]; total: number }> {
    const applyFilters = (qb: ReturnType<typeof db>) => {
      qb.where('animals.ong_id', ongId);
      if (filters.status && filters.status !== 'all') {
        qb.where('animals.status', filters.status);
      } else if (!filters.status) {
        qb.where('animals.status', '!=', 'inactive');
      }
    };

    const countResult = await db('animals')
      .modify(applyFilters)
      .count('* as total')
      .first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const rows = await db('animals')
      .select(
        'animals.id',
        'animals.name',
        'animals.species',
        'animals.breed',
        'animals.status',
        'animals.created_at',
        'animals.updated_at',
        db.raw(
          `(SELECT url FROM animal_media WHERE animal_media.animal_id = animals.id AND animal_media.type = 'photo' ORDER BY sort_order ASC LIMIT 1) as photo_url`,
        ),
      )
      .modify(applyFilters)
      .orderBy('animals.created_at', 'desc')
      .limit(filters.limit)
      .offset(offset);

    const items: AnimalListItem[] = rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: r.name as string,
      species: r.species as 'dog' | 'cat',
      breed: r.breed as string,
      status: r.status as AnimalListItem['status'],
      photo_url: (r.photo_url as string) || null,
      created_at: new Date(r.created_at as string).toISOString(),
      updated_at: new Date(r.updated_at as string).toISOString(),
    }));

    return { items, total };
  }

  async update(id: string, fields: Record<string, unknown>): Promise<void> {
    await db('animals')
      .where({ id })
      .update({ ...fields, updated_at: new Date() });
  }

  async inactivate(id: string): Promise<void> {
    const now = new Date();
    await db('animals')
      .where({ id })
      .update({ status: 'inactive', inactivated_at: now, updated_at: now });
  }

  async countMedia(animalId: string, type: 'photo' | 'video'): Promise<number> {
    const result = await db('animal_media')
      .where({ animal_id: animalId, type })
      .count('* as total')
      .first();
    return Number(result?.total || 0);
  }

  async createMedia(data: CreateMediaData): Promise<AnimalMedia> {
    await db('animal_media').insert({
      id: data.id,
      animal_id: data.animal_id,
      type: data.type,
      url: data.url,
      original_name: data.original_name,
      size_bytes: data.size_bytes,
      mime_type: data.mime_type,
      sort_order: data.sort_order,
    });

    return {
      id: data.id,
      type: data.type,
      url: data.url,
      original_name: data.original_name,
      size_bytes: data.size_bytes,
      mime_type: data.mime_type,
      sort_order: data.sort_order,
    };
  }

  async findMediaById(mediaId: string): Promise<{ id: string; animal_id: string; url: string; type: 'photo' | 'video' } | null> {
    const row = await db('animal_media').where({ id: mediaId }).first();
    if (!row) return null;
    return { id: row.id, animal_id: row.animal_id, url: row.url, type: row.type };
  }

  async deleteMedia(mediaId: string): Promise<void> {
    await db('animal_media').where({ id: mediaId }).delete();
  }

  async getNextMediaSortOrder(animalId: string, type: 'photo' | 'video'): Promise<number> {
    const result = await db('animal_media')
      .where({ animal_id: animalId, type })
      .max('sort_order as max_order')
      .first();
    return (Number(result?.max_order ?? -1)) + 1;
  }

  async findDuplicate(ongId: string, name: string, species: string, breed: string): Promise<boolean> {
    const result = await db('animals')
      .where('ong_id', ongId)
      .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
      .where('species', species)
      .whereRaw('LOWER(breed) = ?', [breed.toLowerCase()])
      .select(db.raw('1'))
      .first();

    return !!result;
  }

  async findOngStatus(ongId: string): Promise<string | null> {
    const ong = await db('ongs').where('id', ongId).select('status').first();
    return ong?.status || null;
  }

  async findByIdForUpdate(id: string, ongId: string, trx: Knex.Transaction): Promise<AnimalRow | null> {
    const row = await trx('animals').where({ id, ong_id: ongId }).forUpdate().first();
    return row || null;
  }

  async updateStatus(id: string, status: string, extraFields: Record<string, unknown> | null, trx: Knex.Transaction): Promise<void> {
    await trx('animals')
      .where({ id })
      .update({ status, updated_at: new Date(), ...extraFields });
  }

  async createStatusHistory(entry: StatusHistoryEntry, trx: Knex.Transaction): Promise<void> {
    await trx('animal_status_history').insert({
      ...entry,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    });
  }
}

export const animalManagementRepository = new AnimalManagementRepository();
