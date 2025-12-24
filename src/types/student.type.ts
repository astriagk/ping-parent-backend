export interface Student {
  _id?: any;
  parentId: string;
  firstName: string;
  lastName: string;
  age?: number;
  schoolName?: string;
  grade?: string;
  pickupLocation?: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  dropoffLocation?: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: Date;
  updatedAt?: Date;
}
