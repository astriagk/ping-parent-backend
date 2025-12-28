export type Gender = "male" | "female" | "other";

export interface Student {
  _id?: any; // MongoDB internal ID
  student_id: string;
  parent_id: string;
  school_id: string;
  student_name: string;
  class: string;
  section?: string;
  roll_number?: string;
  photo_url?: string;
  date_of_birth?: Date;
  gender?: Gender;
  pickup_address_id: string;
  emergency_contact?: string;
  medical_info?: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
