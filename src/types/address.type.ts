export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: Coordinates;
  createdAt?: Date;
  updatedAt?: Date;
}
