import { useColorScheme } from 'react-native';

import { colors, darkColors, radius, shadows, spacing, typography } from './index';
import type { AppTheme } from './index';

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
