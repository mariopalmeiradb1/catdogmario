export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  ong_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogListFilters {
  ong_id?: string;
  user_id?: string;
  action?: string;
  entity?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export interface CreateAuditLogInput {
  user_id: string;
  user_name: string;
  ong_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}
