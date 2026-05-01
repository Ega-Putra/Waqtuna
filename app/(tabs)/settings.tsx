import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo, useState } from 'react';
import {
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

import { type IndonesiaCity } from '@/constants/indonesia-cities';
import {
  defaultIndonesiaCity,
  findCityByCode,
  getLocationLabel,
  persistSelectedCityCode,
  searchIndonesiaCities,
} from '@/utils/location';
import { getPrayerSchedule } from '@/utils/prayer';
import { rescheduleAll, type PrayerNotificationKey } from '@/src/services/NotificationService';
import { PuasaReminderService } from '@/src/services/PuasaReminderService';
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
  type AsrMadhabPreference,
  type CalculationMethodPreference,
  type FastingReminderSettings,
} from '@/src/services/PreferenceService';

const reminderOptions = [5, 10, 15, 30];

const prayerOptions: { key: PrayerNotificationKey; label: string }[] = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
];

const calculationOptions: { value: CalculationMethodPreference; label: string }[] = [
  { value: 'kemenag', label: 'Kemenag RI' },
  { value: 'muslimWorldLeague', label: 'Muslim World League' },
  { value: 'isna', label: 'ISNA' },
  { value: 'egypt', label: 'Egypt' },
  { value: 'karachi', label: 'Karachi' },
];

const madhabOptions: { value: AsrMadhabPreference; label: string }[] = [
  { value: 'shafi', label: "Syafi'i" },
  { value: 'hanafi', label: 'Hanafi' },
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

  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      const [
        storedPreferences,
        storedNotificationSettings,
        storedFastingReminderSettings,
        selectedCityCode,
      ] = await Promise.all([
        getAppPreferences(),
        getPrayerNotificationSettings(),
        getFastingReminderSettings(),
        getSelectedCityCode(),
      ]);

      if (!isMounted) {
        return;
      }

      setPreferences(storedPreferences);
      setNotificationSettings(storedNotificationSettings);
      setFastingReminderSettingsState(storedFastingReminderSettings);
      setSelectedCity(selectedCityCode ? findCityByCode(selectedCityCode) ?? defaultIndonesiaCity : defaultIndonesiaCity);
    }

    void loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCities = useMemo(() => searchIndonesiaCities(cityQuery), [cityQuery]);

  async function persistPreferences(nextPreferences: AppPreferences) {
    setPreferences(nextPreferences);
    await setAppPreferences(nextPreferences);
  }

  async function persistNotificationSettings(nextSettings: typeof notificationSettings) {
    setNotificationSettings(nextSettings);
    await setPrayerNotificationSettings(nextSettings);
    await reschedulePrayerNotifications(nextSettings, selectedCity);
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
    await reschedulePrayerNotifications(notificationSettings, city);
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

        <Section title="Perhitungan">
          <View style={styles.optionBlock}>
            <Text style={styles.settingTitle}>Metode Kalkulasi</Text>
            <View style={styles.optionGrid}>
              {calculationOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  isSelected={preferences.calculationMethod === option.value}
                  onPress={() =>
                    void persistPreferences({
                      ...preferences,
                      calculationMethod: option.value,
                    })
                  }
                />
              ))}
            </View>
          </View>

          <View style={styles.optionBlock}>
            <Text style={styles.settingTitle}>Madhab Ashar</Text>
            <View style={styles.optionGrid}>
              {madhabOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  isSelected={preferences.asrMadhab === option.value}
                  onPress={() =>
                    void persistPreferences({
                      ...preferences,
                      asrMadhab: option.value,
                    })
                  }
                />
              ))}
            </View>
          </View>
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
            onPress={() => void Linking.openSettings()}
            accessibilityRole="button">
            <MaterialCommunityIcons name="bell-cog-outline" size={20} color="#007322" />
            <Text style={styles.secondaryButtonText}>Kelola Izin Notifikasi</Text>
          </Pressable>
        </Section>
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
  city: IndonesiaCity
) {
  const schedule = getPrayerSchedule({
    latitude: city.latitude,
    longitude: city.longitude,
  });

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
