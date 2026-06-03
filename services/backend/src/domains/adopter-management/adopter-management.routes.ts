import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { adopterManagementController } from './adopter-management.controller';
import {
  createAdopterProfileSchema,
  updateAdopterProfileSchema,
  adopterIdParamSchema,
} from './adopter-management.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['adopter']),
  validate(createAdopterProfileSchema),
  (req, res, next) => adopterManagementController.create(req, res, next),
);

router.get(
  '/me',
  authenticate,
  authorize(['adopter']),
  (req, res, next) => adopterManagementController.getMe(req, res, next),
);

router.put(
  '/me',
  authenticate,
  authorize(['adopter']),
  validate(updateAdopterProfileSchema),
  (req, res, next) => adopterManagementController.updateMe(req, res, next),
);

router.get(
  '/:id',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(adopterIdParamSchema, 'params'),
  (req, res, next) => adopterManagementController.getForVolunteer(req, res, next),
);

export const adopterManagementRoutes = router;
