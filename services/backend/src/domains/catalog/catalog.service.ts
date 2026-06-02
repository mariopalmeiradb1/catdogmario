import { catalogRepository } from './catalog.repository';
import { AppError } from '~/domains/auth/auth.errors';
import { CatalogAnimalDetail, CatalogFilters, CatalogResponse } from './catalog.types';

export class CatalogService {
  async listAnimals(filters: CatalogFilters): Promise<CatalogResponse> {
    const sanitizedFilters: CatalogFilters = {
      ...filters,
      search: filters.search?.trim().slice(0, 100) || undefined,
    };

    const { items, hasMore } = await catalogRepository.findAvailable(sanitizedFilters);

    const nextCursor = items.length > 0 && hasMore ? items[items.length - 1].id : null;

    return {
      data: items,
      pagination: {
        next_cursor: nextCursor,
        has_more: hasMore,
      },
    };
  }

  async getAnimalDetail(id: string): Promise<CatalogAnimalDetail> {
    const detail = await catalogRepository.findByIdPublic(id);

    if (!detail) {
      throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Animal não encontrado no catálogo.');
    }

    return detail;
  }
}

export const catalogService = new CatalogService();
