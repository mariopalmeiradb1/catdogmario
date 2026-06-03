import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { adopterManagementService } from './adopter-management.service';

export class AdopterManagementController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await adopterManagementService.create(req.body, userId);
      res.status(HttpStatus.CREATED).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await adopterManagementService.getMyProfile(userId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await adopterManagementService.updateMyProfile(userId, req.body);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getForVolunteer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adopterId = req.params.id;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const result = await adopterManagementService.getProfileForVolunteer(adopterId, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const adopterManagementController = new AdopterManagementController();
