import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Colors, getThemeColors } from '../../theme/colors';
import { Layout, Typography, Shadows } from '../../theme/spacing';
import { useColorScheme } from 'react-native';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  onPressIn,
  onPressOut,
  style,
  children,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    onPressOut?.(e);
  };

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Layout.borderRadius.md,
      paddingHorizontal:
        size === 'small'
          ? Layout.cardPaddingSmall
          : size === 'large'
            ? Layout.cardPaddingLarge
            : Layout.cardPadding,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: { height: Layout.buttonHeightSmall },
      medium: { height: Layout.buttonHeight },
      large: { height: Layout.buttonHeightLarge },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? colors.neutral[300] : colors.primary[500],
        ...Shadows.md,
      },
      secondary: {
        backgroundColor: disabled ? colors.neutral[100] : colors.neutral[100],
        borderWidth: Layout.borderWidth.regular,
        borderColor: disabled ? colors.border.light : colors.border.medium,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: disabled ? colors.neutral[300] : colors.danger[500],
        ...Shadows.md,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyles = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
      },
      medium: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
      },
      large: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
      },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: colors.text.inverse },
      secondary: { color: colors.text.primary },
      ghost: { color: colors.primary[500] },
      danger: { color: colors.text.inverse },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();

  return (
    <AnimatedTouchable
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[buttonStyles, animatedStyle, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={
            variant === 'secondary' || variant === 'ghost'
              ? colors.primary[500]
              : colors.text.inverse
          }
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text
            style={[
              textStyles,
              icon
                ? {
                    marginLeft: iconPosition === 'left' ? 8 : 0,
                    marginRight: iconPosition === 'right' ? 8 : 0,
                  }
                : undefined,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </AnimatedTouchable>
  );
};
