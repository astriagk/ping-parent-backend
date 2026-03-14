import cron from "node-cron";

import { SubscriptionStatus } from "@shared/constants";

import { parentRepository } from "../../users/parent/parent.repository";
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

      // For each affected parent, check if they have remaining active subscriptions
      for (const parentId of affectedParentIds) {
        const remaining =
          await parentSubscriptionRepository.findAllActiveByParentId(parentId);

        if (remaining.length === 0) {
          // No active subscriptions left — clear parent flags
          const parent = await parentRepository.findOne({
            _id: parentId,
          } as any);
          if (parent) {
            await parentRepository.updateRawByUserId(parent.user_id, {
              $set: {
                has_active_subscription: false,
                subscription_ids: [],
                updated_at: new Date(),
              },
            });
          }
        } else {
          // Update subscription_ids to only include remaining active ones
          const activeIds = remaining.map((s) => String(s._id));
          const parent = await parentRepository.findOne({
            _id: parentId,
          } as any);
          if (parent) {
            await parentRepository.updateRawByUserId(parent.user_id, {
              $set: {
                subscription_ids: activeIds,
                updated_at: new Date(),
              },
            });
          }
        }
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
