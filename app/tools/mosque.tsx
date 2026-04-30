import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sampleMosques = [
  {
    name: 'Masjid Nasional Al-Akbar Surabaya',
    address: 'Jl. Masjid Al-Akbar Timur No.1, Pagesangan',
    distance: '3.2 km',
    mapsQuery: 'Masjid Nasional Al-Akbar Surabaya',
  },
  {
    name: 'Masjid Rahmat Kembang Kuning',
    address: 'Jl. Kembang Kuning No.79, Surabaya',
    distance: '4.8 km',
    mapsQuery: 'Masjid Rahmat Kembang Kuning Surabaya',
  },
  {
    name: 'Masjid Cheng Hoo Surabaya',
    address: 'Jl. Gading No.2, Ketabang',
    distance: '6.1 km',
    mapsQuery: 'Masjid Cheng Hoo Surabaya',
  },
  {
    name: 'Masjid Al-Falah Surabaya',
    address: 'Jl. Raya Darmo No.137A, Darmo',
    distance: '7.4 km',
    mapsQuery: 'Masjid Al-Falah Surabaya',
  },
];

export default function MosqueScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Data masjid masih berupa sample lokal. Tombol navigasi akan membuka Google Maps.
        </Text>

        <View style={styles.listWrap}>
          {sampleMosques.map((mosque) => (
            <View key={mosque.name} style={styles.mosqueCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <MaterialIcons name="mosque" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.mosqueName}>{mosque.name}</Text>
                  <Text style={styles.mosqueAddress}>{mosque.address}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.distanceText}>{mosque.distance}</Text>
                <Pressable
                  style={styles.mapsButton}
                  onPress={() => void openMaps(mosque.mapsQuery)}>
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.mapsButtonText}>Maps</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

async function openMaps(query: string) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  await Linking.openURL(url);
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
    padding: 16,
    paddingBottom: 28,
  },
  description: {
    color: '#5E636A',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  listWrap: {
    gap: 12,
  },
  mosqueCard: {
    backgroundColor: '#F5FAEF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E6CB',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  mosqueName: {
    color: '#1D2A21',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  mosqueAddress: {
    color: '#66706A',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  distanceText: {
    color: '#007322',
    fontSize: 14,
    fontWeight: '800',
  },
  mapsButton: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#007322',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  mapsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
