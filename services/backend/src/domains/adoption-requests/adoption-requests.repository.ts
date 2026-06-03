import { db } from '~/config/database';
import type { Knex } from 'knex';
import type {
  AdoptionRequestCreatedResponse,
  AdoptionRequestDetail,
  AdoptionRequestListFilters,
  AdoptionRequestListItem,
  AdoptionRequestStatus,
  AdopterRequestListFilters,
  AdopterRequestListItem,
} from './adoption-requests.types';

export class AdoptionRequestsRepository {
  async create(data: {
    id: string;
    animal_id: string;
    adopter_id: string;
    ong_id: string;
  }): Promise<AdoptionRequestCreatedResponse> {
    const now = new Date();

    await db('adoption_requests').insert({
      id: data.id,
      animal_id: data.animal_id,
      adopter_id: data.adopter_id,
      ong_id: data.ong_id,
      status: 'pending',
      created_at: now,
      updated_at: now,
    });

    return {
      id: data.id,
      animal_id: data.animal_id,
      status: 'pending',
      created_at: now,
    };
  }

  async findAnimalForAdoption(animalId: string): Promise<{ id: string; ong_id: string; status: string; name: string } | null> {
    const row = await db('animals')
      .where({ id: animalId })
      .select('id', 'ong_id', 'status', 'name')
      .first();
    return row || null;
  }

  async hasActiveRequest(animalId: string, adopterId: string): Promise<boolean> {
    const result = await db('adoption_requests')
      .where({ animal_id: animalId, adopter_id: adopterId })
      .whereIn('status', ['pending', 'in_review'])
      .select(db.raw('1'))
      .first();
    return !!result;
  }

