import admin from "firebase-admin";
import path from "path";

import { logger } from "@shared/utils";

let firebaseInitialized = false;

export function initializeFirebase(): void {
  if (firebaseInitialized) return;

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    "./environment/firebase-service-account.json";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    logger.info("[FCM] Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error(
      "[FCM] Failed to initialize Firebase Admin SDK:",
      error as Error,
    );
    // Don't crash the server — FCM will be unavailable but app continues
  }
}

export class FCMService {
  /**
   * Send push notification to a single device token
   */
  static async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!firebaseInitialized) {
      logger.warn("[FCM] Firebase not initialized, skipping push notification");
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: { title, body },
        data: data || {},
        android: {
          priority: "high",
          notification: {
            channelId: "ping_parent_notifications",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      return true;
    } catch (error: any) {
      if (
        error.code === "messaging/invalid-registration-token" ||
        error.code === "messaging/registration-token-not-registered"
      ) {
        logger.warn(
          `[FCM] Invalid token, should be removed: ${token.substring(0, 20)}...`,
        );
        return false;
      }
      logger.error("[FCM] Failed to send push notification:", error);
      return false;
    }
  }

  /**
   * Send push notification to multiple device tokens (up to 500 per call)
   */
  static async sendToDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failedTokens: string[] }> {
    if (!firebaseInitialized || tokens.length === 0) {
      return { successCount: 0, failedTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: { title, body },
        data: data || {},
        android: {
          priority: "high",
          notification: {
            channelId: "ping_parent_notifications",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      logger.info(
        `[FCM] Multicast: ${response.successCount} success, ${response.failureCount} failed`,
      );
      return { successCount: response.successCount, failedTokens };
    } catch (error: any) {
      logger.error("[FCM] Multicast send failed:", error as Error);
      return { successCount: 0, failedTokens: tokens };
    }
  }
}
