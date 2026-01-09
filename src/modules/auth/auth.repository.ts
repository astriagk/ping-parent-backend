import { WithId } from "mongodb";

import { USERS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { User } from "./auth.type";

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
}

export const userRepository = new UserRepository();
