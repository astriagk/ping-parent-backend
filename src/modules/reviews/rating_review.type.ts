export interface RatingReview {
  _id?: any;
  parent_id: string;
  driver_id: string;
  trip_id?: string;
  rating: number; // 1-5 stars
  review_text?: string;
  created_at: Date;
  updated_at?: Date;
}
