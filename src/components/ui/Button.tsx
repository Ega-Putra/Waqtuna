import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/src/theme/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  function Button(
    {
      title,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      style,
      ...props
    },
    ref
  ) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const isDisabled = disabled || loading;
    const variantStyle = getVariantStyle(theme, variant);
    const sizeStyle = getSizeStyle(theme, size);

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        disabled={isDisabled}
        style={(state) => {
          const { pressed } = state;

          return [
            styles.base,
            sizeStyle.container,
            variantStyle.container,
            pressed && !isDisabled ? variantStyle.pressed : null,
            isDisabled ? styles.disabled : null,
            typeof style === 'function' ? style(state) : style,
          ];
        }}
        {...props}>
        {loading ? (
          <ActivityIndicator size="small" color={variantStyle.text.color} />
        ) : (
          <>
            {leftIcon}
            <Text style={[styles.text, sizeStyle.text, variantStyle.text]}>{title}</Text>
            {rightIcon}
          </>
        )}
      </Pressable>
    );
  }
);

function getVariantStyle(
  theme: ReturnType<typeof useTheme>,
  variant: ButtonVariant
): {
  container: ViewStyle;
  pressed: ViewStyle;
  text: TextStyle & { color: string };
} {
  const variants: Record<ButtonVariant, ReturnType<typeof getVariantStyle>> = {
    primary: {
      container: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      pressed: {
        backgroundColor: theme.colors.primaryDark,
        borderColor: theme.colors.primaryDark,
      },
      text: {
        color: '#FFFFFF',
      },
    },
    secondary: {
      container: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.border,
      },
      pressed: {
        backgroundColor: theme.colors.surfaceSecondary,
      },
      text: {
        color: theme.colors.primaryDark,
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      pressed: {
        backgroundColor: theme.colors.surfaceSecondary,
      },
      text: {
        color: theme.colors.primary,
      },
    },
    danger: {
      container: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
      },
      pressed: {
        opacity: 0.82,
      },
      text: {
        color: '#FFFFFF',
      },
    },
  };

  return variants[variant];
}

function getSizeStyle(
  theme: ReturnType<typeof useTheme>,
  size: ButtonSize
): {
  container: ViewStyle;
  text: TextStyle;
} {
  const sizes: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: {
      container: {
        minHeight: 36,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.md,
      },
      text: {
        fontSize: theme.typography.fontSizeSM,
      },
    },
    md: {
      container: {
        minHeight: 44,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
      },
      text: {
        fontSize: theme.typography.fontSizeMD,
      },
    },
    lg: {
      container: {
        minHeight: 52,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.lg,
      },
      text: {
        fontSize: theme.typography.fontSizeLG,
      },
    },
  };

  return sizes[size];
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      borderWidth: 1,
    },
    text: {
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: theme.typography.fontSizeMD * theme.typography.lineHeightNormal,
      textAlign: 'center',
    },
    disabled: {
      opacity: 0.52,
    },
  });
}
