import { catalogRepository } from './catalog.repository';
import { CatalogFilters, CatalogResponse } from './catalog.types';

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
}

export const catalogService = new CatalogService();
