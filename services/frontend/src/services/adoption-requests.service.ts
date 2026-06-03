import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type {
  AdoptionRequestCreatedResponse,
  AdopterRequestFilters,
  AdopterRequestListResponse,
  AdopterRequestDetail,
  VolunteerRequestFilters,
  VolunteerRequestListResponse,
  AdoptionRequestDetail,
} from '~/types/adoption-requests.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/adoption-requests`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adoptionRequestsService = {
  async create(animalId: string): Promise<AdoptionRequestCreatedResponse> {
    const { data } = await api.post<AdoptionRequestCreatedResponse>('/', { animal_id: animalId });
    return data;
  },

  async listMine(filters?: AdopterRequestFilters): Promise<AdopterRequestListResponse> {
    const { data } = await api.get<AdopterRequestListResponse>('/mine', { params: filters });
    return data;
  },

  async findMineById(id: string): Promise<AdopterRequestDetail> {
    const { data } = await api.get<{ data: AdopterRequestDetail }>(`/mine/${id}`);
    return data.data;
  },

  async cancel(id: string): Promise<void> {
    await api.patch(`/${id}/cancel`);
  },

  async list(filters?: VolunteerRequestFilters): Promise<VolunteerRequestListResponse> {
    const { data } = await api.get<VolunteerRequestListResponse>('/', { params: filters });
    return data;
  },

  async findById(id: string): Promise<AdoptionRequestDetail> {
    const { data } = await api.get<{ data: AdoptionRequestDetail }>(`/${id}`);
    return data.data;
  },

  async startReview(id: string): Promise<void> {
    await api.patch(`/${id}/start-review`);
  },

  async approve(id: string): Promise<void> {
    await api.patch(`/${id}/approve`);
  },

  async reject(id: string, rejectionReason: string): Promise<void> {
    await api.patch(`/${id}/reject`, { rejection_reason: rejectionReason });
  },
};
