import { UpdateFilter, WithId } from "mongodb";

import { ADMIN_PORTAL_COLLECTION } from "@constants";
import { Admin } from "@models/admin.type";

import { BaseRepository } from "./base.repository";

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

  async findByAdminId(adminId: string): Promise<WithId<Admin> | null> {
    return await this.findOne({ admin_id: adminId });
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

  async adminIdExists(adminId: string): Promise<boolean> {
    return await this.exists({ admin_id: adminId });
  }

  async updateByAdminId(
    adminId: string,
    update: UpdateFilter<Admin>,
  ): Promise<WithId<Admin> | null> {
    return await this.updateOne({ admin_id: adminId }, update);
  }
}

export const adminRepository = new AdminRepository();
