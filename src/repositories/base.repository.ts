import {
  Collection,
  Document,
  Filter,
  OptionalId,
  OptionalUnlessRequiredId,
  UpdateFilter,
  WithId,
} from "mongodb";

import { getDB } from "@config";

export class BaseRepository<T extends Document> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollection(): Collection<T> {
    const db = getDB();
    return db.collection<T>(this.collectionName);
  }

  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    return await this.getCollection().findOne(filter);
  }

  async findMany(filter: Filter<T> = {}): Promise<WithId<T>[]> {
    return await this.getCollection().find(filter).toArray();
  }

  async findById(id: string): Promise<WithId<T> | null> {
    return await this.getCollection().findOne({ _id: id } as Filter<T>);
  }

  async create(data: OptionalId<T>): Promise<WithId<T>> {
    const result = await this.getCollection().insertOne(
      data as OptionalUnlessRequiredId<T>,
    );
    return { ...data, _id: result.insertedId } as WithId<T>;
  }

  async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>,
  ): Promise<WithId<T> | null> {
    const result = await this.getCollection().findOneAndUpdate(filter, update, {
      returnDocument: "after",
    });
    return result;
  }

  async updateById(
    id: string,
    update: UpdateFilter<T>,
  ): Promise<WithId<T> | null> {
    return await this.updateOne({ _id: id } as Filter<T>, update);
  }

  async deleteOne(filter: Filter<T>): Promise<boolean> {
    const result = await this.getCollection().deleteOne(filter);
    return result.deletedCount > 0;
  }

  async deleteById(id: string): Promise<boolean> {
    return await this.deleteOne({ _id: id } as Filter<T>);
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    return await this.getCollection().countDocuments(filter);
  }

  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.getCollection().countDocuments(filter, {
      limit: 1,
    });
    return count > 0;
  }
}
