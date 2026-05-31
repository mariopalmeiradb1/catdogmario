import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { ongManagementController } from './ong-management.controller';
import { updateOngSchema, updateOngAdminSchema } from './ong-management.validator';

const router = Router();

// ONG Admin routes
router.get(
  '/my-ong',
  authenticate,
  authorize(['ong_admin']),
  (req, res, next) => ongManagementController.getMyOng(req, res, next),
);

router.put(
  '/my-ong',
  authenticate,
  authorize(['ong_admin']),
  validate(updateOngSchema),
  (req, res, next) => ongManagementController.updateMyOng(req, res, next),
);

// System Admin routes
router.get(
  '/',
  authenticate,
  authorize(['system_admin']),
  (req, res, next) => ongManagementController.list(req, res, next),
);

router.get(
  '/:id',
  authenticate,
  authorize(['system_admin']),
  (req, res, next) => ongManagementController.getDetail(req, res, next),
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize(['system_admin']),
  (req, res, next) => ongManagementController.approve(req, res, next),
);

router.patch(
  '/:id/reject',
  authenticate,
  authorize(['system_admin']),
  (req, res, next) => ongManagementController.reject(req, res, next),
);

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize(['system_admin']),
  (req, res, next) => ongManagementController.deactivate(req, res, next),
);

router.patch(
  '/:id/reactivate',
  authenticate,
  authorize(['system_admin']),
  (req, res, next) => ongManagementController.reactivate(req, res, next),
);

router.put(
  '/:id',
  authenticate,
  authorize(['system_admin']),
  validate(updateOngAdminSchema),
  (req, res, next) => ongManagementController.updateByAdmin(req, res, next),
);

export const ongManagementRoutes = router;
