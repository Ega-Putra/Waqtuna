import { Image } from 'expo-image';
import {
  Feather,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const mapImage =
  'https://www.figma.com/api/mcp/asset/815ef910-5505-484b-94fc-60804c0f6858';

const nearbyMosques = [
  'Masjid Al-Falah (15m)',
  'Masjid Al-Ikhlas (20m)',
  'Masjid An-Nur (25m)',
];

const toolCards = [
  {
    key: 'quran',
    title: 'Al-Quran',
    icon: <MaterialCommunityIcons name="book-open-page-variant-outline" size={54} color="#FFFFFF" />,
  },
  {
    key: 'ai',
    title: 'Tanya\nAI',
    icon: <MaterialCommunityIcons name="robot-outline" size={54} color="#FFFFFF" />,
  },
  {
    key: 'kiblat',
    title: 'Kiblat',
    icon: <MaterialCommunityIcons name="compass-outline" size={54} color="#FFFFFF" />,
  },
  {
    key: 'zakat',
    title: 'Zakat\nKalkulator',
    icon: <FontAwesome6 name="hand-holding-dollar" size={46} color="#FFFFFF" />,
  },
];

function MosqueRow({ name }: { name: string }) {
  return (
    <View style={styles.mosqueRow}>
      <Text style={styles.mosqueRowText}>{name}</Text>
      <Feather name="send" size={24} color="#FFFFFF" />
    </View>
  );
}

function ToolCard({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <View style={styles.toolCard}>
      {icon}
      <Text style={styles.toolCardText}>{title}</Text>
    </View>
  );
}

export default function ToolsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.appTitle}>Waqtuna</Text>

        <View style={styles.nearbyCard}>
          <Text style={styles.nearbyTitle}>Masjid Terdekat</Text>

          <View style={styles.mapWrap}>
            <Image source={{ uri: mapImage }} style={styles.mapImage} contentFit="cover" />
            <View style={styles.locateButton}>
              <MaterialIcons name="my-location" size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.mosqueList}>
            {nearbyMosques.map((mosque) => (
              <MosqueRow key={mosque} name={mosque} />
            ))}
          </View>
        </View>

        <View style={styles.toolsGrid}>
          {toolCards.map((card) => (
            <ToolCard key={card.key} title={card.title} icon={card.icon} />
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
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  appTitle: {
    color: '#007322',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 22,
  },
  nearbyCard: {
    backgroundColor: '#00813A',
    borderRadius: 24,
    padding: 10,
    marginBottom: 28,
  },
  nearbyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  mapWrap: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#47AC5E',
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 10,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  locateButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#00813A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosqueList: {
    gap: 10,
  },
  mosqueRow: {
    backgroundColor: '#47AC5E',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mosqueRowText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flexShrink: 1,
    paddingRight: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  toolCard: {
    width: '48.7%',
    minHeight: 120,
    backgroundColor: '#00813A',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  toolCardText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
});
