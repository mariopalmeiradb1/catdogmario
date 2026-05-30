import { db } from '~/config/database';
import { CatalogAnimal, CatalogFilters } from './catalog.types';

interface RepositoryResult {
  items: CatalogAnimal[];
  hasMore: boolean;
}

export class CatalogRepository {
  async findAvailable(filters: CatalogFilters): Promise<RepositoryResult> {
    const limit = filters.limit || 8;

    let query = db('animals as a')
      .join('ongs as o', 'a.ong_id', 'o.id')
      .where('a.status', 'available')
      .where('o.status', 'approved')
      .select(
        'a.id',
        'a.name',
        'a.species',
        'a.breed',
        'a.sex',
        'a.size',
        'a.estimated_age_months',
        'a.temperament',
        'a.special_needs',
        'a.description',
        'a.photo_url',
        'o.city as ong_city',
        'o.state as ong_state',
      );

    if (filters.species) {
      query = query.andWhere('a.species', filters.species);
    }

    if (filters.breed) {
      query = query.andWhere('a.breed', filters.breed);
    }

    if (filters.age) {
      const ageInMonths = filters.age * 12;
      query = query.andWhere('a.estimated_age_months', '<=', ageInMonths);
    }

    if (filters.size) {
      query = query.andWhere('a.size', filters.size);
    }

    if (filters.sex) {
      query = query.andWhere('a.sex', filters.sex);
    }

    if (filters.temperament) {
      query = query.andWhere('a.temperament', filters.temperament);
    }

    if (filters.special_needs) {
      query = query.andWhere('a.special_needs', true);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.andWhere(function () {
        this.where('a.name', 'like', searchTerm).orWhere('o.city', 'like', searchTerm);
      });
    }

    if (filters.cursor) {
      const cursorAnimal = await db('animals').where('id', filters.cursor).select('name', 'id').first();
      if (cursorAnimal) {
        query = query.andWhere(function () {
          this.where('a.name', '>', cursorAnimal.name).orWhere(function () {
            this.where('a.name', '=', cursorAnimal.name).andWhere('a.id', '>', filters.cursor!);
          });
        });
      }
    }

    query = query.orderBy('a.name', 'asc').orderBy('a.id', 'asc');
    query = query.limit(limit + 1);

    const rows = await query;

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map(this.mapToAnimal);

    return { items, hasMore };
  }

  private mapToAnimal(row: Record<string, unknown>): CatalogAnimal {
    return {
      id: row.id as string,
      name: row.name as string,
      species: row.species as 'dog' | 'cat',
      breed: row.breed as string,
      sex: row.sex as 'male' | 'female',
      size: row.size as 'small' | 'medium' | 'large',
      estimated_age_months: row.estimated_age_months as number,
      temperament: (row.temperament as string) || null,
      special_needs: Boolean(row.special_needs),
      description: (row.description as string) || null,
      photo_url: (row.photo_url as string) || null,
      ong: {
        city: (row.ong_city as string) || null,
        state: (row.ong_state as string) || null,
      },
    };
  }
}

export const catalogRepository = new CatalogRepository();
