import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  PrayerNotificationKey,
  PrayerNotificationSettings,
} from '@/services/NotificationService';

export const PreferenceStorageKeys = {
  appPreferences: 'waqtuna.app-preferences',
  initialCoordinates: 'waqtuna.initial-coordinates',
  locationRequested: 'waqtuna.location-requested',
  notificationSettings: 'waqtuna.prayer-notification-settings',
  fastingReminderSettings: 'waqtuna.fasting-reminder-settings',
  selectedCityCode: 'waqtuna.selected-city-code',
  onboardingCompleted: 'onboarding:completed',
} as const;

export type ClockFormat = '12h' | '24h';
export type CalculationMethodPreference = 'kemenag' | 'muslimWorldLeague' | 'isna' | 'egypt' | 'karachi';
export type AsrMadhabPreference = 'shafi' | 'hanafi';

export type AppPreferences = {
  clockFormat: ClockFormat;
  calculationMethod: CalculationMethodPreference;
  asrMadhab: AsrMadhabPreference;
};

export type FastingReminderSettings = {
  mondayThursdayEnabled: boolean;
  ayyamulBidhEnabled: boolean;
};

export const defaultPrayerNotificationSettings: PrayerNotificationSettings = {
  isEnabled: true,
  enabledPrayers: {
    subuh: true,
    dzuhur: true,
    ashar: true,
    maghrib: true,
    isya: true,
  },
  reminderMinutes: 5,
};

export const defaultAppPreferences: AppPreferences = {
  clockFormat: '24h',
  calculationMethod: 'kemenag',
  asrMadhab: 'shafi',
};

export const defaultFastingReminderSettings: FastingReminderSettings = {
  mondayThursdayEnabled: false,
  ayyamulBidhEnabled: false,
};

export async function getAppPreferences(): Promise<AppPreferences> {
  const rawValue = await AsyncStorage.getItem(PreferenceStorageKeys.appPreferences);

  return parseAppPreferences(rawValue);
}

export async function setAppPreferences(preferences: AppPreferences): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.appPreferences, JSON.stringify(preferences));
}

export async function updateAppPreferences(
  patch: Partial<AppPreferences>
): Promise<AppPreferences> {
  const preferences = await getAppPreferences();
  const nextPreferences = {
    ...preferences,
    ...patch,
  };

  await setAppPreferences(nextPreferences);

  return nextPreferences;
}

export async function getPrayerNotificationSettings(): Promise<PrayerNotificationSettings> {
  const rawValue = await AsyncStorage.getItem(PreferenceStorageKeys.notificationSettings);

  return parsePrayerNotificationSettings(rawValue);
}

export async function setPrayerNotificationSettings(
  settings: PrayerNotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.notificationSettings, JSON.stringify(settings));
}

export async function updatePrayerNotificationSettings(
  patch: Partial<PrayerNotificationSettings>
): Promise<PrayerNotificationSettings> {
  const settings = await getPrayerNotificationSettings();
  const nextSettings = {
    ...settings,
    ...patch,
    enabledPrayers: {
      ...settings.enabledPrayers,
      ...patch.enabledPrayers,
    },
  };

  await setPrayerNotificationSettings(nextSettings);

  return nextSettings;
}

export async function getFastingReminderSettings(): Promise<FastingReminderSettings> {
  const rawValue = await AsyncStorage.getItem(PreferenceStorageKeys.fastingReminderSettings);

  return parseFastingReminderSettings(rawValue);
}

export async function setFastingReminderSettings(
  settings: FastingReminderSettings
): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.fastingReminderSettings, JSON.stringify(settings));
}

export async function getSelectedCityCode(): Promise<string | null> {
  return AsyncStorage.getItem(PreferenceStorageKeys.selectedCityCode);
}

export async function setSelectedCityCode(code: string): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.selectedCityCode, code);
}

export async function getInitialCoordinates(): Promise<string | null> {
  return AsyncStorage.getItem(PreferenceStorageKeys.initialCoordinates);
}

export async function setInitialCoordinates(rawCoordinates: string): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.initialCoordinates, rawCoordinates);
}

export async function getLocationRequested(): Promise<string | null> {
  return AsyncStorage.getItem(PreferenceStorageKeys.locationRequested);
}

export async function setLocationRequested(value: boolean): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.locationRequested, String(value));
}

export async function getOnboardingCompleted(): Promise<boolean> {
  const rawValue = await AsyncStorage.getItem(PreferenceStorageKeys.onboardingCompleted);

  return rawValue === 'true';
}

export async function setOnboardingCompleted(value: boolean): Promise<void> {
  await AsyncStorage.setItem(PreferenceStorageKeys.onboardingCompleted, String(value));
}

function parseAppPreferences(rawValue: string | null): AppPreferences {
  if (!rawValue) {
    return defaultAppPreferences;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AppPreferences>;

    return {
      clockFormat: isClockFormat(parsed.clockFormat)
        ? parsed.clockFormat
        : defaultAppPreferences.clockFormat,
      calculationMethod: isCalculationMethod(parsed.calculationMethod)
        ? parsed.calculationMethod
        : defaultAppPreferences.calculationMethod,
      asrMadhab: isAsrMadhab(parsed.asrMadhab)
        ? parsed.asrMadhab
        : defaultAppPreferences.asrMadhab,
    };
  } catch {
    return defaultAppPreferences;
  }
}

function parsePrayerNotificationSettings(rawValue: string | null): PrayerNotificationSettings {
  if (!rawValue) {
    return defaultPrayerNotificationSettings;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PrayerNotificationSettings>;

    return {
      isEnabled:
        typeof parsed.isEnabled === 'boolean'
          ? parsed.isEnabled
          : defaultPrayerNotificationSettings.isEnabled,
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

function parseFastingReminderSettings(rawValue: string | null): FastingReminderSettings {
  if (!rawValue) {
    return defaultFastingReminderSettings;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<FastingReminderSettings>;

    return {
      mondayThursdayEnabled:
        typeof parsed.mondayThursdayEnabled === 'boolean'
          ? parsed.mondayThursdayEnabled
          : defaultFastingReminderSettings.mondayThursdayEnabled,
      ayyamulBidhEnabled:
        typeof parsed.ayyamulBidhEnabled === 'boolean'
          ? parsed.ayyamulBidhEnabled
          : defaultFastingReminderSettings.ayyamulBidhEnabled,
    };
  } catch {
    return defaultFastingReminderSettings;
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
  const allowedValues = [5, 10, 15, 30];

  if (typeof value !== 'number' || !allowedValues.includes(value)) {
    return defaultPrayerNotificationSettings.reminderMinutes;
  }

  return value;
}

function isClockFormat(value: unknown): value is ClockFormat {
  return value === '12h' || value === '24h';
}

function isCalculationMethod(value: unknown): value is CalculationMethodPreference {
  return (
    value === 'kemenag' ||
    value === 'muslimWorldLeague' ||
    value === 'isna' ||
    value === 'egypt' ||
    value === 'karachi'
  );
}

function isAsrMadhab(value: unknown): value is AsrMadhabPreference {
  return value === 'shafi' || value === 'hanafi';
}
