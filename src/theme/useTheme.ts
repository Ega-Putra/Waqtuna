import { useColorScheme } from 'react-native';

import {
  colors,
  darkColors,
  radius,
  shadows,
  spacing,
  typography,
  type AppTheme,
} from '@/src/theme';

export function useTheme(): AppTheme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : colors,
    typography,
    spacing,
    radius,
    shadows,
  };
}
