import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type {
  CreateAnimalInput,
  CreateAnimalResult,
  UpdateAnimalInput,
  AnimalDetail,
  AnimalListFilters,
  AnimalListResponse,
  AnimalMedia,
} from '~/types/animal-management.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/animal-management`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const animalManagementService = {
  async create(input: CreateAnimalInput): Promise<CreateAnimalResult> {
    const { data } = await api.post<CreateAnimalResult>('/', input);
    return data;
  },

  async list(filters: AnimalListFilters = {}): Promise<AnimalListResponse> {
    const { data } = await api.get<AnimalListResponse>('/', { params: filters });
    return data;
  },

  async findById(id: string): Promise<AnimalDetail> {
    const { data } = await api.get<{ data: AnimalDetail }>(`/${id}`);
    return data.data;
  },

  async update(id: string, input: UpdateAnimalInput): Promise<AnimalDetail> {
    const { data } = await api.put<{ data: AnimalDetail }>(`/${id}`, input);
    return data.data;
  },

  async inactivate(id: string): Promise<void> {
    await api.patch(`/${id}/inactivate`);
  },

  async uploadMedia(id: string, file: File): Promise<AnimalMedia> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<AnimalMedia>(`/${id}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async removeMedia(id: string, mediaId: string): Promise<void> {
    await api.delete(`/${id}/media/${mediaId}`);
  },

  async startAdoptionProcess(id: string): Promise<void> {
    await api.patch(`/${id}/start-adoption-process`);
  },

  async revertToAvailable(id: string): Promise<void> {
    await api.patch(`/${id}/revert-to-available`);
  },

  async confirmAdoption(id: string, responsibilityTermNumber: string): Promise<void> {
    await api.patch(`/${id}/confirm-adoption`, { responsibility_term_number: responsibilityTermNumber });
  },
};
