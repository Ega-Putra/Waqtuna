import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WidgetPreview } from 'react-native-android-widget';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { rescheduleAll, type PrayerNotificationKey } from '@/services/NotificationService';
import {
  defaultAppPreferences,
  defaultFastingReminderSettings,
  defaultPrayerNotificationSettings,
  getAppPreferences,
  getFastingReminderSettings,
  getPrayerNotificationSettings,
  getSelectedCityCode,
  setAppPreferences,
  setFastingReminderSettings,
  setPrayerNotificationSettings,
  type AppPreferences,
  type FastingReminderSettings,
} from '@/services/PreferenceService';
import { PuasaReminderService } from '@/services/PuasaReminderService';
import { updateAllHomeWidgets } from '@/services/WidgetUpdateService';
import { Toast } from '@/shared/components/ui/Toast';
import { type IndonesiaCity } from '@/shared/constants/indonesia-cities';
import {
  defaultIndonesiaCity,
  findCityByCode,
  getLocationLabel,
  persistSelectedCityCode,
  searchIndonesiaCities,
} from '@/shared/utils/location';
import { getPrayerSchedule } from '@/shared/utils/prayer';
import {
  getDefaultShalatWidgetData,
  ShalatWidget,
  type ShalatWidgetData,
} from '@/widgets/ShalatWidget';
import { getShalatWidgetData } from '@/widgets/shalatWidgetData';

const reminderOptions = [5, 10, 15, 30];
const quranFontOptions = [26, 30, 34, 38, 42] as const;

const prayerOptions: { key: PrayerNotificationKey; label: string }[] = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
];

