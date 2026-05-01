import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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

import { type IndonesiaCity } from '@/shared/constants/indonesia-cities';
import { SkeletonBox } from '@/shared/components/feedback/SkeletonBox';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import {
  defaultIndonesiaCity,
  getInitialLocationState,
  getLocationLabel,
  persistSelectedCityCode,
  searchIndonesiaCities,
} from '@/shared/utils/location';
import { usePrayerNotificationSettings } from '@/features/home/hooks/usePrayerNotificationSettings';
import { rescheduleAll } from '@/services/NotificationService';
import {
  defaultAppPreferences,
  getAppPreferences,
  type AppPreferences,
} from '@/services/PreferenceService';
import {
  getDailyChecklist,
  getDailyProgress,
  getStreak,
  togglePrayer,
  type DailyProgress,
  type PrayerChecklist,
} from '@/services/PrayerChecklistService';
import {
  updateAllHomeWidgets,
  updateChecklistWidget,
} from '@/services/WidgetUpdateService';
import { getPrayerSchedule, type PrayerScheduleItem } from '@/shared/utils/prayer';
import { getCalendarDateParts } from '@/shared/utils/time';

const prayerIcons: Record<PrayerScheduleItem['key'], React.ReactNode> = {
  fajr: <MaterialCommunityIcons name="weather-sunset-up" size={24} color={colors.primary} />,
  dhuhr: <MaterialCommunityIcons name="white-balance-sunny" size={24} color={colors.primary} />,
  asr: <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={colors.primary} />,
  maghrib: <MaterialCommunityIcons name="weather-night-partly-cloudy" size={24} color={colors.primary} />,
  isha: <MaterialCommunityIcons name="moon-waning-crescent" size={24} color={colors.primary} />,
};

const prayerArabicNames: Record<PrayerScheduleItem['key'], string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

