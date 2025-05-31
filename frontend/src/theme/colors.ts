/**
 * Smart Hockey Coach - Color System
 * Optimized for performance and accessibility
 */

export const Colors = {
  // Primary Brand Colors
  primary: {
    50: '#FFE5EC',
    100: '#FFCCD9',
    200: '#FF99B3',
    300: '#FF668C',
    400: '#FF4D76',
    500: '#FF3366', // Main brand color
    600: '#E62E5C',
    700: '#CC2952',
    800: '#B32448',
    900: '#991F3D',
  },

  // Semantic Colors
  success: {
    50: '#E8F9F0',
    100: '#D2F3E1',
    200: '#A5E7C3',
    300: '#78DBA5',
    400: '#5FD496',
    500: '#4BCF87', // Success green
    600: '#44BA7A',
    700: '#3CA66C',
    800: '#35915F',
    900: '#2D7D51',
  },

  info: {
    50: '#E5F0FF',
    100: '#CCE1FF',
    200: '#99C4FF',
    300: '#66A6FF',
    400: '#4D97FF',
    500: '#3389FF', // Info blue
    600: '#2E7AE6',
    700: '#296DCC',
    800: '#245FB3',
    900: '#1F5299',
  },

  warning: {
    50: '#FFF7E5',
    100: '#FFEFCC',
    200: '#FFDF99',
    300: '#FFCF66',
    400: '#FFC74D',
    500: '#FFBF33', // Warning amber
    600: '#E6AC2E',
    700: '#CC9929',
    800: '#B38624',
    900: '#99731F',
  },

  danger: {
    50: '#FFE5E5',
    100: '#FFCCCC',
    200: '#FF9999',
    300: '#FF6666',
    400: '#FF4D4D',
    500: '#FF3333', // Danger red
    600: '#E62E2E',
    700: '#CC2929',
    800: '#B32424',
    900: '#991F1F',
  },

  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFBFC',
    100: '#F5F7FA',
    200: '#E9ECF2',
    300: '#DDE1E9',
    400: '#C8CED9',
    500: '#A3ADBF',
    600: '#7E8B9F',
    700: '#5A6A81',
    800: '#3C4859',
    900: '#1E2631',
    1000: '#0A0E17',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    tertiary: '#E9ECF2',
    inverse: '#1E2631',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#1E2631',
    secondary: '#5A6A81',
    tertiary: '#7E8B9F',
    inverse: '#FFFFFF',
    disabled: '#A3ADBF',
    link: '#3389FF',
  },

  // Border Colors
  border: {
    light: '#E9ECF2',
    medium: '#DDE1E9',
    dark: '#C8CED9',
    focus: '#3389FF',
    error: '#FF3333',
  },

  // Special Purpose
  recording: {
    active: '#FF3333',
    paused: '#FFBF33',
    processing: '#3389FF',
  },

  ml: {
    confidence: {
      high: '#4BCF87',
      medium: '#FFBF33',
      low: '#FF3333',
    },
    detection: {
      shot: '#FF3366',
      motion: '#3389FF',
      idle: '#A3ADBF',
    },
  },
} as const;

// Dark Mode Colors
export const DarkColors = {
  ...Colors,

  background: {
    primary: '#0A0E17',
    secondary: '#1E2631',
    tertiary: '#3C4859',
    inverse: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.1)',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#C8CED9',
    tertiary: '#A3ADBF',
    inverse: '#1E2631',
    disabled: '#5A6A81',
    link: '#66A6FF',
  },

  border: {
    light: '#3C4859',
    medium: '#5A6A81',
    dark: '#7E8B9F',
    focus: '#66A6FF',
    error: '#FF6666',
  },
} as const;

/**
 * Get color with opacity
 */
export const withOpacity = (color: string, opacity: number): string => {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const values = color.match(/[\d.]+/g);
    if (values && values.length >= 3) {
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
    }
  }

  return color;
};

/**
 * Theme-aware color getter
 */
export const getThemeColors = (isDark: boolean) => {
  return isDark ? DarkColors : Colors;
};

export type ColorScheme = typeof Colors;
export type ColorKeys = keyof typeof Colors;
export type PrimaryColors = keyof typeof Colors.primary;
