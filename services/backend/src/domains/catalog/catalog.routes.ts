import { Router } from 'express';
import { validate } from '~/shared/middlewares/validate.middleware';
import { catalogController } from './catalog.controller';
import { catalogQuerySchema } from './catalog.validator';

const router = Router();

router.get(
  '/',
  validate(catalogQuerySchema, 'query'),
  (req, res, next) => catalogController.list(req, res, next),
);

export const catalogRoutes = router;
