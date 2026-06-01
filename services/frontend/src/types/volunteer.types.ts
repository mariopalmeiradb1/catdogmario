export interface VolunteerListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_last4: string;
  is_active: boolean;
  created_at: string;
}

export interface VolunteerDetail extends VolunteerListItem {
  cpf: string;
  rg: string;
  birth_date: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  must_change_password: boolean;
  deleted_at?: string;
}

export interface CreateVolunteerInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  cpf: string;
  rg: string;
  birth_date: string;
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface UpdateVolunteerInput {
  name?: string;
  rg?: string;
  birth_date?: string;
  phone?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface VolunteerListFilters {
  status?: 'active' | 'inactive';
  search?: string;
  page: number;
  limit: number;
}

export interface AuditLogEntry {
  id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: string;
  entity?: string;
  date_from?: string;
  date_to?: string;
  page: number;
  limit: number;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}
