import { WithId } from "mongodb";

import { RatingReview } from "@modules/reviews/rating_review.type";
import { getDB } from "@shared/config";
import { RATINGS_REVIEWS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

export class RatingReviewRepository extends BaseRepository<RatingReview> {
  constructor() {
    super(RATINGS_REVIEWS_COLLECTION);
  }

  async findByDriverId(driverId: string): Promise<WithId<RatingReview>[]> {
    return await this.findMany({ driver_id: driverId });
  }

  async findByParentId(parentId: string): Promise<WithId<RatingReview>[]> {
    return await this.findMany({ parent_id: parentId });
  }

  async findByTripId(tripId: string): Promise<WithId<RatingReview>[]> {
    return await this.findMany({ trip_id: tripId });
  }

  async findDuplicateRatingReview(
    parentId: string,
    driverId: string,
    tripId?: string,
  ): Promise<WithId<RatingReview> | null> {
    const filter: any = {
      parent_id: parentId,
      driver_id: driverId,
    };

    if (tripId) {
      filter.trip_id = tripId;
    }

    return await this.findOne(filter);
  }

  async getDriverAverageRating(driverId: string): Promise<number> {
    const db = await getDB();
    const result = await db
      .collection(this.collectionName)
      .aggregate([
        { $match: { driver_id: driverId } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
          },
        },
      ])
      .toArray();

    return result.length > 0 ? Number(result[0].averageRating.toFixed(2)) : 0;
  }
}

export const ratingReviewRepository = new RatingReviewRepository();
