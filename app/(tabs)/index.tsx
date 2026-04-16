import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  SimpleLineIcons,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const prayerItems = [
  {
    name: 'Subuh',
    time: '04:21',
    icon: <MaterialCommunityIcons name="weather-sunset-up" size={28} color="#FFFFFF" />,
  },
  {
    name: 'Dzuhur',
    time: '12:03',
    icon: <MaterialCommunityIcons name="white-balance-sunny" size={28} color="#FFFFFF" />,
  },
  {
    name: 'Ashar',
    time: '15:27',
    icon: <MaterialCommunityIcons name="weather-partly-cloudy" size={28} color="#FFFFFF" />,
  },
  {
    name: 'Maghrib',
    time: '18:12',
    icon: <MaterialCommunityIcons name="weather-night-partly-cloudy" size={28} color="#FFFFFF" />,
  },
  {
    name: 'Isya',
    time: '19:30',
    icon: <MaterialCommunityIcons name="moon-waning-crescent" size={28} color="#FFFFFF" />,
  },
];

function PrayerReminderCard({
  name,
  time,
  icon,
}: {
  name: string;
  time: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.prayerCard}>
      <View style={styles.prayerInfo}>
        <View style={styles.prayerIconWrap}>{icon}</View>
        <View style={styles.prayerTextBlock}>
          <Text style={styles.prayerName}>{name}</Text>
          <Text style={styles.prayerTime}>{time}</Text>
        </View>
      </View>

      <View style={styles.prayerActions}>
        <SimpleLineIcons name="bell" size={23} color="#FFFFFF" />
        <View style={styles.checkButton}>
          <MaterialIcons name="check" size={19} color="#A2ABB3" />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.appTitle}>Waqtuna</Text>

        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Assalamu Alaikum, Abi</Text>
          <Text style={styles.hijriDate}>27 Syawal, 1447</Text>
        </View>

        <View style={styles.overviewRow}>
          <View>
            <Text style={styles.dateTitle}>Rabu, 15 Apr</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={20} color="#000000" />
              <Text style={styles.locationText}>Surabaya, Idn</Text>
            </View>
          </View>

          <View style={styles.streakPill}>
            <MaterialCommunityIcons name="fire" size={15} color="#F97316" />
            <Text style={styles.streakText}>7 Hari Beruntun</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCircle} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Dzuhur</Text>
            <Text style={styles.heroTime}>11.35</Text>
            <View style={styles.countdownRow}>
              <MaterialCommunityIcons name="clock-outline" size={19} color="#FFFFFF" />
              <Text style={styles.countdownText}>1j 23m hingga dzuhur</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pengingat Ibadah</Text>
          <View style={styles.moreWrap}>
            <Text style={styles.moreText}>Lebih Banyak</Text>
            <MaterialIcons name="arrow-forward" size={22} color="#007322" />
          </View>
        </View>

        <View style={styles.listWrap}>
          {prayerItems.map((item) => (
            <PrayerReminderCard key={item.name} name={item.name} time={item.time} icon={item.icon} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    gap: 4,
  },
  locationText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 28,
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
  listWrap: {
    gap: 10,
  },
  prayerCard: {
    minHeight: 80,
    borderRadius: 24,
    backgroundColor: '#4CB15F',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
