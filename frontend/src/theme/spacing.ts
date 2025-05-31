/**
 * Smart Hockey Coach - Spacing System
 * Based on 4px grid for consistency
 */

export const Spacing = {
  // Base unit (4px)
  unit: 4,

  // Spacing scale
  none: 0,
  xxs: 2, // 2px
  xs: 4, // 4px
  sm: 8, // 8px
  md: 16, // 16px
  lg: 24, // 24px
  xl: 32, // 32px
  xxl: 48, // 48px
  xxxl: 64, // 64px
} as const;

export const Layout = {
  // Screen padding
  screenPadding: Spacing.md,
  screenPaddingSmall: Spacing.sm,
  screenPaddingLarge: Spacing.lg,

  // Card padding
  cardPadding: Spacing.md,
  cardPaddingSmall: Spacing.sm,
  cardPaddingLarge: Spacing.lg,

  // Component spacing
  componentSpacing: Spacing.md,
  sectionSpacing: Spacing.xl,

  // Safe areas
  safeAreaTop: 44, // iOS notch
  safeAreaBottom: 34, // iOS home indicator

  // Common dimensions
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,

  inputHeight: 48,
  inputHeightSmall: 36,
  inputHeightLarge: 56,

  iconSize: 24,
  iconSizeSmall: 16,
  iconSizeLarge: 32,

  avatarSize: 40,
  avatarSizeSmall: 32,
  avatarSizeLarge: 56,

  // Border radius
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 9999,
  },

  // Border width
  borderWidth: {
    none: 0,
    thin: 0.5,
    regular: 1,
    medium: 2,
    thick: 3,
  },
} as const;

export const Typography = {
  // Font sizes
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
    displayLarge: 40,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Font weights
  fontWeight: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
    widest: 1,
  },
} as const;

export const Animation = {
  // Duration in milliseconds
  duration: {
    instant: 0,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
    slowest: 1000,
  },

  // Easing functions (for reanimated)
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },

  // Spring configurations
  spring: {
    gentle: {
      damping: 15,
      stiffness: 150,
    },
    wobbly: {
      damping: 10,
      stiffness: 180,
    },
    stiff: {
      damping: 20,
      stiffness: 300,
    },
    slow: {
      damping: 20,
      stiffness: 60,
    },
  },
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

/**
 * Responsive helpers
 */
export const responsive = {
  isSmallDevice: (width: number) => width < 375,
  isMediumDevice: (width: number) => width >= 375 && width < 768,
  isLargeDevice: (width: number) => width >= 768,

  spacing: (width: number, small: number, medium: number, large: number) => {
    if (width < 375) return small;
    if (width < 768) return medium;
    return large;
  },

  fontSize: (width: number, small: number, medium: number, large: number) => {
    if (width < 375) return small;
    if (width < 768) return medium;
    return large;
  },
};

export type SpacingKeys = keyof typeof Spacing;
export type LayoutKeys = keyof typeof Layout;
export type TypographyKeys = keyof typeof Typography;
