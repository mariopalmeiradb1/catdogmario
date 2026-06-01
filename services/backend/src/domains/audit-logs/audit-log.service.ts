import { auditLogRepository } from './audit-log.repository';
import { AuditLogEntry, AuditLogListFilters, CreateAuditLogInput } from './audit-log.types';

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export class AuditLogService {
  async list(filters: AuditLogListFilters): Promise<PaginatedAuditLogs> {
    const { items, total } = await auditLogRepository.findAll(filters);
    return { data: items, total, page: filters.page, limit: filters.limit };
  }

  async record(input: CreateAuditLogInput): Promise<void> {
    await auditLogRepository.create(input);
  }
}

export const auditLogService = new AuditLogService();
