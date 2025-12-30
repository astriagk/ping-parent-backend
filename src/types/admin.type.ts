// Table: admin_portal
export interface Admin {
  _id?: any; // MongoDB internal ID
  admin_id: string;
  username: string;
  password_hash: string;
  email: string;
  phone_number?: string;
  admin_role: "admin" | "superadmin";
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
}

// Admin login request
export interface AdminLoginInput {
  email: string;
  password: string;
}

// Admin creation input (for superadmin only)
export interface AdminCreateInput {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
  admin_role: "admin" | "superadmin";
}

// Admin update input
export interface AdminUpdateInput {
  username?: string;
  email?: string;
  phone_number?: string;
  is_active?: boolean;
}

// Admin password change input
export interface AdminPasswordChangeInput {
  current_password: string;
  new_password: string;
}

// Admin response (without password hash)
export interface AdminResponse {
  admin_id: string;
  username: string;
  email: string;
  phone_number?: string;
  admin_role: "admin" | "superadmin";
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
}

// Admin login response
export interface AdminLoginResponse {
  admin: AdminResponse;
  access_token: string;
  refresh_token: string;
}
