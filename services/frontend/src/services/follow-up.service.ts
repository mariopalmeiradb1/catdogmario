import axios from 'axios';
import { env } from '~/config/env';
import { getAccessToken } from '~/services/auth.service';
import type {
  RegisterContactInput,
  FollowUpContactDetail,
  AdoptionTimeline,
  FollowUpListFilters,
  FollowUpListResponse,
} from '~/types/follow-up.types';

const api = axios.create({
  baseURL: `${env.VITE_API_URL}/follow-up`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const followUpService = {
  async list(filters?: FollowUpListFilters): Promise<FollowUpListResponse> {
    const { data } = await api.get<FollowUpListResponse>('/reminders', { params: filters });
    return data;
  },

  async registerContact(reminderId: string, input: RegisterContactInput): Promise<FollowUpContactDetail> {
    const { data } = await api.post<{ data: FollowUpContactDetail }>(`/reminders/${reminderId}/contact`, input);
    return data.data;
  },

  async editContact(contactId: string, input: { observation: string }): Promise<FollowUpContactDetail> {
    const { data } = await api.put<{ data: FollowUpContactDetail }>(`/contacts/${contactId}`, input);
    return data.data;
  },

  async getTimeline(adoptionRequestId: string): Promise<AdoptionTimeline> {
    const { data } = await api.get<{ data: AdoptionTimeline }>(`/adoptions/${adoptionRequestId}/timeline`);
    return data.data;
  },
};
