import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const nearbyMosqueMapsUrl = 'https://www.google.com/maps/search/masjid+terdekat/';

export default function MosqueScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleOpenMaps() {
    try {
      setErrorMessage(null);
      await Linking.openURL(nearbyMosqueMapsUrl);
    } catch {
      setErrorMessage('Google Maps tidak bisa dibuka. Coba lagi beberapa saat.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="mosque" size={72} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Masjid Terdekat</Text>
        <Text style={styles.description}>Temukan masjid terdekat dari posisi kamu sekarang</Text>

        <Pressable style={styles.primaryButton} onPress={() => void handleOpenMaps()}>
          <MaterialIcons name="map" size={22} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Cari Masjid Terdekat</Text>
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#E7F0DE',
  },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: '#007322',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    color: '#1D2A21',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#5E636A',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#007322',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 14,
  },
});
