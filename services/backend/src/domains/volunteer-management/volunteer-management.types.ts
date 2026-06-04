export interface VolunteerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  cpf: string;
  rg: string;
  birth_date: string;
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_active: boolean;
  must_change_password: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface VolunteerListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_last4: string;
  is_active: boolean;
  created_at: string;
}
