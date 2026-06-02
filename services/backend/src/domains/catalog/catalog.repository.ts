import { db } from '~/config/database';
import { CatalogAnimal, CatalogAnimalDetail, CatalogAnimalMedia, CatalogFilters } from './catalog.types';

interface RepositoryResult {
  items: CatalogAnimal[];
  hasMore: boolean;
}

export class CatalogRepository {
  async findAvailable(filters: CatalogFilters): Promise<RepositoryResult> {
    const limit = filters.limit || 8;

    let query = db('animals as a')
      .join('ongs as o', 'a.ong_id', 'o.id')
      .whereIn('a.status', ['available', 'in_adoption_process'])
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
        'a.status',
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
      query = query.whereRaw('JSON_CONTAINS(a.temperament, ?)', [JSON.stringify(filters.temperament)]);
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

  async findByIdPublic(id: string): Promise<CatalogAnimalDetail | null> {
    const row = await db('animals as a')
      .join('ongs as o', 'a.ong_id', 'o.id')
      .whereIn('a.status', ['available', 'in_adoption_process'])
      .where('o.status', 'approved')
      .where('a.id', id)
      .select(
        'a.id',
        'a.name',
        'a.species',
        'a.breed',
        'a.sex',
        'a.castration',
        'a.temperament',
        'a.estimated_age_months',
        'a.estimated_age_category',
        'a.size',
        'a.weight_kg',
        'a.height_cm',
        'a.length_cm',
        'a.special_needs',
        'a.special_needs_description',
        'a.rescue_observations',
        'a.general_observations',
        'a.status',
        'o.name as ong_name',
        'o.city as ong_city',
        'o.state as ong_state',
        'o.phone as ong_phone',
      )
      .first();

    if (!row) return null;

    const mediaRows = await db('animal_media')
      .where({ animal_id: id })
      .select('id', 'type', 'url', 'mime_type', 'sort_order')
      .orderBy('sort_order', 'asc');

    const temperament = this.parseTemperament(row.temperament);

    const media: CatalogAnimalMedia[] = mediaRows.map((m: Record<string, unknown>) => ({
      id: m.id as string,
      type: m.type as 'photo' | 'video',
      url: m.url as string,
      mime_type: m.mime_type as string,
      sort_order: Number(m.sort_order),
    }));

    return {
      id: row.id as string,
      name: row.name as string,
      species: row.species as 'dog' | 'cat',
      breed: row.breed as string,
      sex: row.sex as 'male' | 'female',
      castration: row.castration as 'yes' | 'no' | 'unknown',
      temperament,
      estimated_age_months: Number(row.estimated_age_months),
      estimated_age_category: (row.estimated_age_category as 'puppy' | 'young' | 'adult' | 'senior') || null,
      size: (row.size as 'small' | 'medium' | 'large') || null,
      weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
      height_cm: row.height_cm != null ? Number(row.height_cm) : null,
      length_cm: row.length_cm != null ? Number(row.length_cm) : null,
      special_needs: Boolean(row.special_needs),
      special_needs_description: (row.special_needs_description as string) || null,
      rescue_observations: (row.rescue_observations as string) || null,
      general_observations: (row.general_observations as string) || null,
      status: row.status as 'available' | 'in_adoption_process',
      media,
      ong: {
        name: row.ong_name as string,
        city: (row.ong_city as string) || null,
        state: (row.ong_state as string) || null,
        phone: (row.ong_phone as string) || null,
      },
    };
  }

  private parseTemperament(raw: unknown): string[] {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private mapToAnimal(row: Record<string, unknown>): CatalogAnimal {
    let temperament: string[] | string | null = null;
    if (row.temperament) {
      try {
        const parsed = typeof row.temperament === 'string'
          ? JSON.parse(row.temperament)
          : row.temperament;
        temperament = Array.isArray(parsed) ? parsed : null;
      } catch {
        temperament = row.temperament as string;
      }
    }

    return {
      id: row.id as string,
      name: row.name as string,
      species: row.species as 'dog' | 'cat',
      breed: row.breed as string,
      sex: row.sex as 'male' | 'female',
      size: row.size as 'small' | 'medium' | 'large',
      estimated_age_months: row.estimated_age_months as number,
      temperament,
      special_needs: Boolean(row.special_needs),
      description: (row.description as string) || null,
      photo_url: (row.photo_url as string) || null,
      status: row.status as 'available' | 'in_adoption_process',
      ong: {
        city: (row.ong_city as string) || null,
        state: (row.ong_state as string) || null,
      },
    };
  }
}

export const catalogRepository = new CatalogRepository();
