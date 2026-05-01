import {
  FontAwesome6,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '@/theme';

const toolCards = [
  {
    key: 'quran',
    title: 'Al-Quran',
    description: 'Baca dan cari ayat',
    route: '/tools/quran',
    iconBackground: '#2F80ED',
    icon: (
      <MaterialCommunityIcons
        name="book-open-page-variant-outline"
        size={46}
        color="#FFFFFF"
      />
    ),
  },
  {
    key: 'ai',
    title: 'Tanya AI',
    description: 'Panduan ibadah',
    route: '/tools/ai',
    iconBackground: '#7C3AED',
    icon: <MaterialCommunityIcons name="robot-outline" size={44} color="#FFFFFF" />,
  },
  {
    key: 'kiblat',
    title: 'Kiblat',
    description: 'Arah Ka’bah real-time',
    route: '/tools/qibla',
    iconBackground: '#EDB12F',
    icon: <MaterialCommunityIcons name="compass-outline" size={46} color="#FFFFFF" />,
  },
  {
    key: 'zakat',
    title: 'Zakat',
    description: 'Kalkulator zakat',
    route: '/tools/zakat',
    iconBackground: '#2DDE7D',
    icon: <FontAwesome6 name="hand-holding-dollar" size={40} color="#FFFFFF" />,
  },
  {
    key: 'calendar',
    title: 'Kalender Islam',
    description: 'Hari besar Hijriah',
    route: '/tools/calendar',
    iconBackground: '#ED582F',
    icon: <MaterialCommunityIcons name="calendar-month-outline" size={44} color="#FFFFFF" />,
  },
] as const;

function ToolCard({
  title,
  description,
  icon,
  iconBackground,
  route,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBackground: string;
  route: (typeof toolCards)[number]['route'];
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateScale(value: number) {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  }

  return (
    <Pressable
      style={styles.toolCardPressable}
      onPress={() => router.push(route)}
      onPressIn={() => animateScale(0.97)}
      onPressOut={() => animateScale(1)}>
      <Animated.View style={[styles.toolCard, { transform: [{ scale }] }]}>
        <View style={[styles.toolIconWrap, { backgroundColor: iconBackground }]}>{icon}</View>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolDescription}>{description}</Text>
      </Animated.View>
    </Pressable>
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

        <Pressable
          style={styles.bannerPressable}
          onPress={() => router.push('/tools/mosque')}>
          <View style={styles.mosqueBanner}>
            <View style={styles.mosqueIconWrap}>
              <MaterialCommunityIcons name="mosque-outline" size={46} color="#FFFFFF" />
            </View>

            <Text style={styles.mosqueTitle}>Masjid Terdekat</Text>
            <Text style={styles.mosqueSubtitle}>
              Temukan Masjid Dari Posisimu Sekarang
            </Text>

            <View style={styles.mosqueButton}>
              <Text style={styles.mosqueButtonText}>Cari Sekarang</Text>
              <MaterialCommunityIcons
                name="send-outline"
                size={22}
                color={colors.primary}
                style={styles.mosqueButtonIcon}
              />
            </View>
          </View>
        </Pressable>

        <View style={styles.toolsGrid}>
          {toolCards.map((card) => (
            <ToolCard
              key={card.key}
              title={card.title}
              description={card.description}
              icon={card.icon}
              iconBackground={card.iconBackground}
              route={card.route}
            />
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
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 120,
  },
  appTitle: {
    color: colors.primary,
    fontSize: typography.fontSizeXL,
    lineHeight: 28,
    fontWeight: typography.fontWeightBold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  bannerPressable: {
    marginBottom: spacing.xl,
  },
  mosqueBanner: {
    backgroundColor: '#00813A',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    ...shadows.md,
  },
  mosqueIconWrap: {
    width: 70,
    height: 70,
    borderRadius: radius.full,
    backgroundColor: '#47AC5E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  mosqueTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: typography.fontWeightExtraBold,
  },
  mosqueSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: typography.fontWeightBold,
    marginTop: spacing.xs,
  },
  mosqueButton: {
    alignSelf: 'flex-start',
    minHeight: 50,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  mosqueButtonText: {
    color: '#00813A',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: typography.fontWeightExtraBold,
  },
  mosqueButtonIcon: {
    transform: [{ rotate: '-20deg' }],
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  toolCardPressable: {
    width: '48.5%',
  },
  toolCard: {
    minHeight: 186,
    backgroundColor: '#00813A',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 28,
    ...shadows.sm,
  },
  toolIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  toolTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: typography.fontWeightExtraBold,
    textAlign: 'center',
  },
  toolDescription: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: typography.fontWeightBold,
    textAlign: 'center',
    marginTop: 8,
  },
});
