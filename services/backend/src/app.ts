import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsConfig } from './config/cors';
import { authRoutes } from './domains/auth/auth.routes';
import { catalogRoutes } from './domains/catalog/catalog.routes';
import { ongManagementRoutes } from './domains/ong-management/ong-management.routes';
import { errorHandler } from './shared/middlewares/error-handler.middleware';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsConfig));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/catalog', catalogRoutes);
  app.use('/api/v1/ong-management', ongManagementRoutes);

  app.use(errorHandler);

  return app;
}
