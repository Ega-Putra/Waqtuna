import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getOnboardingCompleted } from '@/src/services/PreferenceService';
import { PuasaReminderService } from '@/src/services/PuasaReminderService';
import {
  updateAllHomeWidgets,
  updateDailyPrayerWidget,
  updateNextPrayerWidget,
} from '@/src/services/WidgetUpdateService';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    void PuasaReminderService.scheduleAll();
    void updateAllHomeWidgets();

    const minuteRefresh = setInterval(() => {
      void updateNextPrayerWidget();
    }, 60_000);
    let midnightRefresh: ReturnType<typeof setTimeout> | null = null;

    function scheduleMidnightRefresh() {
      midnightRefresh = setTimeout(() => {
        void updateDailyPrayerWidget();
        scheduleMidnightRefresh();
      }, getMillisecondsUntilNextMidnight());
    }

    scheduleMidnightRefresh();

    return () => {
      clearInterval(minuteRefresh);

      if (midnightRefresh) {
        clearTimeout(midnightRefresh);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkOnboarding() {
      const completed = await getOnboardingCompleted();

      if (!isMounted) {
        return;
      }

      setIsOnboardingCompleted(completed);
      setIsCheckingOnboarding(false);
    }

    void checkOnboarding();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isCheckingOnboarding || isOnboardingCompleted === null) {
      return;
    }

    const isOnboardingRoute = segments[0] === 'onboarding';

    if (!isOnboardingCompleted && !isOnboardingRoute) {
      router.replace('/onboarding');
      return;
    }

    if (isOnboardingCompleted && isOnboardingRoute) {
      router.replace('/(tabs)');
    }
  }, [isCheckingOnboarding, isOnboardingCompleted, router, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="onboarding">
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tools" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function getMillisecondsUntilNextMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);

  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 5, 0);

  return nextMidnight.getTime() - now.getTime();
}
