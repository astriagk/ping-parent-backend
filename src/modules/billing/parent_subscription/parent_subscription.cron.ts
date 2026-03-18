import cron from "node-cron";

import { SubscriptionStatus } from "@shared/constants";

import { parentSubscriptionRepository } from "./parent_subscription.repository";

/**
 * Expire subscriptions whose end_date has passed.
 * Runs every hour at minute 0.
 */
export const startSubscriptionExpiryCron = (): void => {
  cron.schedule("0 * * * *", async () => {
    try {
      const expired =
        await parentSubscriptionRepository.findExpiredSubscriptions();

      if (expired.length === 0) return;

      console.log(
        `[SubscriptionCron] Found ${expired.length} expired subscription(s). Processing...`,
      );

      // Collect unique parent_ids affected
      const affectedParentIds = new Set<string>();

      for (const subscription of expired) {
        await parentSubscriptionRepository.updateStatusBySubscriptionId(
          String(subscription._id),
          SubscriptionStatus.EXPIRED,
        );
        affectedParentIds.add(subscription.parent_id);
      }

      console.log(
        `[SubscriptionCron] Processed ${expired.length} expired subscription(s) for ${affectedParentIds.size} parent(s).`,
      );
    } catch (error) {
      console.error(
        "[SubscriptionCron] Error processing expired subscriptions:",
        error,
      );
    }
  });

  console.log(
    "[SubscriptionCron] Subscription expiry cron job started (runs every hour).",
  );
};