export default function SettingsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [preferences, setPreferences] = useState<AppPreferences>(defaultAppPreferences);
  const [notificationSettings, setNotificationSettings] = useState(
    defaultPrayerNotificationSettings
  );
  const [fastingReminderSettings, setFastingReminderSettingsState] =
    useState<FastingReminderSettings>(defaultFastingReminderSettings);
  const [selectedCity, setSelectedCity] = useState<IndonesiaCity>(defaultIndonesiaCity);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [widgetPreviewData, setWidgetPreviewData] = useState<ShalatWidgetData>(
    getDefaultShalatWidgetData()
  );

  const loadPreferences = useCallback(async () => {
    const [
      storedPreferences,
      storedNotificationSettings,
      storedFastingReminderSettings,
      selectedCityCode,
      shalatWidgetData,
    ] = await Promise.all([
      getAppPreferences(),
      getPrayerNotificationSettings(),
      getFastingReminderSettings(),
      getSelectedCityCode(),
      getShalatWidgetData(),
    ]);

    setPreferences(storedPreferences);
    setNotificationSettings(storedNotificationSettings);
    setFastingReminderSettingsState(storedFastingReminderSettings);
    setSelectedCity(
      selectedCityCode ? findCityByCode(selectedCityCode) ?? defaultIndonesiaCity : defaultIndonesiaCity
    );
    setWidgetPreviewData(shalatWidgetData);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPreferences() {
      const [
        storedPreferences,
        storedNotificationSettings,
        storedFastingReminderSettings,
        selectedCityCode,
        shalatWidgetData,
      ] = await Promise.all([
        getAppPreferences(),
        getPrayerNotificationSettings(),
        getFastingReminderSettings(),
        getSelectedCityCode(),
        getShalatWidgetData(),
      ]);

      if (!isMounted) {
        return;
      }

      setPreferences(storedPreferences);
      setNotificationSettings(storedNotificationSettings);
      setFastingReminderSettingsState(storedFastingReminderSettings);
      setSelectedCity(selectedCityCode ? findCityByCode(selectedCityCode) ?? defaultIndonesiaCity : defaultIndonesiaCity);
      setWidgetPreviewData(shalatWidgetData);
    }

    void loadInitialPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPreferences();
    }, [loadPreferences])
  );

  const filteredCities = useMemo(() => searchIndonesiaCities(cityQuery), [cityQuery]);

  function showToast(message: string) {
    setToastMessage(message);
    setIsToastVisible(true);
  }

  async function persistPreferences(nextPreferences: AppPreferences) {
    setPreferences(nextPreferences);
    await setAppPreferences(nextPreferences);
    setWidgetPreviewData(await getShalatWidgetData());
    await updateAllHomeWidgets();
  }

  async function persistNotificationSettings(nextSettings: typeof notificationSettings) {
    setNotificationSettings(nextSettings);
    await setPrayerNotificationSettings(nextSettings);
    await reschedulePrayerNotifications(nextSettings, selectedCity, preferences);
  }

  async function persistFastingReminderSettings(nextSettings: FastingReminderSettings) {
    setFastingReminderSettingsState(nextSettings);
    await setFastingReminderSettings(nextSettings);
    await PuasaReminderService.scheduleAll(nextSettings);
  }

  async function handleSelectCity(city: IndonesiaCity) {
    setSelectedCity(city);
    setIsLocationPickerVisible(false);
    setCityQuery('');
    await persistSelectedCityCode(city.code);
    await reschedulePrayerNotifications(notificationSettings, city, preferences);
    setWidgetPreviewData(await getShalatWidgetData());
    await updateAllHomeWidgets();
    showToast(`Kota diperbarui ke ${getLocationLabel(city)}`);
  }

  async function handleOpenNotificationSettings() {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert(
        'Tidak dapat membuka Pengaturan',
        'Buka Pengaturan perangkat secara manual untuk mengatur izin notifikasi.'
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: tabBarHeight + 28 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.appTitle}>Pengaturan</Text>

        <Section title="Tampilan">
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Format Jam</Text>
              <Text style={styles.settingDescription}>Pilih format waktu di aplikasi</Text>
            </View>
            <SegmentedControl
              options={[
                { label: '12', value: '12h' },
                { label: '24', value: '24h' },
              ]}
              value={preferences.clockFormat}
              onChange={(clockFormat) => void persistPreferences({ ...preferences, clockFormat })}
            />
          </View>

          <View style={styles.optionBlock}>
            <Text style={styles.settingTitle}>Ukuran Font Arab</Text>
            <Text style={styles.settingDescription}>
              Atur ukuran tulisan Arab di fitur baca surat
            </Text>
            <View style={styles.optionGrid}>
              {quranFontOptions.map((size) => (
                <OptionButton
                  key={size}
                  label={`${size}`}
                  isSelected={preferences.quranArabicFontSize === size}
                  onPress={() =>
                    void persistPreferences({
                      ...preferences,
                      quranArabicFontSize: size,
                    })
                  }
                />
              ))}
            </View>
          </View>
        </Section>

        <Section title="Widget Preview">
          <View style={styles.optionBlock}>
            <Text style={styles.settingTitle}>Preview Widget Android</Text>
            <Text style={styles.settingDescription}>
              Tampilan contoh widget yang akan muncul di home screen Android.
            </Text>
            <View style={styles.widgetPreviewContainer}>
              <WidgetPreview
                renderWidget={() => <ShalatWidget data={widgetPreviewData} />}
                width={320}
                height={200}
              />
            </View>
          </View>
        </Section>

        <Section title="Notifikasi">
          <ToggleRow
            title="Notifikasi Adzan"
            description="Aktifkan semua pengingat sholat"
            value={notificationSettings.isEnabled}
            onValueChange={(isEnabled) =>
              void persistNotificationSettings({ ...notificationSettings, isEnabled })
            }
          />

          {prayerOptions.map((item) => (
            <ToggleRow
              key={item.key}
              title={item.label}
              description={`Pengingat waktu ${item.label}`}
              value={notificationSettings.enabledPrayers[item.key]}
              onValueChange={(isEnabled) =>
                void persistNotificationSettings({
                  ...notificationSettings,
                  enabledPrayers: {
                    ...notificationSettings.enabledPrayers,
                    [item.key]: isEnabled,
                  },
                })
              }
            />
          ))}

          <View style={styles.optionBlock}>
            <Text style={styles.settingTitle}>Reminder Sebelum Adzan</Text>
            <View style={styles.optionGrid}>
              {reminderOptions.map((minutes) => (
                <OptionButton
                  key={minutes}
                  label={`${minutes} menit`}
                  isSelected={notificationSettings.reminderMinutes === minutes}
                  onPress={() =>
                    void persistNotificationSettings({
                      ...notificationSettings,
                      reminderMinutes: minutes,
                    })
                  }
                />
              ))}
            </View>
          </View>

          <ToggleRow
            title="Puasa Senin-Kamis"
            description="Reminder malam sebelumnya dan waktu sahur"
            value={fastingReminderSettings.mondayThursdayEnabled}
            onValueChange={(mondayThursdayEnabled) =>
              void persistFastingReminderSettings({
                ...fastingReminderSettings,
                mondayThursdayEnabled,
              })
            }
          />

          <ToggleRow
            title="Ayyamul Bidh"
            description="Reminder sebelum tanggal 13-15 bulan Hijriah"
            value={fastingReminderSettings.ayyamulBidhEnabled}
            onValueChange={(ayyamulBidhEnabled) =>
              void persistFastingReminderSettings({
                ...fastingReminderSettings,
                ayyamulBidhEnabled,
              })
            }
          />
        </Section>

        <Section title="Lokasi & Izin">
          <View style={styles.locationBox}>
            <View style={styles.locationIconWrap}>
              <MaterialIcons name="location-on" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>{getLocationLabel(selectedCity)}</Text>
              <Text style={styles.settingDescription}>{selectedCity.province}</Text>
            </View>
          </View>

          <Pressable
            style={styles.actionButton}
            onPress={() => setIsLocationPickerVisible(true)}
            accessibilityRole="button">
            <MaterialIcons name="edit-location-alt" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Ganti Kota</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => void handleOpenNotificationSettings()}
            accessibilityRole="button">
            <MaterialCommunityIcons name="bell-cog-outline" size={20} color="#007322" />
            <Text style={styles.secondaryButtonText}>Kelola Izin Notifikasi</Text>
          </Pressable>
        </Section>
      </ScrollView>

      <Toast
        message={toastMessage}
        visible={isToastVisible}
        bottomOffset={tabBarHeight}
        onHide={() => {
          setIsToastVisible(false);
          setToastMessage(null);
        }}
      />

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingTextWrap}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#C8D7BE', true: '#72C27D' }}
        thumbColor={value ? '#007322' : '#FFFFFF'}
      />
    </View>
  );
}

