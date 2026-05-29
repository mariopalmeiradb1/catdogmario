import axios from 'axios';
import { env } from '~/config/env';
import type {
  LoginResponse,
  RegisterAdopterData,
  RegisterOngData,
  ResetPasswordData,
  User,
} from '~/types/auth.types';

const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(cb: () => void) {
  logoutCallback = cb;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<LoginResponse>('/auth/refresh');
        accessToken = data.access_token;
        onTokenRefreshed(data.access_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        accessToken = null;
        logoutCallback?.();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const authService = {
  async registerAdopter(data: RegisterAdopterData): Promise<{ message: string }> {
    const response = await api.post('/auth/register/adopter', data);
    return response.data;
  },

  async registerOng(data: RegisterOngData): Promise<{ message: string }> {
    const response = await api.post('/auth/register/ong', data);
    return response.data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  async confirmEmail(token: string): Promise<{ message: string }> {
    const response = await api.post('/auth/confirm-email', { token });
    return response.data;
  },

  async resendConfirmation(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/resend-confirmation', { email });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyResetCode(email: string, code: string): Promise<{ reset_token: string }> {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response.data;
  },

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  async refresh(): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/refresh');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;
