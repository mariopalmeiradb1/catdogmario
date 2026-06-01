export interface User {
  id: string;
  name: string;
  email: string;
  role: 'adopter' | 'ong_volunteer' | 'ong_admin' | 'system_admin';
  ong_id?: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  must_change_password?: boolean;
}

export interface RegisterAdopterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterOngData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  ong_name: string;
  cnpj: string;
  phone: string;
  address: string;
  description: string;
  capacity: number;
}

export interface ResetPasswordData {
  reset_token: string;
  password: string;
  password_confirmation: string;
}
