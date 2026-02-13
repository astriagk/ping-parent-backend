import { WithId } from "mongodb";

import { TRIPS_COLLECTION, TripStatus, TripType } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { Trip } from "./trip.type";

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
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(tripDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await this.findMany({
      driver_id: driverId,
      trip_date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  async findByStatus(status: TripStatus): Promise<WithId<Trip>[]> {
    return await this.findMany({ trip_status: status });
  }

  async findDuplicateTrip(
    driverId: string,
    tripType: TripType,
    tripDate: Date,
  ): Promise<WithId<Trip> | null> {
    const startOfDay = new Date(tripDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(tripDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await this.findOne({
      driver_id: driverId,
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
      trip_status: {
        $in: [TripStatus.SCHEDULED, TripStatus.STARTED, TripStatus.IN_PROGRESS],
      },
    });
  }
}

export const tripRepository = new TripRepository();