  async findByIdForVolunteer(id: string, ongId: string): Promise<AdoptionRequestDetail | null> {
    const row = await db('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .where('adoption_requests.id', id)
      .where('adoption_requests.ong_id', ongId)
      .select(
        'adoption_requests.id',
        'adoption_requests.animal_id',
        'animals.name as animal_name',
        'animals.species as animal_species',
        'animals.breed as animal_breed',
        'adoption_requests.adopter_id',
        'users.name as adopter_name',
        'users.email as adopter_email',
        'adoption_requests.ong_id',
        'adoption_requests.status',
        'adoption_requests.rejection_reason',
        'adoption_requests.cancelled_by',
        'adoption_requests.cancellation_reason',
        'adoption_requests.created_at',
        'adoption_requests.updated_at',
      )
      .first();

    if (!row) return null;

    return {
      id: row.id,
      animal_id: row.animal_id,
      animal_name: row.animal_name,
      animal_species: row.animal_species,
      animal_breed: row.animal_breed,
      adopter_id: row.adopter_id,
      adopter_name: row.adopter_name,
      adopter_email: row.adopter_email,
      ong_id: row.ong_id,
      status: row.status,
      rejection_reason: row.rejection_reason || null,
      cancelled_by: row.cancelled_by || null,
      cancellation_reason: row.cancellation_reason || null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  async findByIdForAdopter(id: string, adopterId: string): Promise<AdoptionRequestDetail | null> {
    const row = await db('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .where('adoption_requests.id', id)
      .where('adoption_requests.adopter_id', adopterId)
      .select(
        'adoption_requests.id',
        'adoption_requests.animal_id',
        'animals.name as animal_name',
        'animals.species as animal_species',
        'animals.breed as animal_breed',
        'adoption_requests.adopter_id',
        'users.name as adopter_name',
        'users.email as adopter_email',
        'adoption_requests.ong_id',
        'adoption_requests.status',
        'adoption_requests.rejection_reason',
        'adoption_requests.cancelled_by',
        'adoption_requests.cancellation_reason',
        'adoption_requests.created_at',
        'adoption_requests.updated_at',
      )
      .first();

    if (!row) return null;

    return {
      id: row.id,
      animal_id: row.animal_id,
      animal_name: row.animal_name,
      animal_species: row.animal_species,
      animal_breed: row.animal_breed,
      adopter_id: row.adopter_id,
      adopter_name: row.adopter_name,
      adopter_email: row.adopter_email,
      ong_id: row.ong_id,
      status: row.status,
      rejection_reason: row.rejection_reason || null,
      cancelled_by: row.cancelled_by || null,
      cancellation_reason: row.cancellation_reason || null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  async list(
    ongId: string,
    filters: AdoptionRequestListFilters,
  ): Promise<{ items: AdoptionRequestListItem[]; total: number }> {
    const applyFilters = (qb: ReturnType<typeof db>) => {
      qb.where('adoption_requests.ong_id', ongId);
      if (filters.status && filters.status !== 'all') {
        qb.where('adoption_requests.status', filters.status);
      }
      if (filters.animal_id) {
        qb.where('adoption_requests.animal_id', filters.animal_id);
      }
    };

    const countResult = await db('adoption_requests')
      .modify(applyFilters)
      .count('* as total')
      .first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const rows = await db('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .modify(applyFilters)
      .select(
        'adoption_requests.id',
        'animals.name as animal_name',
        'animals.species as animal_species',
        'users.name as adopter_name',
        'adoption_requests.status',
        'adoption_requests.created_at',
      )
      .orderBy('adoption_requests.created_at', 'desc')
      .limit(filters.limit)
      .offset(offset);

    const items: AdoptionRequestListItem[] = rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      animal_name: r.animal_name as string,
      animal_species: r.animal_species as string,
      adopter_name: r.adopter_name as string,
      status: r.status as AdoptionRequestStatus,
      created_at: new Date(r.created_at as string).toISOString(),
    }));

    return { items, total };
  }

  async listByAdopter(
    adopterId: string,
    filters: AdopterRequestListFilters,
  ): Promise<{ items: AdopterRequestListItem[]; total: number }> {
    const applyFilters = (qb: ReturnType<typeof db>) => {
      qb.where('adoption_requests.adopter_id', adopterId);
      if (filters.status && filters.status !== 'all') {
        qb.where('adoption_requests.status', filters.status);
      }
    };

    const countResult = await db('adoption_requests')
      .modify(applyFilters)
      .count('* as total')
      .first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const rows = await db('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('ongs', 'adoption_requests.ong_id', 'ongs.id')
      .modify(applyFilters)
      .select(
        'adoption_requests.id',
        'animals.name as animal_name',
        'animals.species as animal_species',
        'ongs.name as ong_name',
        'adoption_requests.status',
        'adoption_requests.rejection_reason',
        'adoption_requests.created_at',
      )
      .orderBy('adoption_requests.created_at', 'desc')
      .limit(filters.limit)
      .offset(offset);

    const items: AdopterRequestListItem[] = rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      animal_name: r.animal_name as string,
      animal_species: r.animal_species as string,
      ong_name: r.ong_name as string,
      status: r.status as AdoptionRequestStatus,
      rejection_reason: (r.rejection_reason as string) || null,
      created_at: new Date(r.created_at as string).toISOString(),
    }));

    return { items, total };
  }

  async findByIdForOng(
    id: string,
    ongId: string,
  ): Promise<{ id: string; status: AdoptionRequestStatus; animal_id: string; adopter_id: string } | null> {
    const row = await db('adoption_requests')
      .where({ id, ong_id: ongId })
      .select('id', 'status', 'animal_id', 'adopter_id')
      .first();
    return row || null;
  }

  async updateStatus(
    id: string,
    status: AdoptionRequestStatus,
    extra?: { cancelled_by?: string; cancellation_reason?: string; rejection_reason?: string },
  ): Promise<void> {
    await db('adoption_requests')
      .where({ id })
      .update({
        status,
        updated_at: new Date(),
        ...(extra || {}),
      });
  }

  async cancelAllActiveByAnimalId(animalId: string, trx: Knex.Transaction): Promise<string[]> {
    const activeStatuses: AdoptionRequestStatus[] = ['pending', 'in_review'];

    const rows = await trx('adoption_requests')
      .where({ animal_id: animalId })
      .whereIn('status', activeStatuses)
      .select('id');

    const ids = rows.map((r: { id: string }) => r.id);

    if (ids.length === 0) return [];

    await trx('adoption_requests')
      .whereIn('id', ids)
      .update({
        status: 'cancelled',
        cancelled_by: 'system',
        cancellation_reason: 'Animal adotado por outro tutor.',
        updated_at: new Date(),
      });

    return ids;
  }
}

export const adoptionRequestsRepository = new AdoptionRequestsRepository();
