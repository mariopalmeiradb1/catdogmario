export type OngStatus = 'pending' | 'approved' | 'rejected' | 'inactive' | 'in_review';

export interface OngListItem {
  id: string;
  name: string;
  cnpj: string;
  city: string | null;
  state: string | null;
  status: OngStatus;
  created_at: string;
}

export interface OngDetail extends OngListItem {
  phone: string;
  address: string;
  description: string;
  mission: string | null;
  capacity: number;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  rejected_at: string | null;
  deactivated_at: string | null;
  updated_at: string;
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

export type { PaginatedResponse } from './shared.types';

export interface UpdateOngData {
  name?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  description?: string;
  mission?: string;
  capacity?: number;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
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
