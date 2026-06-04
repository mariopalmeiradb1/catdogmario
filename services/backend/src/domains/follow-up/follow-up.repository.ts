import { db } from '~/config/database';
import type { Knex } from 'knex';
import type {
  ReminderStatus,
  ReminderForContact,
  FollowUpContactDetail,
  FollowUpListFilters,
  FollowUpListItem,
} from './follow-up.types';

export class FollowUpRepository {
  async findReminderForContact(reminderId: string, ongId: string): Promise<ReminderForContact | null> {
    const row = await db('follow_up_reminders')
      .join('adoption_requests', 'follow_up_reminders.adoption_request_id', 'adoption_requests.id')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .where('follow_up_reminders.id', reminderId)
      .where('follow_up_reminders.ong_id', ongId)
      .select(
        'follow_up_reminders.id',
        'follow_up_reminders.status',
        'follow_up_reminders.ong_id',
        'adoption_requests.completed_at as adoption_date',
        'animals.name as animal_name',
        'users.name as adopter_name',
      )
      .first();

    if (!row) return null;

    return {
      id: row.id,
      status: row.status as ReminderStatus,
      ong_id: row.ong_id,
      adoption_date: row.adoption_date ? new Date(row.adoption_date).toISOString().split('T')[0] : '',
      animal_name: row.animal_name,
      adopter_name: row.adopter_name,
    };
  }

  async hasContactForReminder(reminderId: string): Promise<boolean> {
    const result = await db('follow_up_contacts')
      .where({ reminder_id: reminderId })
      .select(db.raw('1'))
      .first();
    return !!result;
  }

  async createContact(
    input: {
      id: string;
      reminder_id: string;
      registered_by: string;
      ong_id: string;
      contact_date: string;
      status: string;
      observation: string;
    },
    trx: Knex.Transaction,
  ): Promise<void> {
    const now = new Date();
    await trx('follow_up_contacts').insert({
      id: input.id,
      reminder_id: input.reminder_id,
      registered_by: input.registered_by,
      ong_id: input.ong_id,
      contact_date: input.contact_date,
      status: input.status,
      observation: input.observation,
      created_at: now,
      updated_at: now,
    });
  }

  async updateReminderStatus(reminderId: string, status: ReminderStatus, trx: Knex.Transaction): Promise<void> {
    await trx('follow_up_reminders')
      .where({ id: reminderId })
      .update({ status, updated_at: new Date() });
  }

