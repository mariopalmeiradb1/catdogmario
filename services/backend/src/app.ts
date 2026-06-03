import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsConfig } from './config/cors';
import { authRoutes } from './domains/auth/auth.routes';
import { catalogRoutes } from './domains/catalog/catalog.routes';
import { ongManagementRoutes } from './domains/ong-management/ong-management.routes';
import { animalManagementRoutes } from './domains/animal-management/animal-management.routes';
import { adoptionRequestRoutes } from './domains/adoption-requests/adoption-requests.routes';
import { auditLogRoutes } from './domains/audit-logs/audit-log.routes';
import { errorHandler } from './shared/middlewares/error-handler.middleware';
import { HttpStatus } from './shared/constants/http-status';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsConfig));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/catalog', catalogRoutes);
  app.use('/api/v1/ong-management', ongManagementRoutes);
  app.use('/api/v1/animal-management', animalManagementRoutes);
  app.use('/api/v1/adoption-requests', adoptionRequestRoutes);
  app.use('/api/v1/audit-logs', auditLogRoutes);

  app.use('/api', (_req: Request, res: Response) => {
    res.status(HttpStatus.NOT_FOUND).json({
      error: { code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada.' },
    });
  });

  app.use(errorHandler);

  return app;
}
