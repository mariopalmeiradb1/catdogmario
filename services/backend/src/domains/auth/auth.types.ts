import { Role } from '~/shared/constants/roles';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  ong_id: string | null;
  email_confirmed_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Ong {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface EmailConfirmation {
  id: string;
  user_id: string;
  token: string;
  used_at: Date | null;
  expires_at: Date;
  created_at: Date;
}

export interface PasswordReset {
  id: string;
  user_id: string;
  code: string;
  used_at: Date | null;
  expires_at: Date;
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  ong_id: string | null;
}

export interface CreateOngData {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
}

export interface RegisterAdopterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterOngInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  ong_name: string;
  cnpj: string;
  phone: string;
  address: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  access_token: string;
  user: { id: string; name: string; email: string; role: Role };
  refreshToken: string;
}

export interface RefreshResult {
  access_token: string;
  user: { id: string; name: string; email: string; role: Role };
  refreshToken: string;
}
