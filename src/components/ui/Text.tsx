import { forwardRef } from 'react';
import {
  Text as RNText,
  StyleSheet,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';

import { useTheme } from '@/src/theme/useTheme';

export type TextPreset = 'heading' | 'subheading' | 'body' | 'caption' | 'label' | 'muted';

export type TextProps = RNTextProps & {
  preset?: TextPreset;
  color?: string;
};

export const Text = forwardRef<RNText, TextProps>(function Text(
  { preset = 'body', color, style, ...props },
  ref
) {
  const theme = useTheme();
  const presetStyle = createPresetStyle(theme)[preset];

  return (
    <RNText
      ref={ref}
      style={[presetStyle, color ? { color } : null, style]}
      {...props}
    />
  );
});

function createPresetStyle(theme: ReturnType<typeof useTheme>): Record<TextPreset, TextStyle> {
  return StyleSheet.create({
    heading: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizeXXXL,
      fontWeight: theme.typography.fontWeightExtraBold,
      lineHeight: theme.typography.fontSizeXXXL * theme.typography.lineHeightTight,
    },
    subheading: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizeXXL,
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: theme.typography.fontSizeXXL * theme.typography.lineHeightTight,
    },
    body: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizeMD,
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: theme.typography.fontSizeMD * theme.typography.lineHeightNormal,
    },
    caption: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.fontSizeSM,
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: theme.typography.fontSizeSM * theme.typography.lineHeightNormal,
    },
    label: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSizeSM,
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: theme.typography.fontSizeSM * theme.typography.lineHeightNormal,
    },
    muted: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.fontSizeSM,
      fontWeight: theme.typography.fontWeightRegular,
      lineHeight: theme.typography.fontSizeSM * theme.typography.lineHeightNormal,
    },
  });
}
