// Table: admin_portal
export interface Admin {
  _id?: any; // MongoDB internal ID
  admin_id?: string;
  username: string;
  password_hash: string;
  email: string;
  phone_number?: string;
  is_active?: boolean;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Table: roles
export interface Role {
  _id?: any; // MongoDB internal ID
  role_id?: string;
  role_name: string; // parent, driver, superadmin, admin, support
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Table: user_roles
export interface UserRole {
  _id?: any; // MongoDB internal ID
  user_role_id?: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at?: Date;
  is_active?: boolean;
}