function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: TValue }[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.segmentedItem, value === option.value && styles.segmentedItemSelected]}
          onPress={() => onChange(option.value)}>
          <Text
            style={[
              styles.segmentedText,
              value === option.value && styles.segmentedTextSelected,
            ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function OptionButton({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}>
      <Text style={[styles.optionButtonText, isSelected && styles.optionButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

async function reschedulePrayerNotifications(
  settings: typeof defaultPrayerNotificationSettings,
  city: IndonesiaCity,
  prefs: AppPreferences
) {
  const schedule = getPrayerSchedule(
    {
      latitude: city.latitude,
      longitude: city.longitude,
    },
    new Date(),
    { clockFormat: prefs.clockFormat }
  );

  await rescheduleAll(schedule.prayers, settings);
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
    marginBottom: 22,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#1D2A21',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionBody: {
    backgroundColor: '#F5FAEF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EADA',
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    color: '#1D2A21',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  settingDescription: {
    color: '#69736B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E0EADA',
    borderRadius: 12,
    padding: 3,
  },
  segmentedItem: {
    minWidth: 44,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  segmentedItemSelected: {
    backgroundColor: '#007322',
  },
  segmentedText: {
    color: '#4D5A4F',
    fontSize: 13,
    fontWeight: '800',
  },
  segmentedTextSelected: {
    color: '#FFFFFF',
  },
  optionBlock: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EADA',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  widgetPreviewContainer: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    backgroundColor: '#EDF6E6',
    paddingVertical: 18,
    overflow: 'hidden',
  },
  optionButton: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8D7BE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#007322',
    borderColor: '#007322',
  },
  optionButtonText: {
    color: '#2F3334',
    fontSize: 13,
    fontWeight: '700',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0EADA',
  },
  locationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#007322',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B9D8BD',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  secondaryButtonText: {
    color: '#007322',
    fontSize: 14,
    fontWeight: '800',
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
