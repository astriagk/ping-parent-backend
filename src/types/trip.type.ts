import { TripStatus, TripType } from "@constants";

export interface Trip {
  _id?: any;
  trip_id: string;
  driver_id: string;
  school_id: string;
  trip_type: TripType;
  trip_date: Date;
  trip_status: TripStatus;
  start_time?: Date;
  end_time?: Date;
  total_distance?: number;
  optimized_route_data?: any;
  created_at: Date;
  updated_at?: Date;
}
