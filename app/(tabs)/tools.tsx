import {
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { colors, radius, shadows, spacing, typography } from '@/src/theme';

const toolCards = [
  {
    key: 'quran',
    title: 'Al-Quran',
    description: 'Baca dan cari ayat',
    route: '/tools/quran',
    iconBackground: '#2F80ED',
    icon: <MaterialCommunityIcons name="book-open-page-variant-outline" size={38} color="#FFFFFF" />,
  },
  {
    key: 'ai',
    title: 'Tanya AI',
    description: 'Panduan ibadah ringan',
    route: '/tools/ai',
    iconBackground: '#7C3AED',
    icon: <MaterialCommunityIcons name="robot-outline" size={38} color="#FFFFFF" />,
  },
  {
    key: 'kiblat',
    title: 'Kiblat',
    description: 'Arah Ka’bah real-time',
    route: '/tools/qibla',
    iconBackground: colors.primary,
    icon: <MaterialCommunityIcons name="compass-outline" size={40} color="#FFFFFF" />,
  },
  {
    key: 'zakat',
    title: 'Zakat',
    description: 'Kalkulator lokal',
    route: '/tools/zakat',
    iconBackground: colors.accent,
    icon: <FontAwesome6 name="hand-holding-dollar" size={34} color="#FFFFFF" />,
  },
  {
    key: 'calendar',
    title: 'Kalender Islam',
    description: 'Hari besar Hijriah',
    route: '/tools/calendar',
    iconBackground: '#E86A33',
    icon: <MaterialCommunityIcons name="calendar-star-outline" size={38} color="#FFFFFF" />,
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
      speed: 28,
      bounciness: 7,
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
        <View style={styles.toolTextWrap}>
          <Text style={styles.toolTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.toolDescription} numberOfLines={1}>
            {description}
          </Text>
        </View>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alat Bantu</Text>
          <Text style={styles.headerSubtitle}>Lengkapi ibadahmu</Text>
        </View>

        <Pressable onPress={() => router.push('/tools/mosque')}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mosqueBanner}>
            <View style={styles.mosqueIconWrap}>
              <MaterialCommunityIcons name="mosque" size={42} color="#FFFFFF" />
            </View>
            <View style={styles.mosqueCopy}>
              <Text style={styles.mosqueTitle}>Masjid Terdekat</Text>
              <Text style={styles.mosqueSubtitle}>Temukan masjid dari posisimu sekarang</Text>
            </View>
            <View style={styles.mosqueButton}>
              <Text style={styles.mosqueButtonText}>Cari Sekarang</Text>
              <MaterialIcons name="arrow-forward" size={17} color={colors.primary} />
            </View>
          </LinearGradient>
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXXL,
    lineHeight: typography.fontSizeXXXL * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.fontSizeMD * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    marginTop: spacing.xs,
  },
  mosqueBanner: {
    minHeight: 154,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  mosqueIconWrap: {
    width: 62,
    height: 62,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  mosqueCopy: {
    paddingRight: spacing.md,
  },
  mosqueTitle: {
    color: '#FFFFFF',
    fontSize: typography.fontSizeXL,
    lineHeight: typography.fontSizeXL * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
  },
  mosqueSubtitle: {
    color: '#DDF4E4',
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    marginTop: spacing.xs,
  },
  mosqueButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  mosqueButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizeSM,
    lineHeight: typography.fontSizeSM * typography.lineHeightNormal,
    fontWeight: typography.fontWeightExtraBold,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  toolCardPressable: {
    width: '48%',
    aspectRatio: 1,
  },
  toolCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    ...shadows.sm,
  },
  toolIconWrap: {
    width: 66,
    height: 66,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  toolTextWrap: {
    width: '100%',
    alignItems: 'center',
  },
  toolTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    lineHeight: typography.fontSizeMD * typography.lineHeightTight,
    fontWeight: typography.fontWeightExtraBold,
    textAlign: 'center',
  },
  toolDescription: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    lineHeight: typography.fontSizeXS * typography.lineHeightNormal,
    fontWeight: typography.fontWeightMedium,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
