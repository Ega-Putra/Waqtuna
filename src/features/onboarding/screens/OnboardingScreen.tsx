import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { type IndonesiaCity } from '@/shared/constants/indonesia-cities';
import { requestPermission as requestNotificationPermission } from '@/services/NotificationService';
import {
  setInitialCoordinates,
  setLocationRequested,
  setOnboardingCompleted,
  setSelectedCityCode,
} from '@/services/PreferenceService';
import {
  defaultIndonesiaCity,
  findNearestCity,
  getLocationLabel,
  searchIndonesiaCities,
} from '@/shared/utils/location';

const { width: screenWidth } = Dimensions.get('window');

type OnboardingSlide = {
  key: 'welcome' | 'location' | 'notification';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

const slides: OnboardingSlide[] = [
  {
    key: 'welcome',
    title: 'Assalamu Alaikum',
    subtitle: 'Teman ibadah harianmu. Jadwal sholat, Al-Quran, dan pengingat dalam satu app.',
    icon: <MaterialCommunityIcons name="mosque" size={88} color="#007322" />,
  },
  {
    key: 'location',
    title: 'Jadwal Sholat Akurat',
    subtitle: 'Izinkan akses lokasi agar jadwal sholat sesuai dengan kotamu.',
    icon: <MaterialCommunityIcons name="map-marker-radius-outline" size={88} color="#007322" />,
  },
  {
    key: 'notification',
    title: 'Jangan Sampai Ketinggalan',
    subtitle: 'Aktifkan notifikasi untuk pengingat adzan dan amalan harian.',
    icon: <Ionicons name="notifications-outline" size={88} color="#007322" />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cityQuery, setCityQuery] = useState('');
  const [isCityPickerVisible, setIsCityPickerVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState<IndonesiaCity>(defaultIndonesiaCity);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredCities = searchIndonesiaCities(cityQuery);
  const isLastSlide = activeIndex === slides.length - 1;

  function goToSlide(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }

  function goNext() {
    if (isLastSlide) {
      void completeOnboarding();
      return;
    }

    goToSlide(activeIndex + 1);
  }

  async function handleRequestLocation() {
    setStatusMessage(null);
    await setLocationRequested(true);

    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      setStatusMessage('Izin lokasi belum aktif. Kamu tetap bisa memilih kota manual.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    const nearestCity = findNearestCity(coordinates);

    await Promise.all([
      setInitialCoordinates(JSON.stringify(coordinates)),
      setSelectedCityCode(nearestCity.code),
    ]);

    setSelectedCity(nearestCity);
    setStatusMessage(`Lokasi disimpan: ${getLocationLabel(nearestCity)}`);
    goToSlide(2);
  }

  async function handleSelectCity(city: IndonesiaCity) {
    await Promise.all([setSelectedCityCode(city.code), setLocationRequested(true)]);
    setSelectedCity(city);
    setCityQuery('');
    setIsCityPickerVisible(false);
    setStatusMessage(`Kota dipilih: ${getLocationLabel(city)}`);
    goToSlide(2);
  }

  async function handleRequestNotification() {
    await requestNotificationPermission();
    await completeOnboarding();
  }

  async function completeOnboarding() {
    await setOnboardingCompleted(true);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
          setActiveIndex(nextIndex);
          setStatusMessage(null);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.illustrationWrap}>{item.icon}</View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>

            {item.key === 'location' ? (
              <View style={styles.actionBlock}>
                <Pressable style={styles.primaryButton} onPress={() => void handleRequestLocation()}>
                  <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Izinkan Lokasi</Text>
                </Pressable>
                <Pressable onPress={() => setIsCityPickerVisible(true)}>
                  <Text style={styles.linkText}>Pilih kota manual</Text>
                </Pressable>
                <Text style={styles.selectedCityText}>{getLocationLabel(selectedCity)}</Text>
              </View>
            ) : null}

            {item.key === 'notification' ? (
              <View style={styles.actionBlock}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => void handleRequestNotification()}>
                  <Ionicons name="notifications" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Aktifkan Notifikasi</Text>
                </Pressable>
                <Pressable onPress={() => void completeOnboarding()}>
                  <Text style={styles.linkText}>Nanti saja</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      />

      <View style={styles.footer}>
        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
        <View style={styles.dotsRow}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {slides[activeIndex]?.key === 'welcome' ? (
          <Pressable style={styles.primaryButton} onPress={goNext}>
            <Text style={styles.primaryButtonText}>Mulai</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        ) : null}

        {slides[activeIndex]?.key === 'location' ? (
          <Pressable style={styles.secondaryButton} onPress={goNext}>
            <Text style={styles.secondaryButtonText}>Lanjut</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={isCityPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCityPickerVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setIsCityPickerVisible(false)} />
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
                  <View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E7F0DE',
  },
  slide: {
    width: screenWidth,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 120,
  },
  illustrationWrap: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFF6',
    borderWidth: 1,
    borderColor: '#CFE4D3',
    marginBottom: 34,
  },
  title: {
    color: '#203025',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#56625A',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 330,
  },
  actionBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    marginTop: 34,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 28,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B8C7BB',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#007322',
  },
  primaryButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#F8FFF6',
    borderWidth: 1,
    borderColor: '#CFE4D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#007322',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  linkText: {
    color: '#007322',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  selectedCityText: {
    color: '#56625A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  statusText: {
    color: '#56625A',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '78%',
    backgroundColor: '#F8FFF6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#C6D4C9',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#203025',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  searchInput: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#E7F0DE',
    borderWidth: 1,
    borderColor: '#CFE4D3',
    paddingHorizontal: 14,
    color: '#203025',
    fontSize: 15,
    marginBottom: 10,
  },
  cityList: {
    paddingBottom: 28,
  },
  cityItem: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE9DF',
    gap: 14,
  },
  cityItemSelected: {
    backgroundColor: '#EAF8EE',
  },
  cityItemName: {
    color: '#203025',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  cityItemProvince: {
    color: '#66736B',
    fontSize: 13,
    lineHeight: 18,
  },
});
