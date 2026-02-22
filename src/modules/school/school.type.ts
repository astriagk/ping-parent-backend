export interface School {
  _id?: any;
  school_name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  contact_number?: string;
  email?: string;
  principal_name?: string;
  created_at: Date;
  updated_at?: Date;
}
