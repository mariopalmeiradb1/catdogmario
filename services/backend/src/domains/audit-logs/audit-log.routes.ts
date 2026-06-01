import { Router } from 'express';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { auditLogController } from './audit-log.controller';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(['system_admin', 'ong_admin']),
  (req, res, next) => auditLogController.list(req, res, next),
);

export const auditLogRoutes = router;
