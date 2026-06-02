import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '~/shared/constants/http-status';
import { catalogService } from './catalog.service';
import { CatalogFilters } from './catalog.types';

export class CatalogController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as unknown as CatalogFilters;
      const result = await catalogService.listAnimals(filters);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await catalogService.getAnimalDetail(id);
      res.status(HttpStatus.OK).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
