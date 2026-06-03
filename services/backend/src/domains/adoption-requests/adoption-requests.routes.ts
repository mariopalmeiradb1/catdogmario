import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { adoptionRequestsController } from './adoption-requests.controller';
import {
  createAdoptionRequestSchema,
  listAdoptionRequestsQuerySchema,
  adoptionRequestIdParamSchema,
  rejectAdoptionRequestSchema,
} from './adoption-requests.validator';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['adopter']),
  validate(createAdoptionRequestSchema),
  (req, res, next) => adoptionRequestsController.create(req, res, next),
);

router.get(
  '/',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(listAdoptionRequestsQuerySchema, 'query'),
  (req, res, next) => adoptionRequestsController.list(req, res, next),
);

router.get(
  '/mine',
  authenticate,
  authorize(['adopter']),
  validate(listAdoptionRequestsQuerySchema, 'query'),
  (req, res, next) => adoptionRequestsController.listMine(req, res, next),
);

router.get(
  '/:id',
  authenticate,
  authorize(['adopter', 'ong_admin', 'ong_volunteer']),
  validate(adoptionRequestIdParamSchema, 'params'),
  (req, res, next) => adoptionRequestsController.findById(req, res, next),
);

router.patch(
  '/:id/cancel',
  authenticate,
  authorize(['adopter']),
  validate(adoptionRequestIdParamSchema, 'params'),
  (req, res, next) => adoptionRequestsController.cancel(req, res, next),
);

router.patch(
  '/:id/start-review',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(adoptionRequestIdParamSchema, 'params'),
  (req, res, next) => adoptionRequestsController.startReview(req, res, next),
);

router.patch(
  '/:id/approve',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(adoptionRequestIdParamSchema, 'params'),
  (req, res, next) => adoptionRequestsController.approve(req, res, next),
);

router.patch(
  '/:id/reject',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(adoptionRequestIdParamSchema, 'params'),
  validate(rejectAdoptionRequestSchema),
  (req, res, next) => adoptionRequestsController.reject(req, res, next),
);

export const adoptionRequestRoutes = router;
