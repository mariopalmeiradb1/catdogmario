import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type { AdopterProfile, CreateAdopterProfileInput, UpdateAdopterProfileInput } from '~/types/adopter-management.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/adopter-management`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adopterManagementService = {
  async createProfile(data: CreateAdopterProfileInput): Promise<AdopterProfile> {
    const response = await api.post<{ data: AdopterProfile }>('/', data);
    return response.data.data;
  },

  async getMyProfile(): Promise<AdopterProfile> {
    const response = await api.get<{ data: AdopterProfile }>('/me');
    return response.data.data;
  },

  async updateMyProfile(data: UpdateAdopterProfileInput): Promise<AdopterProfile> {
    const response = await api.put<{ data: AdopterProfile }>('/me', data);
    return response.data.data;
  },

  async getProfileById(id: string): Promise<AdopterProfile> {
    const response = await api.get<{ data: AdopterProfile }>(`/${id}`);
    return response.data.data;
  },
};
