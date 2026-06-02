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

export interface CatalogAnimalMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  mime_type: string;
  sort_order: number;
}

export interface CatalogOngInfo {
  name: string;
  city: string | null;
  state: string | null;
  phone: string | null;
}

export interface CatalogAnimalDetail {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string[];
  estimated_age_months: number;
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior' | null;
  size: 'small' | 'medium' | 'large' | null;
  weight_kg: number | null;
  height_cm: number | null;
  length_cm: number | null;
  special_needs: boolean;
  special_needs_description: string | null;
  rescue_observations: string | null;
  general_observations: string | null;
  status: 'available' | 'in_adoption_process';
  media: CatalogAnimalMedia[];
  ong: CatalogOngInfo;
}
