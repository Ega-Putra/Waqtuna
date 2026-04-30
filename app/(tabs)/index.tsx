import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  SimpleLineIcons,
} from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { type IndonesiaCity } from '@/constants/indonesia-cities';
import {
  defaultIndonesiaCity,
  getInitialLocationState,
  getLocationLabel,
  persistSelectedCityCode,
  searchIndonesiaCities,
} from '@/utils/location';
import { usePrayerNotificationSettings } from '@/src/hooks/usePrayerNotificationSettings';
import { rescheduleAll } from '@/src/services/NotificationService';
import {
  getDailyChecklist,
  getDailyProgress,
  getStreak,
  togglePrayer,
  type DailyProgress,
  type PrayerChecklist,
} from '@/src/services/PrayerChecklistService';
import {
  updateAllHomeWidgets,
  updateChecklistWidget,
} from '@/src/services/WidgetUpdateService';
import { getPrayerSchedule, type PrayerScheduleItem } from '@/utils/prayer';
import { getCalendarDateParts } from '@/utils/time';

const prayerIcons: Record<PrayerScheduleItem['key'], React.ReactNode> = {
  fajr: <MaterialCommunityIcons name="weather-sunset-up" size={28} color="#FFFFFF" />,
  dhuhr: <MaterialCommunityIcons name="white-balance-sunny" size={28} color="#FFFFFF" />,
  asr: <MaterialCommunityIcons name="weather-partly-cloudy" size={28} color="#FFFFFF" />,
  maghrib: <MaterialCommunityIcons name="weather-night-partly-cloudy" size={28} color="#FFFFFF" />,
  isha: <MaterialCommunityIcons name="moon-waning-crescent" size={28} color="#FFFFFF" />,
};

function PrayerReminderCard({
  name,
  time,
  icon,
  isHighlighted,
  isChecked,
  onToggle,
}: {
  name: string;
  time: string;
  icon: React.ReactNode;
  isHighlighted?: boolean;
  isChecked?: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={[styles.prayerCard, isHighlighted && styles.prayerCardHighlighted]}>
      <View style={styles.prayerInfo}>
        <View style={styles.prayerIconWrap}>{icon}</View>
        <View style={styles.prayerTextBlock}>
          <Text style={styles.prayerName}>{name}</Text>
          <Text style={styles.prayerTime}>{time}</Text>
        </View>
      </View>

      <View style={styles.prayerActions}>
        <SimpleLineIcons name="bell" size={23} color="#FFFFFF" />
        <Pressable
          style={[styles.checkButton, isChecked && styles.checkButtonChecked]}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={`Tandai sholat ${name}`}>
          <MaterialIcons name="check" size={19} color={isChecked ? '#FFFFFF' : '#A2ABB3'} />
        </Pressable>
      </View>
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
  const [schedule, setSchedule] = useState(() =>
    getPrayerSchedule({
      latitude: defaultIndonesiaCity.latitude,
      longitude: defaultIndonesiaCity.longitude,
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
        const initialLocation = await getInitialLocationState();

        if (!isMounted) {
          return;
        }

        setSelectedCity(initialLocation.city);
        setSchedule(
          getPrayerSchedule({
            latitude: initialLocation.city.latitude,
            longitude: initialLocation.city.longitude,
          })
        );
        setLocationError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSelectedCity(defaultIndonesiaCity);
        setSchedule(
          getPrayerSchedule({
            latitude: defaultIndonesiaCity.latitude,
            longitude: defaultIndonesiaCity.longitude,
          })
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

  useEffect(() => {
    const interval = setInterval(() => {
      setSchedule(
        getPrayerSchedule({
          latitude: selectedCity.latitude,
          longitude: selectedCity.longitude,
        })
      );
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedCity]);

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
  }, [isBootstrapping, isNotificationSettingsLoading, notificationSettings, selectedCity]);

  const filteredCities = searchIndonesiaCities(cityQuery);

  async function handleSelectCity(city: IndonesiaCity) {
    setSelectedCity(city);
    setSchedule(
      getPrayerSchedule({
        latitude: city.latitude,
        longitude: city.longitude,
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.appTitle}>Waqtuna</Text>

        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Assalamu Alaikum, Abi</Text>
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        </View>

        <View style={styles.overviewRow}>
          <View style={styles.overviewMain}>
            <Text style={styles.dateTitle}>{gregorianDate}</Text>

            <Pressable
              style={styles.locationRow}
              onPress={() => setIsLocationPickerVisible(true)}
              accessibilityRole="button">
              <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {getLocationLabel(selectedCity)}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.streakPill}>
            <MaterialCommunityIcons name="fire" size={15} color="#F97316" />
            <Text style={styles.streakText}>{streak} Hari Beruntun</Text>
          </View>
        </View>

        {locationError ? (
          <View style={styles.locationErrorBox}>
            <MaterialIcons name="info-outline" size={18} color="#7A4E00" />
            <Text style={styles.locationErrorText}>{locationError}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroCircle} />
          <View style={styles.heroContent}>
            {isBootstrapping ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.heroTitle}>{schedule.nextPrayerName}</Text>
                <Text style={styles.heroTime}>{schedule.nextPrayerHeroTime}</Text>
                <View style={styles.countdownRow}>
                  <MaterialCommunityIcons name="clock-outline" size={19} color="#FFFFFF" />
                  <Text style={styles.countdownText}>{schedule.countdownText}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pengingat Ibadah</Text>
          <View style={styles.moreWrap}>
            <Text style={styles.moreText}>Lebih Banyak</Text>
            <MaterialIcons name="arrow-forward" size={22} color="#007322" />
          </View>
        </View>

        <View style={styles.progressWrap}>
          <Text style={styles.progressText}>
            {dailyProgress.checked}/{dailyProgress.total} sholat hari ini
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        <View style={styles.listWrap}>
          {schedule.prayers.map((item) => (
            <PrayerReminderCard
              key={item.key}
              name={item.name}
              time={item.time}
              icon={prayerIcons[item.key]}
              isHighlighted={item.name === schedule.nextPrayerName}
              isChecked={Boolean(prayerChecklist[item.name])}
              onToggle={() => void handleTogglePrayer(item.name)}
            />
          ))}
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
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
    color: '#2F3334',
    fontSize: 16,
    lineHeight: 28,
  },
  hijriDate: {
    color: '#5B6061',
    fontSize: 16,
    lineHeight: 28,
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
    color: '#2F3334',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 6,
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
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 180,
  },
  locationErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7D6',
    borderWidth: 1,
    borderColor: '#F2D17A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -8,
    marginBottom: 18,
  },
  locationErrorText: {
    flex: 1,
    color: '#7A4E00',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
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
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
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
    borderRadius: 999,
    backgroundColor: '#C8D7BE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#008C3A',
  },
  listWrap: {
    gap: 10,
  },
  prayerCard: {
    minHeight: 80,
    borderRadius: 24,
    backgroundColor: '#4CB15F',
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prayerCardHighlighted: {
    backgroundColor: '#008C3A',
    borderColor: '#F6D365',
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#008C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerTextBlock: {
    justifyContent: 'center',
    gap: 5,
  },
  prayerName: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
  },
  prayerTime: {
    color: '#E7F4E2',
    fontSize: 16,
    lineHeight: 20,
  },
  prayerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonChecked: {
    backgroundColor: '#007322',
    borderColor: '#E7F4E2',
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
