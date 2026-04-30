import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  PrayerNotificationKey,
  PrayerNotificationSettings,
} from '@/src/services/NotificationService';
import {
  defaultPrayerNotificationSettings,
  getPrayerNotificationSettings,
  setPrayerNotificationSettings,
} from '@/src/services/PreferenceService';

export function usePrayerNotificationSettings() {
  const [settings, setSettings] = useState<PrayerNotificationSettings>(
    defaultPrayerNotificationSettings
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const storedSettings = await getPrayerNotificationSettings();

        if (isMounted) {
          setSettings(storedSettings);
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
    await setPrayerNotificationSettings(nextSettings);
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

function sanitizeReminderMinutes(value: unknown) {
  const allowedValues = [5, 10, 15, 30];

  if (typeof value !== 'number' || !allowedValues.includes(value)) {
    return defaultPrayerNotificationSettings.reminderMinutes;
  }

  return value;
}
