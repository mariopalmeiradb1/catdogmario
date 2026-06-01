import { db } from '~/config/database';
import { AuditLogEntry, AuditLogListFilters, CreateAuditLogInput } from './audit-log.types';

export class AuditLogRepository {
  async findAll(filters: AuditLogListFilters): Promise<{ items: AuditLogEntry[]; total: number }> {
    const applyFilters = (qb: ReturnType<typeof db>) => {
      if (filters.ong_id) qb.where('audit_logs.ong_id', filters.ong_id);
      if (filters.user_id) qb.where('audit_logs.user_id', filters.user_id);
      if (filters.action) qb.where('audit_logs.action', filters.action);
      if (filters.entity) qb.where('audit_logs.entity', filters.entity);
      if (filters.date_from) qb.where('audit_logs.created_at', '>=', filters.date_from);
      if (filters.date_to) qb.where('audit_logs.created_at', '<=', `${filters.date_to} 23:59:59`);
    };

    const countResult = await db('audit_logs')
      .modify(applyFilters)
      .count('* as total')
      .first();
    const total = Number(countResult?.total || 0);

    const offset = (filters.page - 1) * filters.limit;
    const items = await db('audit_logs')
      .select(
        'audit_logs.id',
        'audit_logs.user_id',
        'audit_logs.user_name',
        'audit_logs.ong_id',
        'audit_logs.action',
        'audit_logs.entity',
        'audit_logs.entity_id',
        'audit_logs.metadata',
        'audit_logs.created_at',
      )
      .modify(applyFilters)
      .orderBy('audit_logs.created_at', 'desc')
      .limit(filters.limit)
      .offset(offset);

    return { items, total };
  }

  async create(input: CreateAuditLogInput): Promise<void> {
    await db('audit_logs').insert({
      user_id: input.user_id,
      user_name: input.user_name,
      ong_id: input.ong_id,
      action: input.action,
      entity: input.entity,
      entity_id: input.entity_id,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
