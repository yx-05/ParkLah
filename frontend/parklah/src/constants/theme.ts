import { Platform } from 'react-native';

export const Theme = {
  colors: {
    surface: '#f7fafa',
    surfaceDim: '#d7dadb',
    surfaceBright: '#f7fafa',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f4f4',
    surfaceContainer: '#ebeeef',
    surfaceContainerHigh: '#e6e9e9',
    surfaceContainerHighest: '#e0e3e3',
    surfaceVariant: '#e0e3e3',
    surfaceIce: '#f2fbfe',
    
    onSurface: '#181c1d',
    onSurfaceVariant: '#3e494a',
    inverseSurface: '#2d3132',
    inverseOnSurface: '#eef1f2',
    
    outline: '#6f797a',
    outlineVariant: '#bec8ca',
    
    surfaceTint: '#006972',
    primary: '#00535b',
    onPrimary: '#ffffff',
    primaryContainer: '#006d77',
    onPrimaryContainer: '#9becf7',
    inversePrimary: '#82d3de',
    
    secondary: '#23676f',
    onSecondary: '#ffffff',
    secondaryContainer: '#adedf7',
    onSecondaryContainer: '#2b6d76',
    
    tertiary: '#713d10',
    onTertiary: '#ffffff',
    tertiaryContainer: '#8e5426',
    onTertiaryContainer: '#ffd7bd',
    tertiaryFixed: '#ffdcc5',
    
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',
    
    stormyTeal: '#006d77',
    pearlAqua: '#83c5be',
    darkTeal: '#004d54',
    actionBlue: '#007bff',
    starGold: '#ffb400',
    background: '#f7fafa',
    onBackground: '#181c1d',
  },
  typography: {
    fontFamily: {
      regular: 'Lexend_400Regular',
      medium: 'Lexend_500Medium',
      semiBold: 'Lexend_600SemiBold',
      bold: 'Lexend_700Bold',
    },
  },
  borderRadius: {
    sm: 8,
    default: 16,
    md: 24,
    lg: 32,
    xl: 48,
    full: 9999,
  },
  shadows: {
    soft: {
      shadowColor: '#006d77',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    floating: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    button: {
      shadowColor: '#006d77',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 4,
    },
  },
} as const;

export const Colors = {
  light: {
    text: Theme.colors.onSurface,
    background: Theme.colors.background,
    backgroundElement: Theme.colors.surfaceContainerLow,
    backgroundSelected: Theme.colors.surfaceContainerHighest,
    textSecondary: Theme.colors.onSurfaceVariant,
  },
  dark: {
    text: '#ffffff',
    background: '#121617',
    backgroundElement: '#1c2122',
    backgroundSelected: '#283032',
    textSecondary: '#a0acae',
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
