import { db } from '~/config/database';
import { auditLogService } from '~/domains/audit-logs/audit-log.service';
import { CreateAuditLogInput } from '~/domains/audit-logs/audit-log.types';

export interface RecordAuditInput {
  user_id: string;
  user_name?: string;
  ong_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

async function resolveUserName(userId: string): Promise<string> {
  const user = await db('users').where({ id: userId }).select('name').first();
  return user?.name || 'Usuário desconhecido';
}

export async function recordAuditLog(input: RecordAuditInput): Promise<void> {
  try {
    const userName = input.user_name || await resolveUserName(input.user_id);
    const logInput: CreateAuditLogInput = {
      user_id: input.user_id,
      user_name: userName,
      ong_id: input.ong_id,
      action: input.action,
      entity: input.entity,
      entity_id: input.entity_id,
      metadata: input.metadata,
    };
    await auditLogService.record(logInput);
  } catch {
    // Audit log failures should not break the main flow
    console.error('[AuditLog] Failed to record audit entry:', input.action, input.entity);
  }
}
