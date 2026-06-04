import { db } from '~/config/database';
import type {
  VolunteerProfile,
  VolunteerListItem,
  VolunteerListFilters,
  UpdateVolunteerInput,
} from './volunteer-management.types';

export class VolunteerManagementRepository {
  async findById(userId: string, ongId: string): Promise<VolunteerProfile | null> {
    const row = await db('users')
      .join('volunteer_profiles', 'users.id', 'volunteer_profiles.user_id')
      .where('users.id', userId)
      .where('users.ong_id', ongId)
      .where('users.role', 'ong_volunteer')
      .select(
        'users.id as user_id',
        'volunteer_profiles.id as profile_id',
        'users.name',
        'users.email',
        'users.is_active',
        'volunteer_profiles.cpf',
        'volunteer_profiles.rg',
        'volunteer_profiles.birth_date',
        'volunteer_profiles.phone',
        'volunteer_profiles.zip_code',
        'volunteer_profiles.street',
        'volunteer_profiles.number',
        'volunteer_profiles.complement',
        'volunteer_profiles.neighborhood',
        'volunteer_profiles.city',
        'volunteer_profiles.state',
        'volunteer_profiles.deleted_at',
        'volunteer_profiles.created_at',
        'volunteer_profiles.updated_at',
      )
      .first();

    if (!row) return null;
    return this.mapRow(row);
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    return db('users').where('email', email).select('id').first() || null;
  }

  async findByCpf(cpf: string, ongId: string): Promise<{ id: string } | null> {
    return db('volunteer_profiles')
      .join('users', 'users.id', 'volunteer_profiles.user_id')
      .where('volunteer_profiles.cpf', cpf)
      .where('users.ong_id', ongId)
      .select('volunteer_profiles.id')
      .first() || null;
  }

  async createUser(data: {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    ong_id: string;
  }): Promise<void> {
    await db('users').insert({
      id: data.id,
      name: data.name,
      email: data.email,
      password_hash: data.password_hash,
      role: 'ong_volunteer',
      ong_id: data.ong_id,
      email_confirmed_at: new Date(),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async createProfile(data: {
    id: string;
    user_id: string;
    cpf: string;
    rg: string;
    birth_date: string;
    phone: string;
    zip_code: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  }): Promise<void> {
    await db('volunteer_profiles').insert({
      id: data.id,
      user_id: data.user_id,
      cpf: data.cpf,
      rg: data.rg,
      birth_date: data.birth_date,
      phone: data.phone,
      zip_code: data.zip_code,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  async update(userId: string, data: UpdateVolunteerInput): Promise<void> {
    const profileFields: Record<string, unknown> = { updated_at: new Date() };
    const userFields: Record<string, unknown> = { updated_at: new Date() };

    const profileKeys = ['rg', 'birth_date', 'phone', 'zip_code', 'street', 'number', 'complement', 'neighborhood', 'city', 'state'];

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === 'name') {
        userFields[key] = value;
      } else if (profileKeys.includes(key)) {
        profileFields[key] = value;
      }
    }

    if (Object.keys(userFields).length > 1) {
      await db('users').where('id', userId).update(userFields);
    }
    if (Object.keys(profileFields).length > 1) {
      await db('volunteer_profiles').where('user_id', userId).update(profileFields);
    }
  }

  async deactivate(userId: string): Promise<void> {
    await db('users').where('id', userId).update({ is_active: false, updated_at: new Date() });
  }

  async reactivate(userId: string): Promise<void> {
    await db('users').where('id', userId).update({ is_active: true, updated_at: new Date() });
  }

  async softDelete(userId: string): Promise<void> {
    const now = new Date();
    await db('users').where('id', userId).update({ is_active: false, updated_at: now });
    await db('volunteer_profiles').where('user_id', userId).update({ deleted_at: now, updated_at: now });
  }

  async list(ongId: string, filters: VolunteerListFilters): Promise<{ data: VolunteerListItem[]; total: number }> {
    const query = db('users')
      .join('volunteer_profiles', 'users.id', 'volunteer_profiles.user_id')
      .where('users.ong_id', ongId)
      .where('users.role', 'ong_volunteer')
      .whereNull('volunteer_profiles.deleted_at');

    if (filters.status === 'active') {
      query.where('users.is_active', true);
    } else if (filters.status === 'inactive') {
      query.where('users.is_active', false);
    }

    if (filters.search) {
      const search = `%${filters.search}%`;
      query.where(function () {
        this.where('users.name', 'like', search)
          .orWhere('users.email', 'like', search);
      });
    }

    const countResult = await query.clone().count('* as total').first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const rows = await query
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.is_active',
        'volunteer_profiles.phone',
        'volunteer_profiles.cpf',
        'volunteer_profiles.created_at',
      )
      .orderBy('volunteer_profiles.created_at', 'desc')
      .limit(filters.limit)
      .offset(offset);

    const data: VolunteerListItem[] = rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      phone: row.phone as string,
      cpf_last4: (row.cpf as string).slice(-4),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
    }));

    return { data, total };
  }

  private mapRow(row: Record<string, unknown>): VolunteerProfile {
    return {
      id: row.user_id as string,
      user_id: row.user_id as string,
      name: row.name as string,
      email: row.email as string,
      cpf: row.cpf as string,
      rg: row.rg as string,
      birth_date: String(row.birth_date),
      phone: row.phone as string,
      zip_code: row.zip_code as string,
      street: row.street as string,
      number: row.number as string,
      complement: (row.complement as string) || null,
      neighborhood: row.neighborhood as string,
      city: row.city as string,
      state: row.state as string,
      is_active: Boolean(row.is_active),
      must_change_password: false,
      deleted_at: row.deleted_at ? String(row.deleted_at) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}

export const volunteerManagementRepository = new VolunteerManagementRepository();
