// Table: schools
export interface School {
  _id?: any; // MongoDB internal ID
  school_id?: string;
  school_name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  contact_number?: string;
  email?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Table: students
export interface Student {
  _id?: any; // MongoDB internal ID
  student_id?: string;
  parent_id: string;
  school_id: string;
  student_name: string;
  class: string;
  section?: string;
  roll_number?: string;
  photo_url?: string;
  date_of_birth?: Date;
  gender?: "male" | "female" | "other";
  pickup_address_id: string;
  emergency_contact?: string;
  medical_info?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Table: driver_student_assignments
export interface DriverStudentAssignment {
  _id?: any; // MongoDB internal ID
  assignment_id?: string;
  driver_id: string;
  student_id: string;
  driver_unique_id: string;
  monthly_fee?: number;
  assignment_status?: "active" | "inactive" | "pending" | "parent_requested";
  assigned_date: Date;
  start_date?: Date;
  end_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}
