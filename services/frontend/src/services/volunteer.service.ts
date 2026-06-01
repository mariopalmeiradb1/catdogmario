import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type {
  CreateVolunteerInput,
  UpdateVolunteerInput,
  VolunteerDetail,
  VolunteerListFilters,
  VolunteerListItem,
} from '~/types/volunteer.types';
import type { PaginatedResponse } from '~/types/shared.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/volunteers`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function buildFilterParams(
  filters: VolunteerListFilters,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.status) params.status = filters.status;
  if (filters.search) params.search = filters.search;

  return params;
}

export const volunteerService = {
  async list(
    filters: VolunteerListFilters,
  ): Promise<PaginatedResponse<VolunteerListItem>> {
    const { data } = await api.get<PaginatedResponse<VolunteerListItem>>('/', {
      params: buildFilterParams(filters),
    });
    return data;
  },

  async getDetail(id: string): Promise<VolunteerDetail> {
    const { data } = await api.get<{ data: VolunteerDetail }>(`/${id}`);
    return data.data;
  },

  async create(input: CreateVolunteerInput): Promise<{ message: string; data: { id: string } }> {
    const { data } = await api.post<{ message: string; data: { id: string } }>('/', input);
    return data;
  },

  async update(
    id: string,
    input: UpdateVolunteerInput,
  ): Promise<{ message: string; data: VolunteerDetail }> {
    const { data } = await api.put<{ message: string; data: VolunteerDetail }>(`/${id}`, input);
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

  async remove(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/${id}`);
    return data;
  },
};
