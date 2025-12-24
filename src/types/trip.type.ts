export interface TripStop {
  studentId: string;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  scheduledTime?: Date;
  actualTime?: Date;
  status: "pending" | "completed" | "skipped";
}

export interface Trip {
  _id?: any;
  studentId: string;
  parentId: string;
  driverId?: string;
  vehicleId?: string;
  startLocation?: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  endLocation?: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  currentLocation?: {
    coordinates: { lat: number; lng: number };
    timestamp: Date;
  };
  stops?: TripStop[];
  scheduledStartTime: Date;
  actualStartTime?: Date;
  estimatedEndTime?: Date;
  actualEndTime?: Date;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  distance?: number;
  duration?: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}
