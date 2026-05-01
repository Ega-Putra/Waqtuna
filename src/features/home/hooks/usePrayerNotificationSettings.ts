import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  PrayerNotificationKey,
  PrayerNotificationSettings,
} from '@/services/NotificationService';
import {
  defaultPrayerNotificationSettings,
  getPrayerNotificationSettings,
  setPrayerNotificationSettings,
} from '@/services/PreferenceService';

export function usePrayerNotificationSettings() {
  const [settings, setSettings] = useState<PrayerNotificationSettings>(
    defaultPrayerNotificationSettings
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const storedSettings = await getPrayerNotificationSettings();
    setSettings(storedSettings);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSettings() {
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

    void loadInitialSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings])
  );

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

  const setNotificationsEnabled = useCallback(
    async (isEnabled: boolean) => {
      await persistSettings({
        ...settings,
        isEnabled,
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
      setNotificationsEnabled,
      setPrayerEnabled,
      setReminderMinutes,
    }),
    [isLoading, setNotificationsEnabled, setPrayerEnabled, setReminderMinutes, settings]
  );
}

function sanitizeReminderMinutes(value: unknown) {
  const allowedValues = [5, 10, 15, 30];

  if (typeof value !== 'number' || !allowedValues.includes(value)) {
    return defaultPrayerNotificationSettings.reminderMinutes;
  }

  return value;
}
