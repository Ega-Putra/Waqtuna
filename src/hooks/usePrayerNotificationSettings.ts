import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  PrayerNotificationKey,
  PrayerNotificationSettings,
} from '@/src/services/NotificationService';

const PRAYER_NOTIFICATION_SETTINGS_KEY = 'waqtuna.prayer-notification-settings';

export const defaultPrayerNotificationSettings: PrayerNotificationSettings = {
  enabledPrayers: {
    subuh: true,
    dzuhur: true,
    ashar: true,
    maghrib: true,
    isya: true,
  },
  reminderMinutes: 0,
};

export function usePrayerNotificationSettings() {
  const [settings, setSettings] = useState<PrayerNotificationSettings>(
    defaultPrayerNotificationSettings
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const storedValue = await AsyncStorage.getItem(PRAYER_NOTIFICATION_SETTINGS_KEY);
        const parsedSettings = parseSettings(storedValue);

        if (isMounted) {
          setSettings(parsedSettings);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSettings = useCallback(async (nextSettings: PrayerNotificationSettings) => {
    setSettings(nextSettings);
    await AsyncStorage.setItem(PRAYER_NOTIFICATION_SETTINGS_KEY, JSON.stringify(nextSettings));
  }, []);

  const setPrayerEnabled = useCallback(
    async (prayer: PrayerNotificationKey, isEnabled: boolean) => {
      await persistSettings({
        ...settings,
        enabledPrayers: {
          ...settings.enabledPrayers,
          [prayer]: isEnabled,
        },
      });
    },
    [persistSettings, settings]
  );

  const setReminderMinutes = useCallback(
    async (minutes: number) => {
      await persistSettings({
        ...settings,
        reminderMinutes: sanitizeReminderMinutes(minutes),
      });
    },
    [persistSettings, settings]
  );

  return useMemo(
    () => ({
      settings,
      isLoading,
      setPrayerEnabled,
      setReminderMinutes,
    }),
    [isLoading, setPrayerEnabled, setReminderMinutes, settings]
  );
}

function parseSettings(rawValue: string | null): PrayerNotificationSettings {
  if (!rawValue) {
    return defaultPrayerNotificationSettings;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PrayerNotificationSettings>;

    return {
      enabledPrayers: {
        ...defaultPrayerNotificationSettings.enabledPrayers,
        ...parseEnabledPrayers(parsed.enabledPrayers),
      },
      reminderMinutes: sanitizeReminderMinutes(parsed.reminderMinutes),
    };
  } catch {
    return defaultPrayerNotificationSettings;
  }
}

function parseEnabledPrayers(
  value: Partial<Record<PrayerNotificationKey, boolean>> | undefined
) {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, isEnabled]) => typeof isEnabled === 'boolean')
  ) as Partial<Record<PrayerNotificationKey, boolean>>;
}

function sanitizeReminderMinutes(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return defaultPrayerNotificationSettings.reminderMinutes;
  }

  return Math.max(0, Math.floor(value));
}
