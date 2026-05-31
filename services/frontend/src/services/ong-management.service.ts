import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type {
  OngDetail,
  OngListFilters,
  OngListItem,
  PaginatedResponse,
  UpdateOngData,
  UpdateOngInput,
} from '~/types/ong-management.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/ong-management`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function buildFilterParams(filters: OngListFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.status) params.status = filters.status;
  if (filters.state) params.state = filters.state;
  if (filters.city) params.city = filters.city;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;

  return params;
}

export const ongManagementService = {
  async list(filters: OngListFilters): Promise<PaginatedResponse<OngListItem>> {
    const { data } = await api.get<PaginatedResponse<OngListItem>>('/', {
      params: buildFilterParams(filters),
    });
    return data;
  },

  async getDetail(id: string): Promise<OngDetail> {
    const { data } = await api.get<OngDetail>(`/${id}`);
    return data;
  },

  async markInReview(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/${id}/in-review`);
    return data;
  },

  async approve(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/${id}/approve`);
    return data;
  },

  async reject(id: string, reason?: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/${id}/reject`, { reason });
    return data;
  },

  async update(id: string, updateData: UpdateOngData): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>(`/${id}`, updateData);
    return data;
  },

  async deactivate(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/${id}/deactivate`);
    return data;
  },

  async reactivate(id: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>(`/${id}/reactivate`);
    return data;
  },

  async getMyOng(): Promise<OngDetail> {
    const { data } = await api.get<{ data: OngDetail }>('/my-ong');
    return data.data;
  },

  async updateMyOng(updateData: UpdateOngInput): Promise<{ message: string; data: OngDetail }> {
    const { data } = await api.put<{ message: string; data: OngDetail }>('/my-ong', updateData);
    return data;
  },
};
