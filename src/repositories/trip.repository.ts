import { WithId } from "mongodb";

import { TRIPS_COLLECTION } from "@constants";
import { Trip } from "@models/trip.type";

import { BaseRepository } from "./base.repository";

export class TripRepository extends BaseRepository<Trip> {
  constructor() {
    super(TRIPS_COLLECTION);
  }

  async findByDriverId(driverId: string): Promise<WithId<Trip>[]> {
    return await this.findMany({ driver_id: driverId });
  }

  async findBySchoolId(schoolId: string): Promise<WithId<Trip>[]> {
    return await this.findMany({ school_id: schoolId });
  }

  async findByDriverIdAndDate(
    driverId: string,
    tripDate: Date,
  ): Promise<WithId<Trip>[]> {
    const startOfDay = new Date(tripDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(tripDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.findMany({
      driver_id: driverId,
      trip_date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  async findByStatus(status: string): Promise<WithId<Trip>[]> {
    return await this.findMany({ trip_status: status });
  }

  async findDuplicateTrip(
    driverId: string,
    schoolId: string,
    tripType: string,
    tripDate: Date,
  ): Promise<WithId<Trip> | null> {
    const startOfDay = new Date(tripDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(tripDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.findOne({
      driver_id: driverId,
      school_id: schoolId,
      trip_type: tripType,
      trip_date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  async findActiveTrips(driverId: string): Promise<WithId<Trip>[]> {
    return await this.findMany({
      driver_id: driverId,
      trip_status: { $in: ["scheduled", "started", "in_progress"] },
    });
  }
}

export const tripRepository = new TripRepository();