function PrayerReminderCard({
  prayerKey,
  name,
  time,
  icon,
  status,
  isChecked,
  onToggle,
}: {
  prayerKey: PrayerScheduleItem['key'];
  name: string;
  time: string;
  icon: React.ReactNode;
  status: 'past' | 'next' | 'upcoming';
  isChecked?: boolean;
  onToggle: () => void;
}) {
  const isNext = status === 'next';
  const isPast = status === 'past';

  return (
    <View
      style={[
        styles.prayerCard,
        isNext && styles.prayerCardActive,
        isPast && styles.prayerCardPast,
      ]}>
      <View style={[styles.prayerIconWrap, isNext && styles.prayerIconWrapActive]}>
        {isNext ? clonePrayerIcon(prayerKey, '#FFFFFF') : icon}
      </View>

      <Text style={[styles.prayerArabicName, isNext && styles.prayerCardTextActive]}>
        {prayerArabicNames[prayerKey]}
      </Text>
      <Text style={[styles.prayerName, isNext && styles.prayerCardTextActive]}>{name}</Text>
      <Text style={[styles.prayerTime, isNext && styles.prayerCardTextActive]}>{time}</Text>

      <Pressable
        style={[
          styles.checkButton,
          isNext && styles.checkButtonActiveCard,
          isChecked && styles.checkButtonChecked,
        ]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`Tandai sholat ${name}`}>
        <MaterialIcons
          name={isChecked ? 'check-circle' : 'radio-button-unchecked'}
          size={22}
          color={isNext ? '#FFFFFF' : isChecked ? colors.primary : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { gregorianDate, hijriDate } = getCalendarDateParts();
  const { settings: notificationSettings, isLoading: isNotificationSettingsLoading } =
    usePrayerNotificationSettings();
  const [selectedCity, setSelectedCity] = useState<IndonesiaCity>(defaultIndonesiaCity);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [prayerChecklist, setPrayerChecklist] = useState<PrayerChecklist>({});
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({ checked: 0, total: 5 });
  const [streak, setStreak] = useState(0);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [preferences, setPreferences] = useState<AppPreferences>(defaultAppPreferences);
  const [schedule, setSchedule] = useState(() =>
    getPrayerSchedule({
      latitude: defaultIndonesiaCity.latitude,
      longitude: defaultIndonesiaCity.longitude,
    }, new Date(), {
      calculationMethod: defaultAppPreferences.calculationMethod,
      asrMadhab: defaultAppPreferences.asrMadhab,
      clockFormat: defaultAppPreferences.clockFormat,
    })
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

    async function loadInitialLocation() {
      try {
        const [initialLocation, storedPreferences] = await Promise.all([
          getInitialLocationState(),
          getAppPreferences(),
        ]);

        if (!isMounted) {
          return;
        }

        setSelectedCity(initialLocation.city);
        setPreferences(storedPreferences);
        setSchedule(
          getPrayerSchedule(
            {
              latitude: initialLocation.city.latitude,
              longitude: initialLocation.city.longitude,
            },
            new Date(),
            {
              calculationMethod: storedPreferences.calculationMethod,
              asrMadhab: storedPreferences.asrMadhab,
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
        setSchedule(
          getPrayerSchedule(
            {
              latitude: defaultIndonesiaCity.latitude,
              longitude: defaultIndonesiaCity.longitude,
            },
            new Date(),
            {
              calculationMethod: defaultAppPreferences.calculationMethod,
              asrMadhab: defaultAppPreferences.asrMadhab,
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

    void loadInitialLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function syncOnFocus() {
        try {
          const [nextLocation, nextPreferences] = await Promise.all([
            getInitialLocationState(),
            getAppPreferences(),
          ]);

          if (!isActive) {
            return;
          }

          setSelectedCity(nextLocation.city);
          setPreferences(nextPreferences);
          setSchedule(
            getPrayerSchedule(
              {
                latitude: nextLocation.city.latitude,
                longitude: nextLocation.city.longitude,
              },
              new Date(),
              {
                calculationMethod: nextPreferences.calculationMethod,
                asrMadhab: nextPreferences.asrMadhab,
                clockFormat: nextPreferences.clockFormat,
              }
            )
          );
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
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSchedule(
        getPrayerSchedule({
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
        }, new Date(), {
          calculationMethod: preferences.calculationMethod,
          asrMadhab: preferences.asrMadhab,
          clockFormat: preferences.clockFormat,
        })
      );
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [
    preferences.asrMadhab,
    preferences.calculationMethod,
    preferences.clockFormat,
    selectedCity,
  ]);

  useEffect(() => {
    let isActive = true;
    let midnightTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadChecklist() {
      if (isActive) {
        await refreshChecklistState();
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
      const currentSchedule = getPrayerSchedule({
        latitude: selectedCity.latitude,
        longitude: selectedCity.longitude,
      }, new Date(), {
        calculationMethod: preferences.calculationMethod,
        asrMadhab: preferences.asrMadhab,
        clockFormat: preferences.clockFormat,
      });

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
    preferences.asrMadhab,
    preferences.calculationMethod,
    preferences.clockFormat,
    selectedCity,
  ]);

  const filteredCities = searchIndonesiaCities(cityQuery);

  async function handleSelectCity(city: IndonesiaCity) {
    setSelectedCity(city);
    setSchedule(
      getPrayerSchedule({
        latitude: city.latitude,
        longitude: city.longitude,
      }, new Date(), {
        calculationMethod: preferences.calculationMethod,
        asrMadhab: preferences.asrMadhab,
        clockFormat: preferences.clockFormat,
      })
    );
    setIsLocationPickerVisible(false);
    setCityQuery('');
    setLocationError(null);
    await persistSelectedCityCode(city.code);
    await updateAllHomeWidgets();
  }

  async function handleTogglePrayer(prayerName: string) {
    const today = new Date();
    const nextChecklist = await togglePrayer(today, prayerName);
    const [progress, currentStreak] = await Promise.all([getDailyProgress(today), getStreak(today)]);

    setPrayerChecklist(nextChecklist);
    setDailyProgress(progress);
    setStreak(currentStreak);
    await updateChecklistWidget();
  }

  const progressPercentage =
    dailyProgress.total > 0 ? (dailyProgress.checked / dailyProgress.total) * 100 : 0;
  const countdownInfo = getCountdownInfo(schedule);
  const prayerProgressPercentage = getPrayerWindowProgress(schedule.prayers, schedule.nextPrayerName);
  const isUrgentCountdown = countdownInfo.totalMinutes < 10;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fixedHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Assalamu Alaikum</Text>
            <Text style={styles.dateTitle}>{gregorianDate}</Text>
            <Text style={styles.hijriDate}>{hijriDate}</Text>
          </View>

          <Pressable
            style={styles.locationChip}
            onPress={() => setIsLocationPickerVisible(true)}
            accessibilityRole="button">
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {getLocationLabel(selectedCity)}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
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

        <View style={styles.countdownCard}>
          {isBootstrapping ? (
            <HeroScheduleSkeleton />
          ) : (
            <>
              <View style={styles.countdownHeader}>
                <View>
                  <Text style={styles.countdownLabel}>Sholat berikutnya</Text>
                  <Text style={styles.nextPrayerName}>{schedule.nextPrayerName}</Text>
                </View>
                <PulseDot isActive={isUrgentCountdown} />
              </View>

              <Text style={styles.digitalCountdown}>{countdownInfo.text}</Text>
              <Text style={styles.nextPrayerTime}>Masuk pukul {schedule.nextPrayerTime}</Text>

              <View style={styles.prayerProgressTrack}>
                <View style={[styles.prayerProgressFill, { width: `${prayerProgressPercentage}%` }]} />
              </View>
            </>
          )}
        </View>

        <View style={styles.streakSection}>
          <View style={styles.streakSummary}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>hari beruntun</Text>
            </View>
          </View>
          <View style={styles.weekDotsRow}>
            {Array.from({ length: 7 }).map((_, index) => {
              const isToday = index === 6;
              const isComplete = index >= 7 - Math.min(streak, 7);

              return (
                <View
                  key={index}
                  style={[
                    styles.weekDot,
                    isComplete && styles.weekDotComplete,
                    isToday && styles.weekDotToday,
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.todayProgressHeader}>
            <Text style={styles.todayProgressText}>
              {dailyProgress.checked} dari {dailyProgress.total} sholat
            </Text>
            <Text style={styles.todayProgressPercent}>{Math.round(progressPercentage)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        {isBootstrapping ? (
          <PrayerListSkeleton />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
              <Text style={styles.sectionAction}>5 waktu</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prayerHorizontalContent}>
              {schedule.prayers.map((item) => (
                <PrayerReminderCard
                  key={item.key}
                  prayerKey={item.key}
                  name={item.name}
                  time={item.time}
                  icon={prayerIcons[item.key]}
                  status={getPrayerStatus(item, schedule.nextPrayerName)}
                  isChecked={Boolean(prayerChecklist[item.name])}
                  onToggle={() => void handleTogglePrayer(item.name)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>

      <Modal
        visible={isLocationPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLocationPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsLocationPickerVisible(false)} />
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

function getMillisecondsUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);

  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 5, 0);

  return nextMidnight.getTime() - now.getTime();
}

function PulseDot({ isActive }: { isActive: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      scale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.35,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 720,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isActive, scale]);

  return (
    <Animated.View style={[styles.pulseDotOuter, { transform: [{ scale }] }]}>
      <View style={styles.pulseDotInner} />
    </Animated.View>
  );
}

function clonePrayerIcon(prayerKey: PrayerScheduleItem['key'], color: string) {
  const iconName: Record<PrayerScheduleItem['key'], keyof typeof MaterialCommunityIcons.glyphMap> = {
    fajr: 'weather-sunset-up',
    dhuhr: 'white-balance-sunny',
    asr: 'weather-partly-cloudy',
    maghrib: 'weather-night-partly-cloudy',
    isha: 'moon-waning-crescent',
  };

  return <MaterialCommunityIcons name={iconName[prayerKey]} size={24} color={color} />;
}

function getCountdownInfo(schedule: ReturnType<typeof getPrayerSchedule>) {
  const now = new Date();
  const targetDate = createPrayerDate(schedule.nextPrayerTime24h, now);

  if (targetDate <= now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const totalSeconds = Math.max(Math.floor((targetDate.getTime() - now.getTime()) / 1_000), 0);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalMinutes: Math.floor(totalSeconds / 60),
    text: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}

function getPrayerWindowProgress(prayers: PrayerScheduleItem[], nextPrayerName: string) {
  const now = new Date();
  const nextPrayer = prayers.find((prayer) => prayer.name === nextPrayerName) ?? prayers[0];
  const nextIndex = prayers.findIndex((prayer) => prayer.key === nextPrayer.key);
  const previousPrayer = prayers[nextIndex - 1] ?? prayers[prayers.length - 1];
  const nextDate = createPrayerDate(nextPrayer.time24h, now);
  const previousDate = createPrayerDate(previousPrayer.time24h, now);

  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  if (previousDate >= nextDate) {
    previousDate.setDate(previousDate.getDate() - 1);
  }

  const totalWindow = nextDate.getTime() - previousDate.getTime();
  const elapsed = now.getTime() - previousDate.getTime();

  return Math.min(Math.max((elapsed / totalWindow) * 100, 0), 100);
}

function getPrayerStatus(item: PrayerScheduleItem, nextPrayerName: string): 'past' | 'next' | 'upcoming' {
  const now = new Date();
  const prayerDate = createPrayerDate(item.time24h, now);

  if (item.name === nextPrayerName && prayerDate > now) {
    return 'next';
  }

  return prayerDate < now ? 'past' : 'upcoming';
}

function createPrayerDate(time: string, baseDate: Date) {
  const [hourRaw, minuteRaw] = time.split(':');
  const date = new Date(baseDate);

  date.setHours(Number(hourRaw) || 0, Number(minuteRaw) || 0, 0, 0);

  return date;
}

function HeroScheduleSkeleton() {
  return (
    <View style={styles.heroSkeletonWrap}>
      <SkeletonBox width={112} height={24} borderRadius={8} style={styles.heroSkeletonBox} />
      <SkeletonBox width={168} height={54} borderRadius={12} style={styles.heroSkeletonBox} />
      <SkeletonBox width={184} height={18} borderRadius={8} style={styles.heroSkeletonBox} />
    </View>
  );
}

function PrayerListSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.prayerHorizontalContent}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.prayerSkeletonCard}>
          <View style={styles.prayerSkeletonLeft}>
            <SkeletonBox width={52} height={52} borderRadius={999} />
            <View style={styles.prayerSkeletonText}>
              <SkeletonBox width={90} height={16} />
              <SkeletonBox width={56} height={14} />
            </View>
          </View>
          <SkeletonBox width={72} height={28} borderRadius={12} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  fixedHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.sm,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  appTitle: {
    color: '#007322',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: typography.fontSizeLG,
    lineHeight: typography.fontSizeLG * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
  },
  hijriDate: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightBold,
    marginTop: spacing.xs,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    gap: 12,
  },
  overviewMain: {
    flex: 1,
  },
  dateTitle: {
    color: '#ECF7EE',
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#008C3A',
    borderRadius: 20,
    gap: 4,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightBold,
    maxWidth: 128,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 178,
    borderRadius: radius.full,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  locationIconWrap: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  locationErrorCard: {
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 14,
    padding: 12,
    marginTop: -8,
    marginBottom: 18,
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
    fontWeight: '900',
  },
  locationErrorText: {
    color: '#7A4E00',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  locationErrorButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#007322',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  locationErrorButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  streakText: {
    color: '#C2410C',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  heroCard: {
    height: 190,
    borderRadius: 24,
    backgroundColor: '#008C3A',
    overflow: 'hidden',
    marginBottom: 32,
    justifyContent: 'center',
  },
  heroCircle: {
    position: 'absolute',
    right: -50,
    top: -18,
    width: 215,
    height: 215,
    borderRadius: 999,
    backgroundColor: '#58BD64',
  },
  heroContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '68%',
    minHeight: 120,
    justifyContent: 'center',
  },
  heroSkeletonWrap: {
    gap: 12,
  },
  heroSkeletonBox: {
    backgroundColor: colors.surfaceSecondary,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: 0,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  countdownLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightSemiBold,
  },
  nextPrayerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    lineHeight: typography.fontSizeXXL * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
    marginTop: spacing.xs,
  },
  pulseDotOuter: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotInner: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  digitalCountdown: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: typography.fontWeightExtraBold,
    letterSpacing: 0,
    marginTop: spacing.lg,
  },
  nextPrayerTime: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    marginTop: spacing.xs,
  },
  prayerProgressTrack: {
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  prayerProgressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  heroTime: {
    color: '#FFFFFF',
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '800',
    marginBottom: 10,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    lineHeight: typography.fontSizeLG * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
  },
  sectionAction: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightBold,
  },
  moreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreText: {
    color: '#007322',
    fontSize: 16,
  },
  progressWrap: {
    marginTop: -8,
    marginBottom: 16,
  },
  progressText: {
    color: '#2F3334',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  listWrap: {
    gap: spacing.md,
  },
  streakSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  streakIcon: {
    fontSize: 30,
    lineHeight: 36,
  },
  streakNumber: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: typography.fontWeightExtraBold,
  },
  streakLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightSemiBold,
  },
  weekDotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  weekDot: {
    width: 11,
    height: 11,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  weekDotComplete: {
    backgroundColor: colors.primary,
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  todayProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  todayProgressText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.fontSizeMD * typography.lineHeightNormal,
    fontWeight: typography.fontWeightBold,
  },
  todayProgressPercent: {
    color: colors.primary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightExtraBold,
  },
  prayerHorizontalContent: {
    gap: spacing.md,
    paddingRight: spacing.lg,
    paddingBottom: spacing.xs,
  },
  prayerSkeletonCard: {
    minHeight: 142,
    width: 126,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerSkeletonLeft: {
    alignItems: 'center',
    gap: spacing.md,
  },
  prayerSkeletonText: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  prayerCard: {
    width: 126,
    minHeight: 154,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayerCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.lg,
  },
  prayerCardPast: {
    opacity: 0.5,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  prayerTextBlock: {
    justifyContent: 'center',
    gap: 5,
  },
  prayerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.fontSizeMD * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
    textAlign: 'center',
  },
  prayerArabicName: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightBold,
    textAlign: 'center',
  },
  prayerTime: {
    color: colors.primary,
    fontSize: typography.fontSizeXL,
    lineHeight: typography.fontSizeXL * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
    textAlign: 'center',
  },
  prayerCardTextActive: {
    color: '#FFFFFF',
  },
  prayerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonActiveCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  checkButtonChecked: {
    backgroundColor: colors.primaryLight,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  modalSheet: {
    backgroundColor: '#F4F8EF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '72%',
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C7D0BE',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#1D2A21',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  searchInput: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E3ECD9',
    paddingHorizontal: 14,
    color: '#1D2A21',
    fontSize: 16,
    marginBottom: 12,
  },
  cityList: {
    gap: 10,
    paddingBottom: 16,
  },
  cityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityItemSelected: {
    borderWidth: 1,
    borderColor: '#B9D8BD',
    backgroundColor: '#EDF7EE',
  },
  cityItemTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  cityItemName: {
    color: '#1D2A21',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cityItemProvince: {
    color: '#5E636A',
    fontSize: 14,
  },
});
