// Table: drivers
export interface Driver {
  _id?: any; // MongoDB internal ID
  driver_id?: string;
  user_id: string;
  driver_unique_id: string;
  name: string;
  email?: string;
  photo_url?: string;
  home_address?: string;
  home_latitude?: number;
  home_longitude?: number;
  driving_license_number: string;
  driving_license_photo_url?: string;
  vehicle_license_number: string;
  vehicle_license_photo_url?: string;
  insurance_number?: string;
  insurance_photo_url?: string;
  vehicle_type: "van" | "auto" | "bus";
  vehicle_number: string;
  vehicle_capacity: number;
  current_student_count?: number;
  approval_status?: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  is_available?: boolean;
  rating?: number;
  total_trips?: number;
  created_at?: Date;
  updated_at?: Date;
}
