export type AdoptionRequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export const CANCELLABLE_STATUSES: AdoptionRequestStatus[] = ['pending', 'in_review'];

export const APPROVABLE_STATUSES: AdoptionRequestStatus[] = ['pending', 'in_review'];

export const REVIEWABLE_STATUSES: AdoptionRequestStatus[] = ['pending'];

export interface RejectAdoptionRequestInput {
  rejection_reason: string;
}

export interface CreateAdoptionRequestInput {
  animal_id: string;
}

export interface AdoptionRequestListFilters {
  status?: AdoptionRequestStatus | 'all';
  animal_id?: string;
  page: number;
  limit: number;
}

export interface AdopterRequestListFilters {
  status?: AdoptionRequestStatus | 'all';
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export interface AdoptionRequestDetail {
  id: string;
  animal_id: string;
  animal_name: string;
  animal_species: string;
  animal_breed: string;
  adopter_id: string;
  adopter_name: string;
  adopter_email: string;
  ong_id: string;
  status: AdoptionRequestStatus;
  rejection_reason: string | null;
  cancelled_by: 'adopter' | 'system' | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdoptionRequestListItem {
  id: string;
  animal_name: string;
  animal_species: string;
  adopter_name: string;
  status: AdoptionRequestStatus;
  created_at: string;
}

export interface AdoptionRequestCreatedResponse {
  id: string;
  animal_id: string;
  status: AdoptionRequestStatus;
  created_at: Date;
}

export interface AdopterRequestListItem {
  id: string;
  animal_name: string;
  animal_species: string;
  animal_photo_url: string | null;
  animal_breed: string | null;
  ong_name: string;
  status: AdoptionRequestStatus;
  rejection_reason: string | null;
  created_at: string;
}

export interface AdopterRequestDetail {
  id: string;
  animal_name: string;
  animal_species: string;
  animal_breed: string | null;
  animal_photo_url: string | null;
  ong_name: string;
  status: AdoptionRequestStatus;
  rejection_reason: string | null;
  cancelled_by: 'adopter' | 'system' | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
