import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useCallback } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue
} from 'react-native-reanimated';

const TABS = [
  { name: 'index',    label: 'Pengingat', icon: 'bell-ring-outline'  },
  { name: 'tools',   label: 'Alat Bantu', icon: 'view-grid-outline'  },
  { name: 'settings',label: 'Pengaturan', icon: 'cog-outline'        },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HORIZONTAL_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_HORIZONTAL_MARGIN * 2;
const TAB_WIDTH = TAB_BAR_WIDTH / TABS.length;

const SPRING = { damping: 18, stiffness: 200, mass: 0.8 };

function AnimatedTabItem({
  tab,
  index,
  activeIndex,
  onPress,
}: {
  tab: (typeof TABS)[number];
  index: number;
  activeIndex: SharedValue<number>;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.88, SPRING, () => {
      scale.value = withSpring(1, SPRING);
    });
    onPress();
  }, [onPress, scale]);

  const animStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;
    const color = interpolateColor(
      isActive ? 1 : 0,
      [0, 1],
      ['#8FA097', '#007322']
    );
    return {
      transform: [{ scale: scale.value }],
      opacity: withTiming(isActive ? 1 : 0.75, { duration: 180 })
    };
  });

  const iconColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activeIndex.value === index ? 1 : 0,
      [0, 1],
      ['#8FA097', '#007322']
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      activeIndex.value === index ? 1 : 0,
      [0, 1],
      ['#8FA097', '#007322']
    ),
    fontWeight: activeIndex.value === index ? '700' : '500',
  }));

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabItemInner, animStyle]}>
        <MaterialCommunityIcons
          // @ts-ignore
          name={tab.icon}
          size={22}
          color="#007322"
          style={{ opacity: 0.5 }} // hidden — just for layout
        />
        <Animated.Text style={[styles.tabLabel, labelStyle]}>
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const activeIndex = useSharedValue(state.index);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(activeIndex.value * TAB_WIDTH, SPRING),
      },
    ],
  }));

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {/* Sliding pill */}
        <Animated.View style={[styles.pill, pillStyle]} />

        {TABS.map((tab, i) => {
          const isFocused = state.index === i;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                activeIndex.value = i;
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[i].key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(state.routes[i].name);
                }
              }}
              style={styles.tabItem}
            >
              <MaterialCommunityIcons
                // @ts-ignore
                name={tab.icon}
                size={22}
                color={isFocused ? '#007322' : '#8FA097'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tools" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: TAB_BAR_HORIZONTAL_MARGIN,
    right: TAB_BAR_HORIZONTAL_MARGIN,
  },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#1A4D2E',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    width: TAB_WIDTH - 8,
    height: 46,
    borderRadius: 26,
    backgroundColor: '#E8F5EB',
    left: 4,
  },
  tabItem: {
    width: TAB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
  },
  tabItemInner: {
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#007322',
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: '#8FA097',
  },
});
