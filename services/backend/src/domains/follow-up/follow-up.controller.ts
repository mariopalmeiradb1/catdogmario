import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { followUpService } from './follow-up.service';
import type { FollowUpListFilters } from './follow-up.types';

export class FollowUpController {
  async registerContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reminderId = req.params.id;
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const contact = await followUpService.registerContact(reminderId, req.body, userId, ongId);
      res.status(HttpStatus.CREATED).json({ data: contact });
    } catch (error) {
      next(error);
    }
  }

  async editContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contactId = req.params.id;
      const userId = req.user!.userId;
      const ongId = req.user!.ongId;
      const role = req.user!.role;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const contact = await followUpService.editContact(contactId, req.body, userId, ongId, role);
      res.status(HttpStatus.OK).json({ data: contact });
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adoptionRequestId = req.params.adoptionRequestId;
      const ongId = req.user!.ongId;

      if (!ongId) {
        res.status(HttpStatus.FORBIDDEN).json({
          error: { code: 'FORBIDDEN', message: 'Você não está vinculado a nenhuma ONG.' },
        });
        return;
      }

      const timeline = await followUpService.getAdoptionTimeline(adoptionRequestId, ongId);
      res.status(HttpStatus.OK).json({ data: timeline });
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

      const filters: FollowUpListFilters = {
        status: req.query.status as FollowUpListFilters['status'],
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      };

      const result = await followUpService.list(ongId, filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const followUpController = new FollowUpController();
