import { db } from '~/config/database';
import { OngDetail, OngListItem, OngListFilters, UpdateOngAdminInput } from './ong-management.types';

export class OngManagementRepository {
  async findAll(filters: OngListFilters): Promise<{ items: OngListItem[]; total: number }> {
    const applyFilters = (qb: ReturnType<typeof db>) => {
      if (filters.status) qb.where('status', filters.status);
      if (filters.state) qb.where('state', filters.state);
      if (filters.city) qb.where('city', 'like', `%${filters.city}%`);
      if (filters.dateFrom) qb.where('created_at', '>=', filters.dateFrom);
      if (filters.dateTo) qb.where('created_at', '<=', `${filters.dateTo} 23:59:59`);
    };

    const countResult = await db('ongs')
      .modify(applyFilters)
      .count('* as total')
      .first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const items = await db('ongs')
      .select('id', 'name', 'cnpj', 'city', 'state', 'status', 'created_at')
      .modify(applyFilters)
      .orderBy('created_at', 'desc')
      .limit(filters.limit)
      .offset(offset);

    return { items, total };
  }

  async findById(id: string): Promise<OngDetail | null> {
    const ong = await db('ongs').where({ id }).first();
    return ong || null;
  }

  async findOngByUserId(userId: string): Promise<OngDetail | null> {
    const ong = await db('ongs')
      .join('users', 'users.ong_id', 'ongs.id')
      .where('users.id', userId)
      .where('users.role', 'ong_admin')
      .select('ongs.*')
      .first();
    return ong || null;
  }

  async findOngByCnpjExcluding(cnpj: string, excludeId: string): Promise<{ id: string } | null> {
    const ong = await db('ongs')
      .where('cnpj', cnpj)
      .whereNot('id', excludeId)
      .select('id')
      .first();
    return ong || null;
  }

  async updateOngData(id: string, data: Partial<UpdateOngAdminInput>): Promise<void> {
    await db('ongs')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now(),
      });
  }

  async updateStatus(id: string, status: string, extras?: Record<string, unknown>): Promise<void> {
    await db('ongs')
      .where({ id })
      .update({
        status,
        ...extras,
        updated_at: db.fn.now(),
      });
  }
}

export const ongManagementRepository = new OngManagementRepository();
