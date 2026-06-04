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
  AdopterRequestDetail,
  VisitDetailVolunteer,
  VisitDetailAdopter,
  VisitStatus,
  VisitEvaluation,
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
      if (filters.date_from) {
        qb.where('adoption_requests.created_at', '>=', filters.date_from);
      }
      if (filters.date_to) {
        qb.where('adoption_requests.created_at', '<=', filters.date_to);
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
        'animals.breed as animal_breed',
        'animals.photo_url as animal_photo_url',
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
      animal_photo_url: (r.animal_photo_url as string) || null,
      animal_breed: (r.animal_breed as string) || null,
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

  async cancelAllActiveByAnimalId(animalId: string, trx: Knex.Transaction, excludeRequestId?: string): Promise<string[]> {
    const activeStatuses: AdoptionRequestStatus[] = ['pending', 'in_review'];

    let query = trx('adoption_requests')
      .where({ animal_id: animalId })
      .whereIn('status', activeStatuses);

    if (excludeRequestId) {
      query = query.where('id', '!=', excludeRequestId);
    }

    const rows = await query.select('id');

    const ids = rows.map((r: { id: string }) => r.id);

    if (ids.length === 0) return [];

    await trx('adoption_requests')
      .whereIn('id', ids)
      .update({
        status: 'cancelled',
        cancelled_by: 'system',
        cancellation_reason: excludeRequestId ? 'Visita agendada para outro adotante.' : 'Animal adotado por outro tutor.',
        updated_at: new Date(),
      });

    return ids;
  }

  async findDetailForAdopter(requestId: string, adopterId: string): Promise<AdopterRequestDetail | null> {
    const row = await db('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('ongs', 'adoption_requests.ong_id', 'ongs.id')
      .where('adoption_requests.id', requestId)
      .where('adoption_requests.adopter_id', adopterId)
      .select(
        'adoption_requests.id',
        'animals.name as animal_name',
        'animals.species as animal_species',
        'animals.breed as animal_breed',
        'animals.photo_url as animal_photo_url',
        'ongs.name as ong_name',
        'adoption_requests.status',
        'adoption_requests.rejection_reason',
        'adoption_requests.cancelled_by',
        'adoption_requests.cancellation_reason',
        'adoption_requests.created_at',
        'adoption_requests.updated_at',
        'adoption_requests.completed_at',
      )
      .first();

    if (!row) return null;

    return {
      id: row.id,
      animal_name: row.animal_name,
      animal_species: row.animal_species,
      animal_breed: row.animal_breed || null,
      animal_photo_url: row.animal_photo_url || null,
      ong_name: row.ong_name,
      status: row.status,
      rejection_reason: row.rejection_reason || null,
      cancelled_by: row.cancelled_by || null,
      cancellation_reason: row.cancellation_reason || null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
      completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    };
  }

  // Visit methods (TASK-BACKEND-009)

  async createVisit(
    data: { id: string; adoption_request_id: string; animal_id: string; ong_id: string; scheduled_by: string; visit_date: string; notes?: string; status: string },
    trx: Knex.Transaction,
  ): Promise<void> {
    const now = new Date();
    await trx('visits').insert({
      id: data.id,
      adoption_request_id: data.adoption_request_id,
      animal_id: data.animal_id,
      ong_id: data.ong_id,
      scheduled_by: data.scheduled_by,
      visit_date: new Date(data.visit_date),
      notes: data.notes || null,
      status: data.status,
      created_at: now,
      updated_at: now,
    });
  }

  async hasActiveVisitForAnimal(animalId: string, trx: Knex.Transaction): Promise<boolean> {
    const result = await trx('visits')
      .where({ animal_id: animalId, status: 'scheduled' })
      .select(trx.raw('1'))
      .first();
    return !!result;
  }

  async findRequestWithAnimalAndAdopter(
    requestId: string,
    ongId: string,
    trx: Knex.Transaction,
  ): Promise<{
    id: string;
    status: AdoptionRequestStatus;
    animal_id: string;
    adopter_id: string;
    animal_name: string;
    animal_status: string;
    adopter_name: string;
    adopter_email: string;
    ong_name: string;
    ong_address: string;
    ong_city: string;
    ong_state: string;
  } | null> {
    const row = await trx('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .join('ongs', 'adoption_requests.ong_id', 'ongs.id')
      .where('adoption_requests.id', requestId)
      .where('adoption_requests.ong_id', ongId)
      .select(
        'adoption_requests.id',
        'adoption_requests.status',
        'adoption_requests.animal_id',
        'adoption_requests.adopter_id',
        'animals.name as animal_name',
        'animals.status as animal_status',
        'users.name as adopter_name',
        'users.email as adopter_email',
        'ongs.name as ong_name',
        'ongs.address as ong_address',
        'ongs.city as ong_city',
        'ongs.state as ong_state',
      )
      .forUpdate()
      .first();

    return row || null;
  }

  async updateStatusWithTrx(
    id: string,
    status: AdoptionRequestStatus,
    trx: Knex.Transaction,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    await trx('adoption_requests')
      .where({ id })
      .update({
        status,
        updated_at: new Date(),
        ...(extra || {}),
      });
  }

  // Visit completion methods (TASK-BACKEND-010)

  async findVisitForCompletion(
    visitId: string,
    ongId: string,
    trx: Knex.Transaction,
  ): Promise<{ id: string; status: VisitStatus; visit_date: string; ong_id: string; adoption_request_id: string } | null> {
    const row = await trx('visits')
      .where({ id: visitId, ong_id: ongId })
      .select('id', 'status', 'visit_date', 'ong_id', 'adoption_request_id')
      .forUpdate()
      .first();
    return row || null;
  }

  async findVisitById(visitId: string): Promise<{ id: string; ong_id: string } | null> {
    const row = await db('visits')
      .where({ id: visitId })
      .select('id', 'ong_id')
      .first();
    return row || null;
  }

  async completeVisit(
    visitId: string,
    data: { completed_at: string; completed_by: string; evaluation: string; observations?: string },
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('visits')
      .where({ id: visitId })
      .update({
        status: 'completed',
        completed_at: new Date(data.completed_at),
        completed_by: data.completed_by,
        evaluation: data.evaluation,
        observations: data.observations || null,
        updated_at: new Date(),
      });
  }

  async findVisitDetailFull(visitId: string): Promise<VisitDetailVolunteer | null> {
    const row = await db('visits')
      .where({ id: visitId })
      .select('*')
      .first();

    if (!row) return null;

    return {
      id: row.id,
      adoption_request_id: row.adoption_request_id,
      animal_id: row.animal_id,
      ong_id: row.ong_id,
      scheduled_by: row.scheduled_by,
      visit_date: new Date(row.visit_date).toISOString(),
      notes: row.notes || null,
      status: row.status as VisitStatus,
      completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      completed_by: row.completed_by || null,
      evaluation: (row.evaluation as VisitEvaluation) || null,
      observations: row.observations || null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  async findVisitDetailForAdopter(visitId: string, adopterId: string): Promise<VisitDetailAdopter | null> {
    const row = await db('visits')
      .join('adoption_requests', 'visits.adoption_request_id', 'adoption_requests.id')
      .where('visits.id', visitId)
      .where('adoption_requests.adopter_id', adopterId)
      .select(
        'visits.id',
        'visits.adoption_request_id',
        'visits.animal_id',
        'visits.visit_date',
        'visits.status',
        'visits.completed_at',
        'visits.evaluation',
        'visits.created_at',
        'visits.updated_at',
      )
      .first();

    if (!row) return null;

    return {
      id: row.id,
      adoption_request_id: row.adoption_request_id,
      animal_id: row.animal_id,
      visit_date: new Date(row.visit_date).toISOString(),
      status: row.status as VisitStatus,
      completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
      evaluation: (row.evaluation as VisitEvaluation) || null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }
}

export const adoptionRequestsRepository = new AdoptionRequestsRepository();
