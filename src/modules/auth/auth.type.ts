import { UserRole } from "@shared/constants";

export interface User {
  _id?: any;
  phone_number: string;
  user_type: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  last_login?: Date;
  fcm_token?: string;
}

export interface UserWithProfile extends User {
  name?: string;
  email?: string;
  photo_url?: string;
  approval_status?: string;
  school_id?: any;
}
