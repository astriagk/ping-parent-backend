import { Gender } from "@shared/constants";

export interface Student {
  _id?: any;
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

export type AdminStudentInput = Omit<
  Student,
  "_id" | "parent_id" | "is_active" | "created_at" | "updated_at"
>;

export interface AdminBulkStudentResult {
  student_name: string;
  status: "created" | "skipped";
  student_id?: string;
  reason?: string;
}
