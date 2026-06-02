import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { catalogController } from './catalog.controller';
import { catalogQuerySchema, catalogDetailParamsSchema } from './catalog.validator';

const router = Router();

router.get(
  '/',
  validate(catalogQuerySchema, 'query'),
  (req, res, next) => catalogController.list(req, res, next),
);

router.get(
  '/:id',
  validate(catalogDetailParamsSchema, 'params'),
  (req, res, next) => catalogController.detail(req, res, next),
);

export const catalogRoutes = router;
