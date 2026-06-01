import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type { AuditLogEntry, AuditLogFilters } from '~/types/volunteer.types';
import type { PaginatedResponse } from '~/types/shared.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/audit-logs`,
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
  filters: AuditLogFilters,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };

  if (filters.user_id) params.user_id = filters.user_id;
  if (filters.action) params.action = filters.action;
  if (filters.entity) params.entity = filters.entity;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;

  return params;
}

export const auditLogService = {
  async list(
    filters: AuditLogFilters,
  ): Promise<PaginatedResponse<AuditLogEntry>> {
    const { data } = await api.get<PaginatedResponse<AuditLogEntry>>('/', {
      params: buildFilterParams(filters),
    });
    return data;
  },
};
