import { AssignmentSource, AssignmentStatus } from "@shared/constants";

export interface DriverStudentAssignment {
  _id?: any;
  driver_id: string;
  student_id: string;
  driver_unique_id: string;
  monthly_fee?: number;
  assignment_status: AssignmentStatus;
  assigned_date: Date;
  start_date?: Date;
  end_date?: Date;
  assigned_by?: string; // FK to admin_portal - admin/school_admin who created assignment
  assignment_source: AssignmentSource; // parent, school_admin, system
  school_id: string; // FK to schools - which school this assignment is for
  created_at: Date;
  updated_at?: Date;
}
