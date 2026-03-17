import { deviceTokenRepository } from "@modules/device_token/device-token.repository";
import { isPushEnabled } from "@modules/notification_preferences/notification-preferences.service";
import { NotificationType } from "@shared/constants";
import { BroadcastService } from "@shared/services/broadcast.service";
import { FCMService } from "@shared/services/fcm.service";
import { logger } from "@shared/utils";

import { notificationRepository } from "./notification.repository";

interface StudentInfo {
  studentId: string;
  studentName: string;
}

/**
 * Unified notification dispatcher.
 * Each method does 3 things:
 * 1. Socket.IO event (real-time, app open)
 * 2. FCM push notification (app closed/background)
 * 3. DB notification record (in-app history)
 */
export class NotificationDispatcher {
  /**
   * Core dispatch: saves to DB + sends FCM push.
   * Socket emit is handled separately by each method since payloads differ.
   */
  private static async dispatch(
    userId: string,
    notificationType: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // 1. Save notification to DB
    try {
      await notificationRepository.create({
        user_id: userId,
        notification_type: notificationType,
        title,
        message,
        data,
        is_read: false,
        created_at: new Date(),
      } as any);
    } catch (error) {
      logger.error(
        "[Dispatcher] Failed to save notification to DB:",
        error as Error,
      );
    }

    // 2. Check user's notification preferences
    const pushEnabled = await isPushEnabled(userId);

    if (!pushEnabled) {
      logger.info(
        `[Dispatcher] User ${userId} has push notifications disabled, skipping FCM`,
      );
      return;
    }

    // 3. Send FCM push notification
    try {
      const tokens =
        await deviceTokenRepository.findActiveTokensByUserId(userId);
      logger.info(
        `[Dispatcher] User ${userId} has ${tokens.length} active token(s): ${tokens.map((t) => t.fcm_token.substring(0, 20) + "...").join(", ")}`,
      );
      if (tokens.length > 0) {
        const fcmTokens = tokens.map((t) => t.fcm_token);

        // Convert data values to strings for FCM
        const stringData: Record<string, string> = {
          notification_type: notificationType,
        };
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            stringData[key] =
              typeof value === "string" ? value : JSON.stringify(value);
          });
        }

        const result = await FCMService.sendToDevices(
          fcmTokens,
          title,
          message,
          stringData,
        );

        logger.info(
          `[Dispatcher] FCM result for user ${userId}: ${result.successCount} sent, ${result.failedTokens.length} failed`,
        );

        if (result.failedTokens.length > 0) {
          await deviceTokenRepository.removeInactiveTokens(result.failedTokens);
          logger.info(
            `[Dispatcher] Deactivated ${result.failedTokens.length} stale FCM token(s) for user ${userId}`,
          );
        }
      }
    } catch (error) {
      logger.error("[Dispatcher] Failed to send FCM push:", error as Error);
    }
  }

  // ============================================
  // Single Student Notifications
  // ============================================

  static async notifyParentStudentPicked(
    parentId: string,
    userId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    driverId?: string,
  ): Promise<void> {
    // Socket event (existing behavior)
    BroadcastService.notifyParentStudentPicked(
      parentId,
      tripId,
      studentId,
      studentName,
      driverId,
    );

    // DB save + FCM push
    await this.dispatch(
      userId,
      NotificationType.PICKED_UP,
      "Student Picked Up",
      `Your child ${studentName} has been picked up`,
      { tripId, studentId, studentName, driverId },
    );
  }

  static async notifyParentStudentDropped(
    parentId: string,
    userId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    driverId?: string,
  ): Promise<void> {
    BroadcastService.notifyParentStudentDropped(
      parentId,
      tripId,
      studentId,
      studentName,
      driverId,
    );

    await this.dispatch(
      userId,
      NotificationType.DROPPED,
      "Student Dropped Off",
      `Your child ${studentName} has been dropped off`,
      { tripId, studentId, studentName, driverId },
    );
  }

  static async notifyParentApproaching(
    parentId: string,
    userId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    eta: number,
    driverId?: string,
  ): Promise<void> {
    BroadcastService.notifyParentApproaching(
      parentId,
      tripId,
      studentId,
      studentName,
      eta,
      driverId,
    );

    const etaMinutes = Math.ceil(eta / 60);
    await this.dispatch(
      userId,
      NotificationType.APPROACHING,
      "Driver Approaching",
      `Driver is approaching for ${studentName} - ETA ${etaMinutes} minutes`,
      { tripId, studentId, studentName, eta: String(eta), driverId },
    );
  }

  // ============================================
  // Bulk Student Notifications
  // ============================================

  static async notifyParentStudentsPicked(
    parentId: string,
    userId: string,
    tripId: string,
    students: StudentInfo[],
    driverId?: string,
  ): Promise<void> {
    BroadcastService.notifyParentStudentsPicked(
      parentId,
      tripId,
      students,
      driverId,
    );

    const studentNames = students.map((s) => s.studentName).join(", ");
    const message =
      students.length === 1
        ? `Your child ${studentNames} has been picked up`
        : `Your children ${studentNames} have been picked up`;

    await this.dispatch(
      userId,
      NotificationType.PICKED_UP,
      "Student Picked Up",
      message,
      {
        tripId,
        students,
        driverId,
      },
    );
  }

  static async notifyParentStudentsDropped(
    parentId: string,
    userId: string,
    tripId: string,
    students: StudentInfo[],
    driverId?: string,
  ): Promise<void> {
    BroadcastService.notifyParentStudentsDropped(
      parentId,
      tripId,
      students,
      driverId,
    );

    const studentNames = students.map((s) => s.studentName).join(", ");
    const message =
      students.length === 1
        ? `Your child ${studentNames} has been dropped off`
        : `Your children ${studentNames} have been dropped off`;

    await this.dispatch(
      userId,
      NotificationType.DROPPED,
      "Student Dropped Off",
      message,
      { tripId, students, driverId },
    );
  }

  static async notifyParentRouteRecalculated(
    parentId: string,
    userId: string,
    tripId: string,
    students: StudentInfo[],
    newEtas: { studentId: string; eta: Date }[],
    driverId?: string,
  ): Promise<void> {
    // Emit only to the specific parent to avoid leaking parent-specific ETA/student data
    BroadcastService.notifyParentRouteRecalculated(
      parentId,
      tripId,
      students.map((s) => ({
        studentId: s.studentId,
        studentName: s.studentName,
      })),
      newEtas,
      driverId,
    );

    const studentNames = students.map((s) => s.studentName).join(", ");
    await this.dispatch(
      userId,
      NotificationType.ROUTE_RECALCULATED,
      "Route Updated",
      `Route has been recalculated. Updated ETAs for ${studentNames}`,
      { tripId, students, newEtas, driverId },
    );
  }

  static async notifyParentStudentsAbsent(
    parentId: string,
    userId: string,
    tripId: string,
    students: StudentInfo[],
    driverId?: string,
  ): Promise<void> {
    BroadcastService.notifyParentStudentsAbsent(
      parentId,
      tripId,
      students,
      driverId,
    );

    const studentNames = students.map((s) => s.studentName).join(", ");
    const message =
      students.length === 1
        ? `Your child ${studentNames} was marked absent`
        : `Your children ${studentNames} were marked absent`;

    await this.dispatch(
      userId,
      NotificationType.ABSENT,
      "Student Marked Absent",
      message,
      {
        tripId,
        students,
        driverId,
      },
    );
  }
}
