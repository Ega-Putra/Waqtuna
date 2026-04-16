import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

export default function ToolsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="home-city-outline" size={46} color="#007322" />
        </View>
        <Text style={styles.title}>Alat Bantu</Text>
        <Text style={styles.description}>
          Halaman alat bantu sudah disiapkan dan siap diisi fitur berikutnya.
        </Text>
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
    backgroundColor: '#E7F0DE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#D7E6CB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1D2A21',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5E636A',
    textAlign: 'center',
  },
});
