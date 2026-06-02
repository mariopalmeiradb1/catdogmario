import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { animalManagementService } from './animal-management.service';
import type { AnimalListFilters } from './animal-management.types';

export class AnimalManagementController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.create(req.body, userId, ongId);
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

      const filters = {
        status: req.query.status as AnimalListFilters['status'],
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      const result = await animalManagementService.list(ongId, filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.findById(req.params.id, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.update(req.params.id, req.body, userId, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async inactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.inactivate(req.params.id, userId, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      if (!req.file) {
        res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          error: { code: 'VALIDATION_ERROR', message: 'Arquivo é obrigatório.' },
        });
        return;
      }

      const type = req.body.type as 'photo' | 'video';
      if (!type || !['photo', 'video'].includes(type)) {
        res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
          error: { code: 'VALIDATION_ERROR', message: 'Tipo deve ser "photo" ou "video".' },
        });
        return;
      }

      const result = await animalManagementService.uploadMedia(req.params.id, req.file, type, userId, ongId);
      res.status(HttpStatus.CREATED).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async removeMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      await animalManagementService.removeMedia(req.params.id, req.params.mediaId, userId, ongId);
      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }

  async startAdoptionProcess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.startAdoptionProcess(req.params.id, userId, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async revertToAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.revertToAvailable(req.params.id, userId, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async confirmAdoption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await animalManagementService.confirmAdoption(
        req.params.id,
        userId,
        ongId,
        req.body.responsibility_term_number,
      );
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const animalManagementController = new AnimalManagementController();
