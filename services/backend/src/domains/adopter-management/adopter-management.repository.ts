import { db } from '~/config/database';
import type { AdopterProfile, CreateAdopterProfileInput, UpdateAdopterProfileInput } from './adopter-management.types';

export class AdopterManagementRepository {
  async findByUserId(userId: string): Promise<AdopterProfile | null> {
    const row = await db('adopter_profiles')
      .where('user_id', userId)
      .first();

    if (!row) return null;
    return this.mapRow(row);
  }

  async findByCpf(cpf: string): Promise<AdopterProfile | null> {
    const row = await db('adopter_profiles')
      .where('cpf', cpf)
      .first();

    if (!row) return null;
    return this.mapRow(row);
  }

  async findById(id: string): Promise<AdopterProfile | null> {
    const row = await db('adopter_profiles')
      .where('id', id)
      .first();

    if (!row) return null;
    return this.mapRow(row);
  }

  async create(data: {
    id: string;
    user_id: string;
  } & CreateAdopterProfileInput): Promise<AdopterProfile> {
    const now = new Date();

    await db('adopter_profiles').insert({
      id: data.id,
      user_id: data.user_id,
      full_name: data.full_name,
      cpf: data.cpf,
      rg: data.rg,
      birth_date: data.birth_date,
      phone: data.phone,
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      has_current_animals: data.has_current_animals,
      current_animals_description: data.current_animals_description || null,
      had_animals_before: data.had_animals_before,
      previous_animals_description: data.previous_animals_description || null,
      status: 'active',
      created_at: now,
      updated_at: now,
    });

    return (await this.findById(data.id))!;
  }

  async update(userId: string, data: UpdateAdopterProfileInput): Promise<AdopterProfile> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    await db('adopter_profiles')
      .where('user_id', userId)
      .update(updateData);

    return (await this.findByUserId(userId))!;
  }

  async hasAdoptionRequestInOng(adopterId: string, ongId: string): Promise<boolean> {
    const result = await db('adoption_requests')
      .where('adopter_id', adopterId)
      .where('ong_id', ongId)
      .select(db.raw('1'))
      .first();

    return !!result;
  }

  private mapRow(row: Record<string, unknown>): AdopterProfile {
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      full_name: row.full_name as string,
      cpf: row.cpf as string,
      rg: row.rg as string,
      birth_date: row.birth_date instanceof Date
        ? row.birth_date.toISOString().split('T')[0]
        : String(row.birth_date),
      phone: row.phone as string,
      cep: row.cep as string,
      street: row.street as string,
      number: row.number as string,
      complement: (row.complement as string) || null,
      neighborhood: row.neighborhood as string,
      city: row.city as string,
      state: row.state as string,
      has_current_animals: Boolean(row.has_current_animals),
      current_animals_description: (row.current_animals_description as string) || null,
      had_animals_before: Boolean(row.had_animals_before),
      previous_animals_description: (row.previous_animals_description as string) || null,
      status: row.status as 'active' | 'inactive',
      created_at: new Date(row.created_at as string).toISOString(),
      updated_at: new Date(row.updated_at as string).toISOString(),
    };
  }
}

export const adopterManagementRepository = new AdopterManagementRepository();
