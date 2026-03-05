export interface CreateSchoolAssignmentBody {
  driver_id: string;
  student_ids: string[];
  monthly_fee?: number;
  start_date?: string;
}

export interface RejectSchoolAssignmentBody {
  rejection_reason?: string;
}
