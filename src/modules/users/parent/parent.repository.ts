import { WithId } from "mongodb";

import {
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { Parent, ParentAddress } from "./parent.type";

export class ParentRepository extends BaseRepository<Parent> {
  constructor() {
    super(PARENTS_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<Parent> | null> {
    return await this.findOne({ user_id: userId });
  }

  async createParent(data: Partial<Parent>): Promise<WithId<Parent>> {
    return await this.create(data as any);
  }

  async updateByUserId(
    userId: string,
    data: Partial<Parent>,
  ): Promise<WithId<Parent> | null> {
    return await this.updateOne({ user_id: userId }, { $set: data });
  }
}

export class ParentAddressRepository extends BaseRepository<ParentAddress> {
  constructor() {
    super(PARENT_ADDRESSES_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<ParentAddress> | null> {
    // Find parent first to get parent_id
    const parentRepo = new ParentRepository();
    const parent = await parentRepo.findByUserId(userId);
    if (!parent || !parent._id) return null;

    const parentId = String(parent._id);
    return await this.findOne({ parent_id: parentId, is_primary: true });
  }

  async upsertByUserId(
    userId: string,
    data: Partial<ParentAddress>,
  ): Promise<boolean> {
    const parentRepo = new ParentRepository();
    const parent = await parentRepo.findByUserId(userId);
    if (!parent || !parent._id) return false;

    const parentId = String(parent._id);
    const existing = await this.findOne({
      parent_id: parentId,
      is_primary: true,
    });

    if (existing) {
      const result = await this.updateOne(
        { parent_id: parentId, is_primary: true },
        { $set: { ...data, updated_at: new Date() } },
      );
      return !!result;
    } else {
      await this.create({
        ...data,
        parent_id: parentId,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
      return true;
    }
  }
}

export const parentRepository = new ParentRepository();
export const parentAddressRepository = new ParentAddressRepository();
