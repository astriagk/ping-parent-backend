export interface SchoolAdmin {
  _id?: any;
  school_id: string; // FK to schools
  user_id?: string; // Optional: reference to users table if unified auth
  email: string;
  password_hash: string;
  phone_number?: string;
  name: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface SchoolAdminLoginInput {
  email: string;
  password: string;
}

export interface SchoolAdminRegisterInput {
  school_id: string;
  email: string;
  password: string;
  phone_number?: string;
  name: string;
}

export interface SchoolAdminResponse {
  _id: string;
  school_id: string;
  email: string;
  phone_number?: string;
  name: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
}

export interface SchoolAdminLoginResponse {
  admin: SchoolAdminResponse;
  access_token: string;
  refresh_token: string;
}

export interface SchoolAdminUpdateInput {
  email?: string;
  phone_number?: string;
  name?: string;
  is_active?: boolean;
}

export interface SchoolAdminPasswordChangeInput {
  current_password: string;
  new_password: string;
}
