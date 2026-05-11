// Table: parents
export interface Parent {
  _id?: any;
  user_id: string;
  name: string;
  email?: string;
  photo_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Table: parent_addresses
export interface ParentAddress {
  _id?: any;
  parent_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  is_primary?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Reusable type for address input (omits auto-generated/internal fields)
export type ParentAddressInput = Omit<
  ParentAddress,
  "_id" | "parent_id" | "created_at" | "updated_at"
>;

export interface AdminCreateParentInput {
  phone_number: string;
  name: string;
  email?: string;
  photo_url?: string;
  address?: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode?: string;
    latitude: number;
    longitude: number;
  };
}

export interface AdminCreateParentResult {
  user_id: string;
  parent_id: string;
  address_id?: string;
}

export type AdminUpdateParentInput = Partial<
  Pick<Parent, "name" | "email" | "photo_url">
>;

export interface AdminBulkParentResult {
  phone_number: string;
  status: "created" | "skipped";
  parent_id?: string;
  user_id?: string;
  address_id?: string;
  reason?: string;
}

export interface AdminBulkParentStudentInput {
  school_id: string;
  student_name: string;
  class: string;
  section?: string;
  roll_number?: string;
  gender?: string;
  date_of_birth?: Date | string;
  pickup_address_id?: string | null;
  emergency_contact?: string;
  medical_info?: string;
}

export interface AdminBulkParentWithStudentsRecord {
  parent: AdminCreateParentInput;
  students: AdminBulkParentStudentInput[];
}

export interface AdminBulkParentsWithStudentsResultItem {
  phone_number: string;
  parent_status: "created" | "skipped";
  parent_id?: string;
  user_id?: string;
  parent_reason?: string;
  students: Array<{
    student_name: string;
    status: "created" | "skipped";
    student_id?: string;
    reason?: string;
  }>;
}
