// Table: roles
export interface Role {
  _id?: any; // MongoDB internal ID
  role_id: string;
  role_name: string;
  description?: string;
  created_at: Date;
  updated_at?: Date;
}

// Role creation input
export interface RoleCreateInput {
  role_name: string;
  description?: string;
}

// Role update input
export interface RoleUpdateInput {
  role_name?: string;
  description?: string;
}

// Role response (without MongoDB _id)
export interface RoleResponse {
  role_id: string;
  role_name: string;
  description?: string;
  created_at: Date;
  updated_at?: Date;
}
