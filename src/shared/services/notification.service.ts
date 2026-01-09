import { WithId } from "mongodb";

import { notificationRepository } from "@repositories/notification.repository";
import { Notification } from "@shared/types/notification.type";

export const getNotificationsByUserId = async (
  userId: string,
): Promise<WithId<Notification>[]> => {
  return await notificationRepository.findByUserId(userId);
};

export const getUnreadNotificationsByUserId = async (
  userId: string,
): Promise<WithId<Notification>[]> => {
  return await notificationRepository.findUnreadByUserId(userId);
};

export const getUnreadCountByUserId = async (
  userId: string,
): Promise<number> => {
  return await notificationRepository.countUnreadByUserId(userId);
};

export const markNotificationAsRead = async (
  notificationId: string,
): Promise<WithId<Notification> | null> => {
  return await notificationRepository.markAsRead(notificationId);
};

export const markAllNotificationsAsRead = async (
  userId: string,
): Promise<number> => {
  return await notificationRepository.markAllAsReadForUser(userId);
};
