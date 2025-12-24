export interface Address {
  userId: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}
