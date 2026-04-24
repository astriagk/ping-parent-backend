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
