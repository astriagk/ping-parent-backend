import { notificationPreferencesRepository } from "./notification-preferences.repository";

export const getPreferences = async (
  userId: string,
): Promise<{ push_enabled: boolean }> => {
  const preferences =
    await notificationPreferencesRepository.findByUserId(userId);

  return {
    push_enabled: preferences?.push_enabled ?? true,
  };
};

export const updatePreferences = async (
  userId: string,
  pushEnabled: boolean,
): Promise<{ push_enabled: boolean }> => {
  await notificationPreferencesRepository.upsertPreferences(
    userId,
    pushEnabled,
  );

  return { push_enabled: pushEnabled };
};

export const isPushEnabled = async (userId: string): Promise<boolean> => {
  const preferences =
    await notificationPreferencesRepository.findByUserId(userId);
  return preferences?.push_enabled ?? true;
};
