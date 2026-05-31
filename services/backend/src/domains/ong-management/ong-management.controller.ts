import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { ongManagementService } from './ong-management.service';
import { OngListFilters } from './ong-management.types';

export class OngManagementController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: OngListFilters = {
        status: req.query.status as OngListFilters['status'],
        state: req.query.state as string | undefined,
        city: req.query.city as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
      };
      const result = await ongManagementService.list(filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ong = await ongManagementService.getDetail(req.params.id);
      res.status(HttpStatus.OK).json(ong);
    } catch (error) {
      next(error);
    }
  }

  async getMyOng(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ong = await ongManagementService.getMyOngDetail(req.user!.userId);
      res.status(HttpStatus.OK).json({ data: ong });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ongManagementService.approve(req.params.id);
      res.status(HttpStatus.OK).json({ message: 'ONG aprovada com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ongManagementService.reject(req.params.id);
      res.status(HttpStatus.OK).json({ message: 'ONG rejeitada.' });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ongManagementService.deactivate(req.params.id);
      res.status(HttpStatus.OK).json({ message: 'ONG desativada com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ongManagementService.reactivate(req.params.id);
      res.status(HttpStatus.OK).json({ message: 'ONG reativada com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async updateMyOng(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ong = await ongManagementService.updateByOngAdmin(req.user!.userId, req.body);
      res.status(HttpStatus.OK).json({ message: 'Dados atualizados com sucesso.', data: ong });
    } catch (error) {
      next(error);
    }
  }

  async updateByAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ong = await ongManagementService.updateBySystemAdmin(id, req.body);
      res.status(HttpStatus.OK).json({ message: 'Dados atualizados com sucesso.', data: ong });
    } catch (error) {
      next(error);
    }
  }
}

export const ongManagementController = new OngManagementController();
