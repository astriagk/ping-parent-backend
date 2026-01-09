import { AssignmentStatus } from "@shared/constants";

export interface DriverStudentAssignment {
  _id?: any;
  assignment_id: string;
  driver_id: string;
  student_id: string;
  driver_unique_id: string;
  monthly_fee?: number;
  assignment_status: AssignmentStatus;
  assigned_date: Date;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at?: Date;
}
