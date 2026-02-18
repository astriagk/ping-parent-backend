export interface SchoolStudentCode {
  _id?: any;
  code_id: string;
  code: string;
  school_subscription_id: string;
  school_id: string;
  student_id: string;
  plan_id: string;
  end_date: Date;
  is_redeemed: boolean;
  redeemed_by_parent_id?: string;
  redeemed_at?: Date;
  created_at: Date;
}

export interface GenerateStudentCodesInput {
  student_ids: string[];
}
