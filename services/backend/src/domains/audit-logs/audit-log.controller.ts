import { Request, Response, NextFunction } from 'express';
import { auditLogService } from './audit-log.service';
import { AuditLogListFilters } from './audit-log.types';
import { HttpStatus } from '~/shared/constants/http-status';

export class AuditLogController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: AuditLogListFilters = {
        user_id: req.query.user_id as string | undefined,
        action: req.query.action as string | undefined,
        entity: req.query.entity as string | undefined,
        date_from: req.query.date_from as string | undefined,
        date_to: req.query.date_to as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Math.min(Number(req.query.limit) || 20, 100),
      };

      if (req.user?.role === 'ong_admin') {
        filters.ong_id = req.user.ongId ?? undefined;
      } else if (req.query.ong_id) {
        filters.ong_id = req.query.ong_id as string;
      }

      const result = await auditLogService.list(filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogController = new AuditLogController();
