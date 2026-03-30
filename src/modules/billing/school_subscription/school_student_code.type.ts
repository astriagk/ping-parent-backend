export interface SchoolStudentCode {
  _id?: any;
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

export interface SchoolStudentCodeListItem {
  _id: any;
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
  student_name?: string;
  student_class?: string;
  student_section?: string;
  redeemed_by_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
}
