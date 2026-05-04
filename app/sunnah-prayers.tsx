import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { toHijri } from 'hijri-date/lib/safe.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SunnahReminderService,
  sunnahPrayerDefinitions,
  type SunnahPrayerKey,
} from '@/services/SunnahReminderService';
import { getSelectedCityCode } from '@/services/PreferenceService';
import {
  defaultIndonesiaCity,
  findCityByCode,
  getLocationLabel,
} from '@/shared/utils/location';
import { getPrayerSchedule, type PrayerSchedule } from '@/shared/utils/prayer';
import { colors, spacing, typography } from '@/theme';

const sunnahReminderStorageKey = 'sunnah:reminders';
type SunnahReminderMap = Partial<Record<SunnahPrayerKey, boolean>>;

export default function SunnahPrayersScreen() {
  const router = useRouter();
  const [enabledReminders, setEnabledReminders] = useState<SunnahReminderMap>({});
  const [schedule, setSchedule] = useState<PrayerSchedule>(() =>
    getPrayerSchedule({
      latitude: defaultIndonesiaCity.latitude,
      longitude: defaultIndonesiaCity.longitude,
    })
  );
  const [locationName, setLocationName] = useState(() => getLocationLabel(defaultIndonesiaCity));
  const isRamadhan = useMemo(() => isRamadhanToday(), []);
  const visiblePrayers = useMemo(
    () => sunnahPrayerDefinitions.filter((item) => item.key !== 'tarawih' || isRamadhan),
    [isRamadhan]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadState() {
      const [storedKeys, selectedCityCode] = await Promise.all([
        getStoredReminderKeys(),
        getSelectedCityCode(),
      ]);
      const city = selectedCityCode
        ? findCityByCode(selectedCityCode) ?? defaultIndonesiaCity
        : defaultIndonesiaCity;
      const nextSchedule = getPrayerSchedule({
        latitude: city.latitude,
        longitude: city.longitude,
      });
      const activeKeys = storedKeys.filter((key) => key !== 'tarawih' || isRamadhan);
      const activeReminderMap = createReminderMap(activeKeys);

      if (!isMounted) {
        return;
      }

      setEnabledReminders(activeReminderMap);
      setSchedule(nextSchedule);
      setLocationName(getLocationLabel(city));
      void SunnahReminderService.scheduleAll(activeKeys, nextSchedule);
    }

    void loadState();

    return () => {
      isMounted = false;
    };
  }, [isRamadhan]);

  const persistAndSchedule = useCallback(
    async (nextReminders: SunnahReminderMap) => {
      try {
        const enabledKeys = getEnabledReminderKeys(nextReminders);

        await AsyncStorage.setItem(sunnahReminderStorageKey, JSON.stringify(nextReminders));
        await SunnahReminderService.scheduleAll(enabledKeys, schedule);
      } catch (error) {
        console.warn('Failed to persist sunnah prayer reminders', error);
      }
    },
    [schedule]
  );

  function handleToggleReminder(key: SunnahPrayerKey) {
    const nextReminders = {
      ...enabledReminders,
      [key]: !enabledReminders[key],
    };

    setEnabledReminders(nextReminders);
    void persistAndSchedule(nextReminders);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali">
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Sholat Sunnah</Text>
            <Text style={styles.subtitle}>{locationName}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {visiblePrayers.map((item) => {
            const isEnabled = Boolean(enabledReminders[item.key]);
            const reminderDate = SunnahReminderService.getReminderDate(item.key, schedule);

            return (
              <View key={item.key} style={styles.card}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="star-crescent" size={24} color="#FFFFFF" />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.prayerName}>{item.name}</Text>
                  <Text style={styles.timeDescription}>{item.timeDescription}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{item.rakaat}</Text>
                    {reminderDate ? (
                      <Text style={styles.metaText}>{formatTime(reminderDate)}</Text>
                    ) : null}
                  </View>
                </View>

                <Switch
                  value={isEnabled}
                  onValueChange={() => handleToggleReminder(item.key)}
                  trackColor={{ false: '#C8D7BE', true: '#72C27D' }}
                  thumbColor={isEnabled ? colors.primary : '#FFFFFF'}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

async function getStoredReminderKeys(): Promise<SunnahPrayerKey[]> {
  const rawValue = await AsyncStorage.getItem(sunnahReminderStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

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
  } catch {
    return [];
  }
}

function createReminderMap(keys: SunnahPrayerKey[]): SunnahReminderMap {
  return Object.fromEntries(keys.map((key) => [key, true])) as SunnahReminderMap;
}

function getEnabledReminderKeys(reminders: SunnahReminderMap) {
  return Object.entries(reminders)
    .filter((entry): entry is [SunnahPrayerKey, boolean] => (
      isSunnahPrayerKey(entry[0]) && entry[1] === true
    ))
    .map(([key]) => key);
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

function formatTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${hour}:${minute}`;
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5FAEF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E6CB',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#1D2A21',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: typography.fontWeightExtraBold,
  },
  subtitle: {
    color: '#69736B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  list: {
    gap: 12,
  },
  card: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5FAEF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  prayerName: {
    color: '#1D2A21',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: typography.fontWeightExtraBold,
  },
  timeDescription: {
    color: '#69736B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: typography.fontWeightBold,
  },
});
