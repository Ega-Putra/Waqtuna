import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { toHijri } from 'hijri-date/lib/safe.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePrayerNotificationSettings } from '@/features/home/hooks/usePrayerNotificationSettings';
import { rescheduleAll, type PrayerNotificationKey } from '@/services/NotificationService';
import {
  getDailyChecklist,
  getDailyProgress,
  getStreak,
  togglePrayer,
  type DailyProgress,
  type PrayerChecklist,
} from '@/services/PrayerChecklistService';
import {
  defaultAppPreferences,
  getAppPreferences,
  type AppPreferences,
} from '@/services/PreferenceService';
import {
  sunnahPrayerDefinitions,
  SunnahReminderService,
  type SunnahPrayerKey,
} from '@/services/SunnahReminderService';
import { SkeletonBox } from '@/shared/components/feedback/SkeletonBox';
import { type IndonesiaCity } from '@/shared/constants/indonesia-cities';
import {
  defaultIndonesiaCity,
  getInitialLocationState,
  persistSelectedCityCode,
  searchIndonesiaCities,
} from '@/shared/utils/location';
import { getPrayerSchedule, type PrayerScheduleItem } from '@/shared/utils/prayer';
import { getCalendarDateParts } from '@/shared/utils/time';
import { colors, radius, shadows, spacing, typography } from '@/theme';

const STREAK_DOT_COUNT = 8;
const sunnahReminderStorageKey = 'sunnah:reminders';
const sunnahEnabledStorageKey = 'sunnah:enabled';
const sunnahChecklistStorageKeyPrefix = 'sunnah:checklist';

type SunnahPrayerItem = {
  key: `sunnah-${SunnahPrayerKey}`;
  sunnahKey: SunnahPrayerKey;
  name: string;
  time: string;
  time24h: string;
  reminderType: 'sunnah';
};

type ReminderListItem = PrayerScheduleItem | SunnahPrayerItem;

const prayerVisuals: Record<
  PrayerScheduleItem['key'],
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    notificationKey: PrayerNotificationKey;
  }
> = {
  fajr: {
    icon: 'weather-sunset-up',
    notificationKey: 'subuh',
  },
  dhuhr: {
    icon: 'white-balance-sunny',
    notificationKey: 'dzuhur',
  },
  asr: {
    icon: 'weather-partly-cloudy',
    notificationKey: 'ashar',
  },
  maghrib: {
    icon: 'weather-night-partly-cloudy',
    notificationKey: 'maghrib',
  },
  isha: {
    icon: 'moon-waning-crescent',
    notificationKey: 'isya',
  },
};

function PrayerReminderRow({
  prayer,
  isChecked,
  isNotificationEnabled,
  onToggle,
  onToggleNotification,
}: {
  prayer: PrayerScheduleItem;
  isChecked: boolean;
  isNotificationEnabled: boolean;
  onToggle: () => void;
  onToggleNotification: () => void;
}) {
  const iconName = prayerVisuals[prayer.key].icon;

  return (
    <View style={[styles.reminderItem, isChecked && styles.reminderItemChecked]}>
      <View style={styles.reminderInfo}>
        <View style={styles.reminderIconWrap}>
          <MaterialCommunityIcons name={iconName} size={28} color="#FFFFFF" />
        </View>

        <View style={styles.reminderCopy}>
          <Text style={styles.reminderPrayerName}>{prayer.name}</Text>
          <Text style={styles.reminderPrayerTime}>{prayer.time}</Text>
        </View>
      </View>

      <View style={styles.reminderActions}>
        <Pressable
          style={[
            styles.notificationButton,
            isNotificationEnabled && styles.notificationButtonActive,
          ]}
          onPress={onToggleNotification}
          accessibilityRole="button"
          accessibilityLabel={`Atur notifikasi sholat ${prayer.name}`}>
          <MaterialCommunityIcons
            name={isNotificationEnabled ? 'bell-ring-outline' : 'bell-off-outline'}
            size={22}
            color={isNotificationEnabled ? colors.primary : '#FFFFFF'}
          />
        </Pressable>

        <Pressable
          style={[styles.reminderCheckButton, isChecked && styles.reminderCheckButtonChecked]}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`Tandai sholat ${prayer.name}`}>
          <MaterialIcons
            name="check"
            size={20}
            color={isChecked ? colors.primary : 'rgba(255,255,255,0.7)'}
          />
        </Pressable>
      </View>
    </View>
  );
}

