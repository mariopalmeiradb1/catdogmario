export interface CreateAnimalInput {
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string[];
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior';
  size?: 'small' | 'medium' | 'large' | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  special_needs?: boolean;
  special_needs_description?: string | null;
  rescue_observations?: string | null;
  general_observations?: string | null;
}

export interface UpdateAnimalInput {
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string[];
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior';
  size?: 'small' | 'medium' | 'large' | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  length_cm?: number | null;
  special_needs?: boolean;
  special_needs_description?: string | null;
  rescue_observations?: string | null;
  general_observations?: string | null;
  updated_at: string;
}

export type AnimalStatus = 'available' | 'in_adoption_process' | 'adopted' | 'inactive';

export interface AnimalMedia {
  id: string;
  type: 'photo' | 'video';
  url: string;
  original_name: string;
  size_bytes: number;
  mime_type: string;
  sort_order: number;
}

export interface AnimalDetail {
  id: string;
  ong_id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  sex: 'male' | 'female';
  castration: 'yes' | 'no' | 'unknown';
  temperament: string[];
  estimated_age_category: 'puppy' | 'young' | 'adult' | 'senior';
  size: 'small' | 'medium' | 'large' | null;
  weight_kg: number | null;
  height_cm: number | null;
  length_cm: number | null;
  special_needs: boolean;
  special_needs_description: string | null;
  rescue_observations: string | null;
  general_observations: string | null;
  status: AnimalStatus;
  created_at: string;
  updated_at: string;
  inactivated_at: string | null;
  media: AnimalMedia[];
}

export interface AnimalListItem {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  status: AnimalStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalListFilters {
  status?: AnimalStatus | 'all';
  page: number;
  limit: number;
}

export interface AnimalCreatedResponse {
  id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  status: string;
  created_at: Date;
}

export const VALID_TRANSITIONS: Record<AnimalStatus, AnimalStatus[]> = {
  available: ['in_adoption_process', 'inactive'],
  in_adoption_process: ['available', 'adopted'],
  adopted: ['available', 'inactive'],
  inactive: [],
};

export interface StatusTransitionResult {
  id: string;
  status: AnimalStatus;
  updated_at: string;
}

export interface ConfirmAdoptionResult {
  id: string;
  status: 'adopted';
  adopted_at: string;
  responsibility_term_number: string;
}

export interface StatusHistoryEntry {
  id: string;
  animal_id: string;
  from_status: AnimalStatus;
  to_status: AnimalStatus;
  trigger_type: 'automatic' | 'manual';
  trigger_reason: string;
  triggered_by: string;
  metadata?: Record<string, unknown> | null;
}

export interface CreateAnimalResult {
  data: AnimalCreatedResponse;
  duplicateWarning: boolean;
}
