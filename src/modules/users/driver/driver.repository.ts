import { WithId } from "mongodb";

import {
  DRIVERS_COLLECTION,
  DRIVER_ADDRESSES_COLLECTION,
  DRIVER_DOCUMENTS_COLLECTION,
  DRIVER_ONBOARDING_COLLECTION,
  DriverOnboardingScreen,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import {
  Driver,
  DriverAddress,
  DriverDocument,
  DriverOnboarding,
} from "./driver.type";

export class DriverRepository extends BaseRepository<Driver> {
  constructor() {
    super(DRIVERS_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<Driver> | null> {
    return await this.findOne({ user_id: userId });
  }

  async createDriver(data: Partial<Driver>): Promise<WithId<Driver>> {
    return await this.create(data as any);
  }

  async updateByUserId(
    userId: string,
    data: Partial<Driver>,
  ): Promise<WithId<Driver> | null> {
    return await this.updateOne({ user_id: userId }, { $set: data });
  }
}

export class DriverAddressRepository extends BaseRepository<DriverAddress> {
  constructor() {
    super(DRIVER_ADDRESSES_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<DriverAddress> | null> {
    const driverRepo = new DriverRepository();
    const driver = await driverRepo.findByUserId(userId);
    if (!driver || !driver._id) return null;

    const driverId = String(driver._id);
    return await this.findOne({ driver_id: driverId, is_primary: true });
  }

  async upsertByUserId(
    userId: string,
    data: Partial<DriverAddress>,
  ): Promise<boolean> {
    const driverRepo = new DriverRepository();
    const driver = await driverRepo.findByUserId(userId);
    if (!driver || !driver._id) return false;

    const driverId = String(driver._id);
    const existing = await this.findOne({
      driver_id: driverId,
      is_primary: true,
    });

    if (existing) {
      const result = await this.updateOne(
        { driver_id: driverId, is_primary: true },
        { $set: { ...data, updated_at: new Date() } },
      );
      return !!result;
    } else {
      await this.create({
        ...data,
        driver_id: driverId,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      return true;
    }
  }
}

export class DriverDocumentRepository extends BaseRepository<DriverDocument> {
  constructor() {
    super(DRIVER_DOCUMENTS_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<DriverDocument> | null> {
    const driverRepo = new DriverRepository();
    const driver = await driverRepo.findByUserId(userId);
    if (!driver || !driver._id) return null;

    const driverId = String(driver._id);
    return await this.findOne({ driver_id: driverId });
  }

  async upsertByUserId(
    userId: string,
    data: Partial<DriverDocument>,
  ): Promise<boolean> {
    const driverRepo = new DriverRepository();
    const driver = await driverRepo.findByUserId(userId);
    if (!driver || !driver._id) return false;

    const driverId = String(driver._id);
    const existing = await this.findOne({ driver_id: driverId });

    if (existing) {
      const result = await this.updateOne(
        { driver_id: driverId },
        { $set: { ...data, updated_at: new Date() } },
      );
      return !!result;
    } else {
      await this.create({
        ...data,
        driver_id: driverId,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      return true;
    }
  }

  async updateByUserId(
    userId: string,
    data: Partial<DriverDocument>,
  ): Promise<boolean> {
    const driverRepo = new DriverRepository();
    const driver = await driverRepo.findByUserId(userId);
    if (!driver || !driver._id) return false;

    const driverId = String(driver._id);
    const result = await this.updateOne(
      { driver_id: driverId },
      { $set: { ...data, updated_at: new Date() } },
    );
    return !!result;
  }
}

export const driverRepository = new DriverRepository();
export const driverAddressRepository = new DriverAddressRepository();
export const driverDocumentRepository = new DriverDocumentRepository();

export class DriverOnboardingRepository extends BaseRepository<DriverOnboarding> {
  constructor() {
    super(DRIVER_ONBOARDING_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<DriverOnboarding> | null> {
    return this.findOne({ user_id: userId });
  }

  async upsertByUserId(userId: string, screen_name: DriverOnboardingScreen) {
    return this.getCollection().updateOne(
      { user_id: userId },
      { $set: { screen_name, updated_at: new Date() } },
      { upsert: true },
    );
  }
}

export const driverOnboardingRepository = new DriverOnboardingRepository();