function SunnahReminderRow({
  prayer,
  isChecked,
  isNotificationEnabled,
  onToggle,
  onToggleNotification,
}: {
  prayer: SunnahPrayerItem;
  isChecked: boolean;
  isNotificationEnabled: boolean;
  onToggle: () => void;
  onToggleNotification: () => void;
}) {
  return (
    <View style={[styles.sunnahReminderItem, isChecked && styles.sunnahReminderItemChecked]}>
      <View style={styles.reminderInfo}>
        <View style={styles.sunnahReminderIconWrap}>
          <MaterialCommunityIcons name="star-crescent" size={26} color={colors.primary} />
        </View>

        <View style={styles.reminderCopy}>
          <View style={styles.sunnahNameRow}>
            <Text style={styles.sunnahPrayerName}>{prayer.name}</Text>
            <Text style={styles.sunnahBadge}>Sunnah</Text>
          </View>
          <Text style={styles.sunnahPrayerTime}>{prayer.time}</Text>
        </View>
      </View>

      <View style={styles.reminderActions}>
        <Pressable
          style={[
            styles.sunnahNotificationButton,
            isNotificationEnabled && styles.sunnahNotificationButtonActive,
          ]}
          onPress={onToggleNotification}
          accessibilityRole="button"
          accessibilityLabel={`Atur notifikasi sholat sunnah ${prayer.name}`}>
          <MaterialCommunityIcons
            name={isNotificationEnabled ? 'bell-ring-outline' : 'bell-off-outline'}
            size={22}
            color={isNotificationEnabled ? colors.primary : '#69736B'}
          />
        </Pressable>

        <Pressable
          style={[
            styles.sunnahCheckButton,
            isChecked && styles.sunnahCheckButtonChecked,
          ]}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`Tandai sholat sunnah ${prayer.name}`}>
          <MaterialIcons
            name="check"
            size={20}
            color={isChecked ? '#FFFFFF' : '#97A6A0'}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { gregorianDate, hijriDate } = getCalendarDateParts();
  const {
    settings: notificationSettings,
    isLoading: isNotificationSettingsLoading,
    setNotificationsEnabled,
    setPrayerEnabled,
  } = usePrayerNotificationSettings();
  const [selectedCity, setSelectedCity] = useState<IndonesiaCity>(defaultIndonesiaCity);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prayerChecklist, setPrayerChecklist] = useState<PrayerChecklist>({});
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({ checked: 0, total: 5 });
  const [streak, setStreak] = useState(0);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [preferences, setPreferences] = useState<AppPreferences>(defaultAppPreferences);
  const [enabledSunnahKeys, setEnabledSunnahKeys] = useState<SunnahPrayerKey[]>([]);
  const [sunnahReminderKeys, setSunnahReminderKeys] = useState<SunnahPrayerKey[]>([]);
  const [sunnahChecklist, setSunnahChecklist] = useState<Partial<Record<SunnahPrayerKey, boolean>>>({});
  const [schedule, setSchedule] = useState(() =>
    getPrayerSchedule(
      {
        latitude: defaultIndonesiaCity.latitude,
        longitude: defaultIndonesiaCity.longitude,
      },
      new Date(),
      {
        clockFormat: defaultAppPreferences.clockFormat,
      }
    )
  );

  const refreshChecklistState = useCallback(async () => {
    const today = new Date();
    const [checklist, progress, currentStreak] = await Promise.all([
      getDailyChecklist(today),
      getDailyProgress(today),
      getStreak(today),
    ]);

    setPrayerChecklist(checklist);
    setDailyProgress(progress);
    setStreak(currentStreak);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialState() {
      try {
        const [
          initialLocation,
          storedPreferences,
          storedSunnahKeys,
          storedSunnahReminderKeys,
          storedSunnahChecklist,
        ] = await Promise.all([
          getInitialLocationState(),
          getAppPreferences(),
          getStoredEnabledSunnahKeys(),
          getStoredSunnahReminderKeys(),
          getStoredSunnahChecklist(),
        ]);

        if (!isMounted) {
          return;
        }

        setSelectedCity(initialLocation.city);
        setPreferences(storedPreferences);
        setEnabledSunnahKeys(storedSunnahKeys);
        setSunnahReminderKeys(storedSunnahReminderKeys);
        setSunnahChecklist(storedSunnahChecklist);
        setSchedule(
          getPrayerSchedule(
            {
              latitude: initialLocation.city.latitude,
              longitude: initialLocation.city.longitude,
            },
            new Date(),
            {
              clockFormat: storedPreferences.clockFormat,
            }
          )
        );
        setLocationError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSelectedCity(defaultIndonesiaCity);
        setPreferences(defaultAppPreferences);
        setEnabledSunnahKeys([]);
        setSunnahReminderKeys([]);
        setSunnahChecklist({});
        setSchedule(
          getPrayerSchedule(
            {
              latitude: defaultIndonesiaCity.latitude,
              longitude: defaultIndonesiaCity.longitude,
            },
            new Date(),
            {
              clockFormat: defaultAppPreferences.clockFormat,
            }
          )
        );
        setLocationError('Lokasi tidak bisa dimuat. Jadwal memakai kota default Surabaya.');
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    void loadInitialState();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function syncOnFocus() {
        try {
          const [
            nextLocation,
            nextPreferences,
            nextSunnahKeys,
            nextSunnahReminderKeys,
            nextSunnahChecklist,
          ] = await Promise.all([
            getInitialLocationState(),
            getAppPreferences(),
            getStoredEnabledSunnahKeys(),
            getStoredSunnahReminderKeys(),
            getStoredSunnahChecklist(),
          ]);

          if (!isActive) {
            return;
          }

          setSelectedCity(nextLocation.city);
          setPreferences(nextPreferences);
          setEnabledSunnahKeys(nextSunnahKeys);
          setSunnahReminderKeys(nextSunnahReminderKeys);
          setSunnahChecklist(nextSunnahChecklist);
          setSchedule(
            getPrayerSchedule(
              {
                latitude: nextLocation.city.latitude,
                longitude: nextLocation.city.longitude,
              },
              new Date(),
              {
                clockFormat: nextPreferences.clockFormat,
              }
            )
          );
          await refreshChecklistState();
          setLocationError(null);
        } catch {
          if (!isActive) {
            return;
          }

          setPreferences(defaultAppPreferences);
          setLocationError('Lokasi tidak bisa dimuat. Jadwal memakai kota default Surabaya.');
        }
      }

      void syncOnFocus();

      return () => {
        isActive = false;
      };
    }, [refreshChecklistState])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSchedule(
        getPrayerSchedule(
          {
            latitude: selectedCity.latitude,
            longitude: selectedCity.longitude,
          },
          new Date(),
          {
            clockFormat: preferences.clockFormat,
          }
        )
      );
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [
    preferences.clockFormat,
    selectedCity,
  ]);

  useEffect(() => {
    let isActive = true;
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadChecklist() {
      if (isActive) {
        await refreshChecklistState();
        setSunnahChecklist(await getStoredSunnahChecklist());
      }
    }

    function scheduleNextChecklistReset() {
      midnightTimer = setTimeout(() => {
        void loadChecklist();
        scheduleNextChecklistReset();
      }, getMillisecondsUntilNextMidnight());
    }

    void loadChecklist();
    scheduleNextChecklistReset();

    return () => {
      isActive = false;

      if (midnightTimer) {
        clearTimeout(midnightTimer);
      }
    };
  }, [refreshChecklistState]);

  useEffect(() => {
    if (isBootstrapping || isNotificationSettingsLoading) {
      return;
    }

    let isActive = true;
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    async function scheduleNotifications() {
      const currentSchedule = getPrayerSchedule(
        {
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
        },
        new Date(),
        {
          clockFormat: preferences.clockFormat,
        }
      );

      await rescheduleAll(currentSchedule.prayers, notificationSettings);
    }

    function scheduleNextMidnightRefresh() {
      midnightTimer = setTimeout(() => {
        if (!isActive) {
          return;
        }

        void scheduleNotifications();
        scheduleNextMidnightRefresh();
      }, getMillisecondsUntilNextMidnight());
    }

    void scheduleNotifications();
    scheduleNextMidnightRefresh();

    return () => {
      isActive = false;

      if (midnightTimer) {
        clearTimeout(midnightTimer);
      }
    };
  }, [
    isBootstrapping,
    isNotificationSettingsLoading,
    notificationSettings,
    preferences.clockFormat,
    selectedCity,
  ]);

  const filteredCities = searchIndonesiaCities(cityQuery);

  async function handleSelectCity(city: IndonesiaCity) {
    setSelectedCity(city);
    setSchedule(
      getPrayerSchedule(
        {
          latitude: city.latitude,
          longitude: city.longitude,
        },
        new Date(),
        {
          clockFormat: preferences.clockFormat,
        }
      )
    );
    setIsLocationPickerVisible(false);
    setCityQuery('');
    setLocationError(null);
    await persistSelectedCityCode(city.code);
  }

  async function handleTogglePrayer(prayerName: string) {
    const today = new Date();
    const nextChecklist = await togglePrayer(today, prayerName);
    const [progress, currentStreak] = await Promise.all([
      getDailyProgress(today),
      getStreak(today),
    ]);

    setPrayerChecklist(nextChecklist);
    setDailyProgress(progress);
    setStreak(currentStreak);
  }

  async function handleTogglePrayerNotification(prayerKey: PrayerScheduleItem['key']) {
    const notificationKey = prayerVisuals[prayerKey].notificationKey;
    const currentValue = notificationSettings.enabledPrayers[notificationKey];
    const nextValue = !currentValue;

    if (nextValue && !notificationSettings.isEnabled) {
      await setNotificationsEnabled(true);
    }

    await setPrayerEnabled(notificationKey, nextValue);
  }

  function handleToggleSunnahReminder(sunnahKey: SunnahPrayerKey) {
    const nextReminderKeys = sunnahReminderKeys.includes(sunnahKey)
      ? sunnahReminderKeys.filter((key) => key !== sunnahKey)
      : [...sunnahReminderKeys, sunnahKey];

    setSunnahReminderKeys(nextReminderKeys);
    void persistAndScheduleSunnahReminders(nextReminderKeys, schedule);
  }

  function handleToggleSunnahChecklist(sunnahKey: SunnahPrayerKey) {
    const nextChecklist = {
      ...sunnahChecklist,
      [sunnahKey]: !sunnahChecklist[sunnahKey],
    };

    setSunnahChecklist(nextChecklist);
    void persistSunnahChecklist(nextChecklist);
  }

  const progressPercentage =
    dailyProgress.total > 0 ? (dailyProgress.checked / dailyProgress.total) * 100 : 0;
  const nextPrayerTimeDisplay = schedule.nextPrayerHeroTime;
  const countdownLabel = formatCountdownLabel(schedule.countdownText);
  const locationLabel = useMemo(
    () => formatLocationLabel(selectedCity),
    [selectedCity]
  );
  const reminderItems = useMemo(
    () => getCombinedReminderItems(schedule.prayers, enabledSunnahKeys, preferences.clockFormat),
    [enabledSunnahKeys, preferences.clockFormat, schedule]
  );
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.appTitle}>Waqtuna</Text>

        <View style={styles.topSection}>
          <View style={styles.overviewRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.gregorianDate}>{gregorianDate}</Text>
              <Text style={styles.hijriDate}>{hijriDate}</Text>

              <Pressable
                style={styles.locationChip}
                onPress={() => setIsLocationPickerVisible(true)}
                accessibilityRole="button">
                <Ionicons name="location-sharp" size={16} color="#FFFFFF" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
              </Pressable>
            </View>

            <View style={styles.streakCard}>
              <View style={styles.streakPill}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakPillText}>{streak} Hari Beruntun</Text>
              </View>

              <View style={styles.streakDotsRow}>
                {Array.from({ length: STREAK_DOT_COUNT }).map((_, index) => {
                  const isComplete =
                    index >= STREAK_DOT_COUNT - Math.min(streak, STREAK_DOT_COUNT);

                  return (
                    <View
                      key={index}
                      style={[
                        styles.streakDot,
                        isComplete && styles.streakDotComplete,
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  {dailyProgress.checked} dari {dailyProgress.total} Sholat
                </Text>
                <Text style={styles.progressValue}>{Math.round(progressPercentage)}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {locationError ? (
          <View style={styles.locationErrorCard}>
            <View style={styles.locationErrorHeader}>
              <MaterialIcons name="location-off" size={22} color="#B42318" />
              <Text style={styles.locationErrorTitle}>Tidak bisa mendeteksi lokasi</Text>
            </View>
            <Text style={styles.locationErrorText}>{locationError}</Text>
            <Pressable
              style={styles.locationErrorButton}
              onPress={() => setIsLocationPickerVisible(true)}
              accessibilityRole="button">
              <Text style={styles.locationErrorButtonText}>Pilih Kota Manual</Text>
            </Pressable>
          </View>
        ) : null}

        {isBootstrapping ? (
          <NextPrayerSkeleton />
        ) : (
          <View style={styles.nextPrayerCard}>
            <View style={styles.nextPrayerCircle} />

            <View style={styles.nextPrayerContent}>
              <Text style={styles.nextPrayerName}>{schedule.nextPrayerName}</Text>
              <Text style={styles.nextPrayerTime}>{nextPrayerTimeDisplay}</Text>

              <View style={styles.countdownRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.countdownText}>{countdownLabel}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.reminderSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pengingat Ibadah</Text>
            <Pressable
              style={styles.moreAction}
              onPress={() => router.push('/sunnah-prayers' as never)}
              accessibilityRole="button"
              accessibilityLabel="Buka daftar sholat sunnah">
              <Text style={styles.moreActionText}>Lebih Banyak</Text>
              <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
            </Pressable>
          </View>

          {isBootstrapping ? (
            <ReminderListSkeleton />
          ) : (
            <View style={styles.reminderList}>
              {reminderItems.map((item) => {
                if (isSunnahReminderItem(item)) {
                  return (
                    <SunnahReminderRow
                      key={item.key}
                      prayer={item}
                      isChecked={Boolean(sunnahChecklist[item.sunnahKey])}
                      isNotificationEnabled={sunnahReminderKeys.includes(item.sunnahKey)}
                      onToggle={() => handleToggleSunnahChecklist(item.sunnahKey)}
                      onToggleNotification={() => handleToggleSunnahReminder(item.sunnahKey)}
                    />
                  );
                }

                return (
                  <PrayerReminderRow
                    key={item.key}
                    prayer={item}
                    isChecked={Boolean(prayerChecklist[item.name])}
                    isNotificationEnabled={
                      notificationSettings.isEnabled &&
                      notificationSettings.enabledPrayers[
                      prayerVisuals[item.key].notificationKey
                      ]
                    }
                    onToggle={() => void handleTogglePrayer(item.name)}
                    onToggleNotification={() =>
                      void handleTogglePrayerNotification(item.key)
                    }
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isLocationPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLocationPickerVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsLocationPickerVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Pilih Kota/Kabupaten</Text>
          <TextInput
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder="Cari kota atau kabupaten"
            placeholderTextColor="#7C847D"
            style={styles.searchInput}
          />

          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.cityList}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedCity.code;

              return (
                <Pressable
                  style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                  onPress={() => void handleSelectCity(item)}>
                  <View style={styles.cityItemTextWrap}>
                    <Text style={styles.cityItemName}>{item.city}</Text>
                    <Text style={styles.cityItemProvince}>{item.province}</Text>
                  </View>
                  {isSelected ? (
                    <MaterialIcons name="check-circle" size={22} color="#007322" />
                  ) : (
                    <MaterialIcons name="chevron-right" size={22} color="#6B726C" />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatLocationLabel(city: IndonesiaCity) {
  const sanitized = city.city
    .replace(/^Kabupaten\s+/i, '')
    .replace(/^Kota\s+/i, '')
    .trim();

  return `${sanitized}, Idn`;
}

async function getStoredEnabledSunnahKeys(): Promise<SunnahPrayerKey[]> {
  const rawValue = await AsyncStorage.getItem(sunnahEnabledStorageKey);

  if (!rawValue) {
    return getStoredSunnahReminderKeys();
  }

  return parseStoredSunnahKeys(rawValue);
}

async function getStoredSunnahReminderKeys(): Promise<SunnahPrayerKey[]> {
  const rawValue = await AsyncStorage.getItem(sunnahReminderStorageKey);

  if (!rawValue) {
    return [];
  }

  return parseStoredSunnahKeys(rawValue);
}

function parseStoredSunnahKeys(rawValue: string): SunnahPrayerKey[] {
  try {
    const parsed = JSON.parse(rawValue) as unknown;

    return getEnabledKeysFromParsedValue(parsed);
  } catch {
    return [];
  }
}

function getEnabledKeysFromParsedValue(parsed: unknown): SunnahPrayerKey[] {
  if (Array.isArray(parsed)) {
    return parsed.filter(isSunnahPrayerKey);
  }

  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed)
      .filter((entry): entry is [SunnahPrayerKey, boolean] => (
        isSunnahPrayerKey(entry[0]) && entry[1] === true
      ))
      .map(([key]) => key);
  }

  return [];
}

async function getStoredSunnahChecklist(): Promise<Partial<Record<SunnahPrayerKey, boolean>>> {
  const rawValue = await AsyncStorage.getItem(getSunnahChecklistStorageKey());

  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [SunnahPrayerKey, boolean] => (
          isSunnahPrayerKey(entry[0]) && typeof entry[1] === 'boolean'
        )
      )
    ) as Partial<Record<SunnahPrayerKey, boolean>>;
  } catch {
    return {};
  }
}

async function persistSunnahChecklist(
  checklist: Partial<Record<SunnahPrayerKey, boolean>>
) {
  try {
    await AsyncStorage.setItem(getSunnahChecklistStorageKey(), JSON.stringify(checklist));
  } catch (error) {
    console.warn('Failed to persist sunnah prayer checklist', error);
  }
}

async function persistAndScheduleSunnahReminders(
  enabledKeys: SunnahPrayerKey[],
  currentSchedule: ReturnType<typeof getPrayerSchedule>
) {
  try {
    await AsyncStorage.setItem(
      sunnahReminderStorageKey,
      JSON.stringify(createSunnahReminderMap(enabledKeys))
    );
    await SunnahReminderService.scheduleAll(enabledKeys, currentSchedule);
  } catch (error) {
    console.warn('Failed to persist sunnah prayer reminders', error);
  }
}

function createSunnahReminderMap(keys: SunnahPrayerKey[]) {
  return Object.fromEntries(keys.map((key) => [key, true])) as Partial<
    Record<SunnahPrayerKey, boolean>
  >;
}

function getSunnahChecklistStorageKey(date = new Date()) {
  return `${sunnahChecklistStorageKeyPrefix}:${formatDateKey(date)}`;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCombinedReminderItems(
  prayers: PrayerScheduleItem[],
  enabledSunnahKeys: SunnahPrayerKey[],
  clockFormat: AppPreferences['clockFormat']
): ReminderListItem[] {
  const sunnahItems = getEnabledSunnahSchedule(enabledSunnahKeys, prayers, clockFormat);

  return [...prayers, ...sunnahItems].sort((first, second) =>
    compareTime(first.time24h, second.time24h)
  );
}

function getEnabledSunnahSchedule(
  enabledSunnahKeys: SunnahPrayerKey[],
  prayers: PrayerScheduleItem[],
  clockFormat: AppPreferences['clockFormat']
): SunnahPrayerItem[] {
  const enabledSet = new Set(enabledSunnahKeys);
  const today = new Date();
  const fajr = findPrayerDate(prayers, 'fajr', today);
  const dhuhr = findPrayerDate(prayers, 'dhuhr', today);
  const asr = findPrayerDate(prayers, 'asr', today);
  const maghrib = findPrayerDate(prayers, 'maghrib', today);
  const isha = findPrayerDate(prayers, 'isha', today);
  const isRamadhan = isRamadhanToday();
  const dates: Partial<Record<SunnahPrayerKey, Date | null>> = {
    tahajud: setTime(today, 2, 30),
    'subuh-qobliyah': fajr ? addMinutes(fajr, -15) : null,
    dhuha: fajr ? addMinutes(fajr, 90) : null,
    'dzuhur-qobliyah': dhuhr ? addMinutes(dhuhr, -30) : null,
    'dzuhur-badiyah': dhuhr ? addMinutes(dhuhr, 15) : null,
    'ashar-qobliyah': asr ? addMinutes(asr, -30) : null,
    'maghrib-badiyah': maghrib ? addMinutes(maghrib, 15) : null,
    'isya-badiyah': isha ? addMinutes(isha, 15) : null,
    tarawih: isRamadhan && maghrib ? addMinutes(maghrib, 60) : null,
    witir: setTime(today, 3, 0),
  };

  return sunnahPrayerDefinitions.flatMap((definition) => {
    if (!enabledSet.has(definition.key) || (definition.key === 'tarawih' && !isRamadhan)) {
      return [];
    }

    const date = dates[definition.key];

    if (!date) {
      return [];
    }

    return [
      {
        key: `sunnah-${definition.key}`,
        sunnahKey: definition.key,
        name: definition.name,
        time: formatReminderTime(date, clockFormat),
        time24h: formatReminderTime(date, '24h'),
        reminderType: 'sunnah' as const,
      },
    ];
  });
}

function isSunnahReminderItem(item: ReminderListItem): item is SunnahPrayerItem {
  return 'reminderType' in item && item.reminderType === 'sunnah';
}

function isSunnahPrayerKey(value: unknown): value is SunnahPrayerKey {
  return sunnahPrayerDefinitions.some((item) => item.key === value);
}

function isRamadhanToday() {
  try {
    return toHijri(new Date()).getMonth() === 9;
  } catch {
    return false;
  }
}

function findPrayerDate(
  prayers: PrayerScheduleItem[],
  key: PrayerScheduleItem['key'],
  date: Date
) {
  const prayer = prayers.find((item) => item.key === key);

  return prayer ? createPrayerDate(prayer.time24h, date) : null;
}

function createPrayerDate(time: string, baseDate: Date) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const date = new Date(baseDate);

  date.setHours(Number.isFinite(hour) ? hour : 0, Number.isFinite(minute) ? minute : 0, 0, 0);

  return date;
}

function setTime(date: Date, hour: number, minute: number) {
  const nextDate = new Date(date);

  nextDate.setHours(hour, minute, 0, 0);

  return nextDate;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function compareTime(firstTime: string, secondTime: string) {
  return parseTimeMinutes(firstTime) - parseTimeMinutes(secondTime);
}

function parseTimeMinutes(time: string) {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

function formatReminderTime(date: Date, clockFormat: AppPreferences['clockFormat']) {
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');

  if (clockFormat === '12h') {
    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;

    return `${String(normalizedHour).padStart(2, '0')}:${minute} ${period}`;
  }

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function getMillisecondsUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);

  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 5, 0);

  return nextMidnight.getTime() - now.getTime();
}

function formatCountdownLabel(value: string) {
  const [prefix, prayerName] = value.split(' hingga ');

  if (!prayerName) {
    return value;
  }

  return `${prefix} hingga ${prayerName.toLowerCase()}`;
}

function NextPrayerSkeleton() {
  return (
    <View style={styles.nextPrayerCard}>
      <View style={styles.nextPrayerCircle} />
      <View style={styles.nextPrayerContent}>
        <SkeletonBox width={120} height={26} borderRadius={8} style={styles.skeletonOnGreen} />
        <SkeletonBox width={160} height={58} borderRadius={12} style={styles.skeletonOnGreen} />
        <SkeletonBox width={170} height={20} borderRadius={10} style={styles.skeletonOnGreen} />
      </View>
    </View>
  );
}

function ReminderListSkeleton() {
  return (
    <View style={styles.reminderList}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.reminderItem}>
          <View style={styles.reminderInfo}>
            <SkeletonBox
              width={48}
              height={48}
              borderRadius={999}
              style={styles.skeletonCircle}
            />
            <View style={styles.skeletonReminderCopy}>
              <SkeletonBox width={96} height={22} borderRadius={8} />
              <SkeletonBox width={54} height={18} borderRadius={8} />
            </View>
          </View>
          <View style={styles.reminderActions}>
            <SkeletonBox width={28} height={28} borderRadius={10} />
            <SkeletonBox width={34} height={34} borderRadius={999} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  container: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  appTitle: {
    color: colors.primary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: typography.fontWeightBold,
    textAlign: 'center',
    marginBottom: 18,
  },
  topSection: {
    paddingHorizontal: spacing.lg,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dateColumn: {
    flex: 1,
    paddingTop: 6,
  },
  gregorianDate: {
    color: 'black',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: typography.fontWeightExtraBold,
  },
  hijriDate: {
    color: '#5E636A',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: typography.fontWeightRegular,
    marginTop: 4,
  },
  locationChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00813A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: spacing.sm,
    maxWidth: '100%',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: typography.fontWeightMedium,
    maxWidth: 130,
  },
  streakCard: {
    width: 152,
    alignItems: 'stretch',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: radius.full,
    paddingHorizontal: 13,
    paddingVertical: 7,
    ...shadows.sm,
  },
  streakEmoji: {
    fontSize: 14,
    lineHeight: 20,
  },
  streakPillText: {
    color: '#C2410C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: typography.fontWeightBold,
  },
  streakDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#47AC5E',
    backgroundColor: 'transparent',
  },
  streakDotComplete: {
    backgroundColor: '#00813A',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  progressLabel: {
    color: '#000000',
    fontSize: 10,
    lineHeight: 20,
    fontWeight: typography.fontWeightBold,
  },
  progressValue: {
    color: '#000000',
    fontSize: 10,
    lineHeight: 20,
    fontWeight: typography.fontWeightBold,
  },
  progressTrack: {
    height: 3,
    borderRadius: radius.full,
    backgroundColor: '#47AC5E',
    borderWidth: 1,
    borderColor: '#00813A',
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: '#00813A',
  },
  locationErrorCard: {
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  locationErrorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  locationErrorTitle: {
    color: '#7A271A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: typography.fontWeightExtraBold,
  },
  locationErrorText: {
    color: '#7A4E00',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: typography.fontWeightSemiBold,
  },
  locationErrorButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  locationErrorButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: typography.fontWeightExtraBold,
  },
  nextPrayerCard: {
    height: 159,
    backgroundColor: '#00813A',
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    position: 'relative',
  },
  nextPrayerCircle: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 999,
    right: -20,
    top: -50,
    backgroundColor: '#47B35E',
  },
  nextPrayerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  nextPrayerName: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: typography.fontWeightExtraBold,
  },
  nextPrayerTime: {
    color: '#FFFFFF',
    fontSize: 52,
    lineHeight: 56,
    fontWeight: typography.fontWeightExtraBold,
    marginTop: spacing.xs,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: typography.fontWeightRegular,
  },
  reminderSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: typography.fontWeightBold,
  },
  moreAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreActionText: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: typography.fontWeightRegular,
  },
  reminderList: {
    gap: 12,
  },
  reminderItem: {
    minHeight: 80,
    backgroundColor: '#47AC5E',
    borderColor: "#00813A",
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderItemChecked: {
    backgroundColor: '#00813A',
    borderWidth: 2,
    borderColor: '#00813A',
  },
  sunnahReminderItem: {
    minHeight: 76,
    backgroundColor: '#F5FAEF',
    borderColor: '#B8D8A8',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sunnahReminderItemChecked: {
    backgroundColor: '#EEF8E8',
    borderColor: colors.primary,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reminderIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#00813A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunnahReminderIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: '#E7F0DE',
    borderWidth: 1,
    borderColor: '#B8D8A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCopy: {
    flex: 1,
  },
  sunnahNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderPrayerName: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: typography.fontWeightBold,
  },
  sunnahPrayerName: {
    color: '#1D2A21',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: typography.fontWeightBold,
  },
  sunnahBadge: {
    color: colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: typography.fontWeightBold,
    backgroundColor: '#E7F0DE',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reminderPrayerTime: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: typography.fontWeightRegular,
    marginTop: 2,
  },
  sunnahPrayerTime: {
    color: '#69736B',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: typography.fontWeightMedium,
    marginTop: 2,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: spacing.sm,
  },
  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  notificationButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  sunnahNotificationButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#C8D7BE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sunnahNotificationButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
  },
  reminderCheckButton: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCheckButtonChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  sunnahCheckButton: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8D7BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunnahCheckButtonChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skeletonOnGreen: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  skeletonCircle: {
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  skeletonReminderCopy: {
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 18, 0.35)',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '72%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: '#C7D2C9',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    lineHeight: typography.fontSizeLG * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
    marginBottom: spacing.md,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.fontSizeMD * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    marginBottom: spacing.md,
  },
  cityList: {
    paddingBottom: spacing.md,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#E7ECE7',
    marginBottom: spacing.sm,
  },
  cityItemSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryLight,
  },
  cityItemTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cityItemName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.fontSizeMD * typography.lineHeightNormal,
    fontWeight: typography.fontWeightExtraBold,
  },
  cityItemProvince: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    marginTop: 2,
  },
});
