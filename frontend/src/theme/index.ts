// Custom color palette for Smart Hockey Coach
const customColors = {
  primary: {
    100: '#FFE5EC',
    200: '#FFCCD9',
    300: '#FF99B3',
    400: '#FF668C',
    500: '#FF3366', // Main brand color
    600: '#CC2952',
    700: '#991F3D',
    800: '#661429',
    900: '#330A14',
  },
  success: {
    100: '#E8F9F0',
    200: '#D2F3E1',
    300: '#A5E7C3',
    400: '#78DBA5',
    500: '#4BCF87', // Success green
    600: '#3CA66C',
    700: '#2D7D51',
    800: '#1E5336',
    900: '#0F2A1B',
  },
  info: {
    100: '#E5F0FF',
    200: '#CCE1FF',
    300: '#99C4FF',
    400: '#66A6FF',
    500: '#3389FF', // Info blue
    600: '#296DCC',
    700: '#1F5299',
    800: '#143666',
    900: '#0A1B33',
  },
  warning: {
    100: '#FFF7E5',
    200: '#FFEFCC',
    300: '#FFDF99',
    400: '#FFCF66',
    500: '#FFBF33', // Warning amber
    600: '#CC9929',
    700: '#99731F',
    800: '#664C14',
    900: '#33260A',
  },
  danger: {
    100: '#FFE5E5',
    200: '#FFCCCC',
    300: '#FF9999',
    400: '#FF6666',
    500: '#FF3333', // Danger red
    600: '#CC2929',
    700: '#991F1F',
    800: '#661414',
    900: '#330A0A',
  },
};

// Custom theme configurations
export const customLightTheme = {
  ...customColors,
  'background-basic-color-1': '#FFFFFF',
  'background-basic-color-2': '#F7F9FC',
  'background-basic-color-3': '#EDF1F7',
  'background-basic-color-4': '#E4E9F2',
  'text-basic-color': '#222B45',
  'text-hint-color': '#8F9BB3',
  'text-disabled-color': '#C5CEE0',
  'border-basic-color-1': '#FFFFFF',
  'border-basic-color-2': '#F7F9FC',
  'border-basic-color-3': '#EDF1F7',
  'border-basic-color-4': '#E4E9F2',
  'border-basic-color-5': '#C5CEE0',
};

export const customDarkTheme = {
  ...customColors,
  'background-basic-color-1': '#222B45',
  'background-basic-color-2': '#1A2138',
  'background-basic-color-3': '#151A30',
  'background-basic-color-4': '#101426',
  'text-basic-color': '#FFFFFF',
  'text-hint-color': '#8F9BB3',
  'text-disabled-color': '#4E5A7A',
  'border-basic-color-1': '#222B45',
  'border-basic-color-2': '#1A2138',
  'border-basic-color-3': '#151A30',
  'border-basic-color-4': '#101426',
  'border-basic-color-5': '#2E3A59',
};

// Typography configuration
export const typography = {
  heading: {
    fontFamily: 'System',
    fontWeight: '700' as const,
  },
  subheading: {
    fontFamily: 'System',
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    fontSize: 12,
  },
};

// Spacing configuration
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius configuration
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};
