import { Document, Filter, WithId } from "mongodb";

import { COLLECTIONS, USERS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { User, UserWithProfile } from "./auth.type";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(USERS_COLLECTION);
  }

  async findByEmail(email: string): Promise<WithId<User> | null> {
    return await this.findOne({ email: email.toLowerCase() });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<WithId<User> | null> {
    return await this.findOne({ phone_number: phoneNumber });
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.exists({ email: email.toLowerCase() });
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    return await this.exists({ phone_number: phoneNumber });
  }

  async findAllWithProfile(
    filter: Filter<User> = {},
  ): Promise<UserWithProfile[]> {
    return await this.getCollection()
      .aggregate<UserWithProfile>([
        { $match: filter as Document },
        {
          $addFields: {
            _id_str: { $toString: "$_id" },
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.PARENTS,
            localField: "_id_str",
            foreignField: "user_id",
            as: "parent_profile",
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.DRIVERS,
            localField: "_id_str",
            foreignField: "user_id",
            as: "driver_profile",
          },
        },
        {
          $addFields: {
            profile: {
              $cond: {
                if: { $eq: ["$user_type", "driver"] },
                then: { $arrayElemAt: ["$driver_profile", 0] },
                else: { $arrayElemAt: ["$parent_profile", 0] },
              },
            },
          },
        },
        {
          $addFields: {
            name: "$profile.name",
            email: "$profile.email",
            photo_url: "$profile.photo_url",
            approval_status: "$profile.approval_status",
          },
        },
        {
          $project: {
            parent_profile: 0,
            driver_profile: 0,
            profile: 0,
            _id_str: 0,
          },
        },
      ])
      .toArray();
  }
}

export const userRepository = new UserRepository();
