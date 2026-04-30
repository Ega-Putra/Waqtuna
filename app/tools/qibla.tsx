import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QiblaScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <MaterialCommunityIcons name="compass-outline" size={72} color="#007322" />
        <Text style={styles.title}>Fitur Kiblat segera hadir</Text>
        <Text style={styles.description}>Kompas kiblat akan diimplementasikan pada tahap berikutnya.</Text>
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
  },
  title: {
    color: '#1D2A21',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  description: {
    color: '#5E636A',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
});
