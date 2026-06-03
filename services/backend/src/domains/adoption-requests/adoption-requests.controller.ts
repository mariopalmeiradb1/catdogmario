import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { adoptionRequestsService } from './adoption-requests.service';
import type { AdoptionRequestListFilters, AdopterRequestListFilters } from './adoption-requests.types';

export class AdoptionRequestsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await adoptionRequestsService.create(req.body, userId);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const filters: AdoptionRequestListFilters = {
        status: req.query.status as AdoptionRequestListFilters['status'],
        animal_id: req.query.animal_id as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      const result = await adoptionRequestsService.list(ongId, filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      const filters: AdopterRequestListFilters = {
        status: req.query.status as AdopterRequestListFilters['status'],
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      const result = await adoptionRequestsService.listMine(userId, filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const ongId = req.user!.ongId;

      const result = await adoptionRequestsService.findById(req.params.id, userId, role, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await adoptionRequestsService.cancel(req.params.id, userId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async startReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      await adoptionRequestsService.startReview(req.params.id, userId, ongId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      await adoptionRequestsService.approve(req.params.id, userId, ongId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      await adoptionRequestsService.reject(req.params.id, req.body, userId, ongId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}

export const adoptionRequestsController = new AdoptionRequestsController();
