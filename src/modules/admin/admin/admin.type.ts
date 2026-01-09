import { UserRole } from "@shared/constants/enums";

export interface Admin {
  _id?: any; // MongoDB internal ID
  admin_id: string;
  username: string;
  password_hash: string;
  email: string;
  phone_number?: string;
  admin_role: UserRole;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminCreateInput {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
  admin_role: UserRole;
}

export interface AdminUpdateInput {
  username?: string;
  email?: string;
  phone_number?: string;
  is_active?: boolean;
}

export interface AdminPasswordChangeInput {
  current_password: string;
  new_password: string;
}

export interface AdminResponse {
  admin_id: string;
  username: string;
  email: string;
  phone_number?: string;
  admin_role: UserRole;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface AdminLoginResponse {
  admin: AdminResponse;
  access_token: string;
  refresh_token: string;
}
