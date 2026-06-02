export interface CatalogFilters {
  search?: string;
  species?: 'dog' | 'cat';
  breed?: string;
  age?: number;
  size?: 'small' | 'medium' | 'large';
  sex?: 'male' | 'female';
  temperament?: string;
  special_needs?: boolean;
}

export interface CatalogQueryParams extends CatalogFilters {
  cursor?: string;
  limit?: number;
}

export interface CatalogAnimal {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  size: 'small' | 'medium' | 'large';
  estimated_age_months: number;
  temperament: string | null;
  special_needs: boolean;
  description: string | null;
  photo_url: string | null;
  status: 'available' | 'in_adoption_process';
  ong: {
    city: string | null;
    state: string | null;
  };
}

export interface CatalogPagination {
  next_cursor: string | null;
  has_more: boolean;
}

export interface CatalogResponse {
  data: CatalogAnimal[];
  pagination: CatalogPagination;
}
