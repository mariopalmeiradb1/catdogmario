export type AdoptionRequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface AdoptionRequestCreatedResponse {
  id: string;
  animal_id: string;
  status: AdoptionRequestStatus;
  created_at: string;
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

export interface AdopterRequestFilters {
  status?: AdoptionRequestStatus | 'all';
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface AdopterRequestListResponse {
  data: AdopterRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
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
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface VolunteerRequestFilters {
  status?: AdoptionRequestStatus | 'all';
  animal_id?: string;
  page?: number;
  limit?: number;
}

export interface VolunteerRequestListItem {
  id: string;
  animal_name: string;
  animal_species: string;
  adopter_name: string;
  status: AdoptionRequestStatus;
  created_at: string;
}

export interface VolunteerRequestListResponse {
  data: VolunteerRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
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
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleVisitInput {
  visit_date: string;
  notes?: string;
}

export interface ScheduleVisitResponse {
  id: string;
  adoption_request_id: string;
  animal_name: string;
  visit_date: string;
  status: 'scheduled';
  created_at: string;
}
