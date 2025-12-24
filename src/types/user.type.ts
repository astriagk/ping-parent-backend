export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number } | null;
}

export interface User {
  _id?: any;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  address?: Address;
  role?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  verificationToken?: string;
  createdAt: Date;
}
