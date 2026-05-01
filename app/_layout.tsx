import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { getOnboardingCompleted } from '@/services/PreferenceService';
import { useColorScheme } from '@/shared/hooks/useColorScheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;

    async function guardOnboardingRoute() {
      const isOnboardingCompleted = await getOnboardingCompleted();

      if (!isMounted) {
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
    }

    void guardOnboardingRoute();

    return () => {
      isMounted = false;
    };
  }, [router, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        initialRouteName="onboarding"
        screenOptions={{
          statusBarTranslucent: false,
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tools" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
