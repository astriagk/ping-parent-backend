import { WithId } from "mongodb";

import { ADMIN_PORTAL_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { Admin } from "./admin_management.type";

export class AdminRepository extends BaseRepository<Admin> {
  constructor() {
    super(ADMIN_PORTAL_COLLECTION);
  }

  async findByEmail(email: string): Promise<WithId<Admin> | null> {
    return await this.findOne({ email });
  }

  async findByUsername(username: string): Promise<WithId<Admin> | null> {
    return await this.findOne({ username });
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.exists({ email });
  }

  async usernameExists(username: string): Promise<boolean> {
    return await this.exists({ username });
  }

  async findActiveAdmins(): Promise<WithId<Admin>[]> {
    return await this.findMany({ is_active: true });
  }
}

export const adminRepository = new AdminRepository();
