import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { volunteerManagementController } from './volunteer-management.controller';
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  volunteerIdParamSchema,
  volunteerListQuerySchema,
} from './volunteer-management.validator';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(['ong_admin']),
  validate(volunteerListQuerySchema, 'query'),
  (req, res, next) => volunteerManagementController.list(req, res, next),
);

router.post(
  '/',
  authenticate,
  authorize(['ong_admin']),
  validate(createVolunteerSchema),
  (req, res, next) => volunteerManagementController.create(req, res, next),
);

router.get(
  '/:id',
  authenticate,
  authorize(['ong_admin']),
  validate(volunteerIdParamSchema, 'params'),
  (req, res, next) => volunteerManagementController.getDetail(req, res, next),
);

router.put(
  '/:id',
  authenticate,
  authorize(['ong_admin']),
  validate(volunteerIdParamSchema, 'params'),
  validate(updateVolunteerSchema),
  (req, res, next) => volunteerManagementController.update(req, res, next),
);

router.patch(
  '/:id/deactivate',
  authenticate,
  authorize(['ong_admin']),
  validate(volunteerIdParamSchema, 'params'),
  (req, res, next) => volunteerManagementController.deactivate(req, res, next),
);

router.patch(
  '/:id/reactivate',
  authenticate,
  authorize(['ong_admin']),
  validate(volunteerIdParamSchema, 'params'),
  (req, res, next) => volunteerManagementController.reactivate(req, res, next),
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ong_admin']),
  validate(volunteerIdParamSchema, 'params'),
  (req, res, next) => volunteerManagementController.remove(req, res, next),
);

export const volunteerManagementRoutes = router;
