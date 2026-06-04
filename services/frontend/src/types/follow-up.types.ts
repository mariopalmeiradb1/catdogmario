export type ReminderStatus = 'pending' | 'overdue' | 'completed' | 'cancelled';

export type ContactStatus = 'positive' | 'neutral' | 'negative' | 'no_response';

export interface RegisterContactInput {
  contact_date: string;
  status: ContactStatus;
  observation: string;
}

export interface FollowUpContactDetail {
  id: string;
  reminder_id: string;
  registered_by: string;
  registered_by_name: string;
  ong_id: string;
  contact_date: string;
  status: ContactStatus;
  observation: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  reminder_id: string;
  reminder_number: number;
  due_date: string;
  reminder_status: ReminderStatus;
  contact: {
    id: string;
    contact_date: string;
    status: ContactStatus;
    observation: string;
    registered_by_name: string;
    created_at: string;
  } | null;
}

export interface AdoptionTimeline {
  adoption_request_id: string;
  animal_name: string;
  adopter_name: string;
  adopter_phone: string | null;
  adopter_email: string;
  adoption_date: string;
  is_complete: boolean;
  has_no_response_pattern: boolean;
  entries: TimelineEntry[];
}

export interface FollowUpListItem {
  id: string;
  adoption_request_id: string;
  animal_name: string;
  adopter_name: string;
  reminder_number: number;
  due_date: string;
  status: ReminderStatus;
  has_contact: boolean;
  contact_id: string | null;
  contact_observation: string | null;
}

export interface FollowUpListFilters {
  status?: ReminderStatus | 'all';
  page?: number;
  limit?: number;
}

export interface FollowUpListResponse {
  data: FollowUpListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