  async findContactById(contactId: string, ongId: string): Promise<FollowUpContactDetail | null> {
    const row = await db('follow_up_contacts')
      .join('users', 'follow_up_contacts.registered_by', 'users.id')
      .where('follow_up_contacts.id', contactId)
      .where('follow_up_contacts.ong_id', ongId)
      .select(
        'follow_up_contacts.id',
        'follow_up_contacts.reminder_id',
        'follow_up_contacts.registered_by',
        'users.name as registered_by_name',
        'follow_up_contacts.ong_id',
        'follow_up_contacts.contact_date',
        'follow_up_contacts.status',
        'follow_up_contacts.observation',
        'follow_up_contacts.created_at',
        'follow_up_contacts.updated_at',
      )
      .first();

    if (!row) return null;

    return {
      id: row.id,
      reminder_id: row.reminder_id,
      registered_by: row.registered_by,
      registered_by_name: row.registered_by_name,
      ong_id: row.ong_id,
      contact_date: new Date(row.contact_date).toISOString().split('T')[0],
      status: row.status,
      observation: row.observation,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  async updateContactObservation(contactId: string, observation: string, updatedAt: Date): Promise<void> {
    await db('follow_up_contacts')
      .where({ id: contactId })
      .update({ observation, updated_at: updatedAt });
  }

  async getTimelineByAdoption(adoptionRequestId: string, ongId: string): Promise<{
    adoptionInfo: {
      adoption_request_id: string;
      animal_name: string;
      adopter_name: string;
      adopter_phone: string | null;
      adopter_email: string;
      adoption_date: string;
    } | null;
    entries: Array<{
      reminder_id: string;
      reminder_number: number;
      due_date: string;
      reminder_status: ReminderStatus;
      contact_id: string | null;
      contact_date: string | null;
      contact_status: string | null;
      contact_observation: string | null;
      registered_by_name: string | null;
      contact_created_at: string | null;
    }>;
  }> {
    const adoptionInfo = await db('adoption_requests')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .leftJoin('adopter_profiles', 'users.id', 'adopter_profiles.user_id')
      .where('adoption_requests.id', adoptionRequestId)
      .where('adoption_requests.ong_id', ongId)
      .select(
        'adoption_requests.id as adoption_request_id',
        'animals.name as animal_name',
        'users.name as adopter_name',
        'adopter_profiles.phone as adopter_phone',
        'users.email as adopter_email',
        'adoption_requests.completed_at as adoption_date',
      )
      .first();

    if (!adoptionInfo) {
      return { adoptionInfo: null, entries: [] };
    }

    const rows = await db('follow_up_reminders')
      .leftJoin('follow_up_contacts', 'follow_up_contacts.reminder_id', 'follow_up_reminders.id')
      .leftJoin('users as contact_user', 'follow_up_contacts.registered_by', 'contact_user.id')
      .where('follow_up_reminders.adoption_request_id', adoptionRequestId)
      .where('follow_up_reminders.ong_id', ongId)
      .orderBy('follow_up_reminders.reminder_number', 'asc')
      .select(
        'follow_up_reminders.id as reminder_id',
        'follow_up_reminders.reminder_number',
        'follow_up_reminders.due_date',
        'follow_up_reminders.status as reminder_status',
        'follow_up_contacts.id as contact_id',
        'follow_up_contacts.contact_date',
        'follow_up_contacts.status as contact_status',
        'follow_up_contacts.observation as contact_observation',
        'contact_user.name as registered_by_name',
        'follow_up_contacts.created_at as contact_created_at',
      );

    return {
      adoptionInfo: {
        adoption_request_id: adoptionInfo.adoption_request_id,
        animal_name: adoptionInfo.animal_name,
        adopter_name: adoptionInfo.adopter_name,
        adopter_phone: adoptionInfo.adopter_phone || null,
        adopter_email: adoptionInfo.adopter_email,
        adoption_date: adoptionInfo.adoption_date
          ? new Date(adoptionInfo.adoption_date).toISOString().split('T')[0]
          : '',
      },
      entries: rows.map((row: Record<string, unknown>) => ({
        reminder_id: row.reminder_id as string,
        reminder_number: row.reminder_number as number,
        due_date: new Date(row.due_date as string).toISOString().split('T')[0],
        reminder_status: row.reminder_status as ReminderStatus,
        contact_id: (row.contact_id as string) || null,
        contact_date: row.contact_date
          ? new Date(row.contact_date as string).toISOString().split('T')[0]
          : null,
        contact_status: (row.contact_status as string) || null,
        contact_observation: (row.contact_observation as string) || null,
        registered_by_name: (row.registered_by_name as string) || null,
        contact_created_at: row.contact_created_at
          ? new Date(row.contact_created_at as string).toISOString()
          : null,
      })),
    };
  }

  async findAdminsByOngId(ongId: string): Promise<Array<{ id: string; name: string }>> {
    const rows = await db('users')
      .where({ ong_id: ongId, role: 'ong_admin' })
      .select('id', 'name');
    return rows;
  }

  async list(
    ongId: string,
    filters: FollowUpListFilters,
  ): Promise<{ items: FollowUpListItem[]; total: number }> {
    const applyFilters = (qb: ReturnType<typeof db>) => {
      qb.where('follow_up_reminders.ong_id', ongId);
      if (filters.status && filters.status !== 'all') {
        qb.where('follow_up_reminders.status', filters.status);
      }
    };

    const countResult = await db('follow_up_reminders')
      .modify(applyFilters)
      .count('* as total')
      .first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const rows = await db('follow_up_reminders')
      .join('adoption_requests', 'follow_up_reminders.adoption_request_id', 'adoption_requests.id')
      .join('animals', 'adoption_requests.animal_id', 'animals.id')
      .join('users', 'adoption_requests.adopter_id', 'users.id')
      .leftJoin('follow_up_contacts', 'follow_up_contacts.reminder_id', 'follow_up_reminders.id')
      .modify(applyFilters)
      .select(
        'follow_up_reminders.id',
        'follow_up_reminders.adoption_request_id',
        'animals.name as animal_name',
        'users.name as adopter_name',
        'follow_up_reminders.reminder_number',
        'follow_up_reminders.due_date',
        'follow_up_reminders.status',
        'follow_up_contacts.id as contact_id',
        'follow_up_contacts.observation as contact_observation',
      )
      .orderBy('follow_up_reminders.due_date', 'asc')
      .limit(filters.limit)
      .offset(offset);

    const items: FollowUpListItem[] = rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      adoption_request_id: r.adoption_request_id as string,
      animal_name: r.animal_name as string,
      adopter_name: r.adopter_name as string,
      reminder_number: r.reminder_number as number,
      due_date: new Date(r.due_date as string).toISOString().split('T')[0],
      status: r.status as ReminderStatus,
      has_contact: !!r.contact_id,
      contact_id: (r.contact_id as string) || null,
      contact_observation: (r.contact_observation as string) || null,
    }));

    return { items, total };
  }
}

export const followUpRepository = new FollowUpRepository();
