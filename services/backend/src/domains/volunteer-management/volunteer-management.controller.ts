import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { volunteerManagementService } from './volunteer-management.service';

export class VolunteerManagementController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const adminUserId = req.user!.userId;
      const result = await volunteerManagementService.create(req.body, ongId, adminUserId);
      res.status(HttpStatus.CREATED).json({ message: 'Voluntário cadastrado com sucesso.', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const { id } = req.params;
      const result = await volunteerManagementService.getDetail(id, ongId);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const adminUserId = req.user!.userId;
      const { id } = req.params;
      const result = await volunteerManagementService.update(id, req.body, ongId, adminUserId);
      res.status(HttpStatus.OK).json({ message: 'Voluntário atualizado com sucesso.', data: result });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const adminUserId = req.user!.userId;
      const { id } = req.params;
      await volunteerManagementService.deactivate(id, ongId, adminUserId);
      res.status(HttpStatus.OK).json({ message: 'Voluntário desativado com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const adminUserId = req.user!.userId;
      const { id } = req.params;
      await volunteerManagementService.reactivate(id, ongId, adminUserId);
      res.status(HttpStatus.OK).json({ message: 'Voluntário reativado com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const adminUserId = req.user!.userId;
      const { id } = req.params;
      await volunteerManagementService.remove(id, ongId, adminUserId);
      res.status(HttpStatus.OK).json({ message: 'Voluntário removido com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ongId = req.user!.ongId!;
      const result = await volunteerManagementService.list(ongId, req.query as never);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const volunteerManagementController = new VolunteerManagementController();
