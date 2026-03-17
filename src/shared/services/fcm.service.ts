import admin from "firebase-admin";

import { logger } from "@shared/utils";

let firebaseInitialized = false;

export function initializeFirebase(): void {
  if (firebaseInitialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    logger.error(
      "[FCM] Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
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
      logger.warn("[FCM] Firebase not initialized — push skipped.");
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
    if (!firebaseInitialized) {
      logger.warn("[FCM] Firebase not initialized — push skipped.");
      return { successCount: 0, failedTokens: [] };
    }
    if (tokens.length === 0) {
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
