import { Stack } from 'expo-router';

export default function ToolsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#E7F0DE',
        },
        headerTintColor: '#007322',
        headerTitleStyle: {
          fontWeight: '800',
        },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="quran/index" options={{ title: 'Al-Quran' }} />
      <Stack.Screen name="quran/[surahId]" options={{ title: 'Baca Surat' }} />
      <Stack.Screen name="qibla" options={{ title: 'Kiblat' }} />
      <Stack.Screen name="zakat" options={{ title: 'Zakat Kalkulator' }} />
      <Stack.Screen name="mosque" options={{ title: 'Masjid Terdekat' }} />
      <Stack.Screen name="ai" options={{ title: 'Tanya AI' }} />
    </Stack>
  );
}
