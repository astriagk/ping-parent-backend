import { WithId } from "mongodb";

import { DeviceType } from "@shared/constants/enums";

import { deviceTokenRepository } from "./device-token.repository";
import { DeviceToken } from "./device-token.type";

export const registerToken = async (
  userId: string,
  role: string,
  fcmToken: string,
  deviceType: DeviceType,
  deviceId: string,
): Promise<WithId<DeviceToken>> => {
  return await deviceTokenRepository.upsertToken(
    userId,
    role,
    fcmToken,
    deviceType,
    deviceId,
  );
};

export const removeToken = async (fcmToken: string): Promise<boolean> => {
  return await deviceTokenRepository.deactivateToken(fcmToken);
};

export const getActiveTokensByUserId = async (
  userId: string,
): Promise<WithId<DeviceToken>[]> => {
  return await deviceTokenRepository.findActiveTokensByUserId(userId);
};

export const deactivateAllForUser = async (userId: string): Promise<void> => {
  return await deviceTokenRepository.deactivateAllForUser(userId);
};

export const removeInactiveTokens = async (
  fcmTokens: string[],
): Promise<void> => {
  return await deviceTokenRepository.removeInactiveTokens(fcmTokens);
};
