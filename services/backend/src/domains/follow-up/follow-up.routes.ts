import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { followUpController } from './follow-up.controller';
import {
  registerContactSchema,
  editContactSchema,
  reminderIdParamSchema,
  contactIdParamSchema,
  adoptionRequestIdParamSchema,
  followUpListQuerySchema,
} from './follow-up.validator';

const router = Router();

router.get(
  '/reminders',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(followUpListQuerySchema, 'query'),
  (req, res, next) => followUpController.list(req, res, next),
);

router.post(
  '/reminders/:id/contact',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(reminderIdParamSchema, 'params'),
  validate(registerContactSchema),
  (req, res, next) => followUpController.registerContact(req, res, next),
);

router.put(
  '/contacts/:id',
  authenticate,
  authorize(['ong_admin']),
  validate(contactIdParamSchema, 'params'),
  validate(editContactSchema),
  (req, res, next) => followUpController.editContact(req, res, next),
);

router.get(
  '/adoptions/:adoptionRequestId/timeline',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(adoptionRequestIdParamSchema, 'params'),
  (req, res, next) => followUpController.getTimeline(req, res, next),
);

export const followUpRoutes = router;
