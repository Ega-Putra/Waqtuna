import type { ViewStyle } from 'react-native';

export type ColorTokens = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
  accent: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  warning: string;
  success: string;
};

export const colors = {
  primary: '#007322',
  primaryDark: '#005C1C',
  primaryLight: '#DDF4E4',
  primarySoft: '#F0FAF3',
  accent: '#C9A84C',
  background: '#F7F9F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F4F0',
  textPrimary: '#1A2E1E',
  textSecondary: '#5A7060',
  textMuted: '#95AA99',
  border: '#D8E8DC',
  error: '#D0342C',
  warning: '#C67D11',
  success: '#007322',
} as const satisfies ColorTokens;

export const darkColors = {
  primary: '#40C96B',
  primaryDark: '#1FA24A',
  primaryLight: '#1F4A2A',
  primarySoft: '#14271A',
  accent: '#E0C96A',
  background: '#0E1810',
  surface: '#1A2B1E',
  surfaceSecondary: '#223827',
  textPrimary: '#ECF7EE',
  textSecondary: '#B7C9BB',
  textMuted: '#829589',
  border: '#315239',
  error: '#FF746D',
  warning: '#F4B84D',
  success: '#40C96B',
} as const satisfies ColorTokens;

export const typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 17,
  fontSizeXL: 20,
  fontSizeXXL: 24,
  fontSizeXXXL: 30,
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemiBold: '600',
  fontWeightBold: '700',
  fontWeightExtraBold: '800',
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  md: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
} as const satisfies Record<string, ViewStyle>;

export const theme = {
  colors,
  darkColors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type ThemeColors = ColorTokens;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
export type ThemeRadius = typeof radius;
export type ThemeShadows = typeof shadows;
export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
};
