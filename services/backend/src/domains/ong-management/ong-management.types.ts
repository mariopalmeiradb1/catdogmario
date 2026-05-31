export type OngStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface OngDetail {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  description: string;
  mission: string | null;
  capacity: number;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  status: OngStatus;
  rejected_at: Date | null;
  deactivated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OngListItem {
  id: string;
  name: string;
  cnpj: string;
  city: string | null;
  state: string | null;
  status: OngStatus;
  created_at: Date;
}

export interface OngListFilters {
  status?: OngStatus;
  state?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateOngInput {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  description?: string;
  mission?: string | null;
  capacity?: number;
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
}

export interface UpdateOngAdminInput extends UpdateOngInput {
  name?: string;
  cnpj?: string;
}
