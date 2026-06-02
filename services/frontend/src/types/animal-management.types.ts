export type Species = 'dog' | 'cat';
export type Castration = 'yes' | 'no' | 'unknown';
export type EstimatedAgeCategory = 'puppy' | 'young' | 'adult' | 'senior';
export type AnimalSize = 'small' | 'medium' | 'large';
export type AnimalSex = 'male' | 'female';
export type Temperament =
  | 'docile'
  | 'playful'
  | 'shy'
  | 'aggressive_with_animals'
  | 'independent'
  | 'needy'
  | 'other';

export interface CreateAnimalInput {
  name: string;
  species: Species;
  breed: string;
  sex: AnimalSex;
  castration: Castration;
  temperament: Temperament[];
  estimated_age_category: EstimatedAgeCategory;
  size?: AnimalSize | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  special_needs?: boolean;
  special_needs_description?: string | null;
  rescue_observations?: string | null;
  general_observations?: string | null;
}

export type AnimalStatus = 'available' | 'in_adoption_process' | 'adopted' | 'inactive';

export interface AnimalMedia {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  sort_order: number;
  created_at: string;
}

export interface AnimalCreatedResponse {
  id: string;
  name: string;
  species: Species;
  breed: string;
  status: string;
  created_at: string;
}

export interface CreateAnimalResult {
  data: AnimalCreatedResponse;
  duplicateWarning: boolean;
}

export interface UpdateAnimalInput extends CreateAnimalInput {
  updated_at: string;
}

export interface AnimalDetail {
  id: string;
  ong_id: string;
  name: string;
  species: Species;
  breed: string;
  sex: AnimalSex;
  castration: Castration;
  temperament: Temperament[];
  estimated_age_category: EstimatedAgeCategory;
  size: AnimalSize | null;
  weight_kg: number | null;
  height_cm: number | null;
  length_cm: number | null;
  special_needs: boolean;
  special_needs_description: string | null;
  rescue_observations: string | null;
  general_observations: string | null;
  status: AnimalStatus;
  media: AnimalMedia[];
  created_at: string;
  updated_at: string;
  inactivated_at: string | null;
}

export interface AnimalListItem {
  id: string;
  name: string;
  species: Species;
  breed: string;
  status: AnimalStatus;
  created_at: string;
}

export interface AnimalListFilters {
  page?: number;
  limit?: number;
  species?: Species;
  status?: AnimalStatus;
  search?: string;
}

export interface AnimalListResponse {
  data: AnimalListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
