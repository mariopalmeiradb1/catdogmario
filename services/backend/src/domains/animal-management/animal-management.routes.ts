import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { authenticate } from '~/shared/middlewares/authenticate.middleware';
import { authorize } from '~/shared/middlewares/authorize.middleware';
import { animalManagementController } from './animal-management.controller';
import { createAnimalSchema, updateAnimalSchema, listAnimalsQuerySchema, confirmAdoptionSchema } from './animal-management.validator';
import { uploadMiddleware } from '~/shared/middlewares/upload.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(createAnimalSchema),
  (req, res, next) => animalManagementController.create(req, res, next),
);

router.get(
  '/',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(listAnimalsQuerySchema, 'query'),
  (req, res, next) => animalManagementController.list(req, res, next),
);

router.get(
  '/:id',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  (req, res, next) => animalManagementController.findById(req, res, next),
);

router.put(
  '/:id',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(updateAnimalSchema),
  (req, res, next) => animalManagementController.update(req, res, next),
);

router.patch(
  '/:id/inactivate',
  authenticate,
  authorize(['ong_admin']),
  (req, res, next) => animalManagementController.inactivate(req, res, next),
);

router.patch(
  '/:id/start-adoption-process',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  (req, res, next) => animalManagementController.startAdoptionProcess(req, res, next),
);

router.patch(
  '/:id/revert-to-available',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  (req, res, next) => animalManagementController.revertToAvailable(req, res, next),
);

router.patch(
  '/:id/confirm-adoption',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  validate(confirmAdoptionSchema),
  (req, res, next) => animalManagementController.confirmAdoption(req, res, next),
);

router.post(
  '/:id/media',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  uploadMiddleware,
  (req, res, next) => animalManagementController.uploadMedia(req, res, next),
);

router.delete(
  '/:id/media/:mediaId',
  authenticate,
  authorize(['ong_admin', 'ong_volunteer']),
  (req, res, next) => animalManagementController.removeMedia(req, res, next),
);

export const animalManagementRoutes = router;
