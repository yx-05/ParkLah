export const ThemeColors = {
  // Aegean Drift Palette
  surface: '#f7fafa',
  surfaceDim: '#d7dadb',
  surfaceBright: '#f7fafa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f4f4',
  surfaceContainer: '#ebeeef',
  surfaceContainerHigh: '#e6e9e9',
  surfaceContainerHighest: '#e0e3e3',
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
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  primaryFixed: '#9ff0fb',
  primaryFixedDim: '#82d3de',
  onPrimaryFixed: '#001f23',
  onPrimaryFixedVariant: '#004f56',
  secondaryFixed: '#adedf7',
  secondaryFixedDim: '#91d1da',
  onSecondaryFixed: '#001f23',
  onSecondaryFixedVariant: '#004f56',
  tertiaryFixed: '#ffdcc5',
  tertiaryFixedDim: '#ffb783',
  onTertiaryFixed: '#301400',
  onTertiaryFixedVariant: '#6d390c',
  background: '#f7fafa',
  onBackground: '#181c1d',
  surfaceVariant: '#e0e3e3',
  actionBlue: '#007bff',
  surfaceIce: '#f2fbfe',
  starGold: '#ffb400',
  stormyTeal: '#006d77',
  darkTeal: '#00535b',
  pearlAqua: '#82d3de',

  // Utility accents
  primaryDark: '#00434a',
  primaryLight: '#82d3de',
  slateDark: '#181c1d',
  slateLight: '#3e494a',
  slateBorder: '#bec8ca',
  amberAccent: '#ffb400',
  surfaceLight: '#f7fafa',
  surfaceWhite: '#ffffff',
  errorRed: '#ba1a1a',
  successGreen: '#10B981',
  textPrimary: '#181c1d',
  textSecondary: '#3e494a',
  textMuted: '#6f797a',
};

export const Colors = {
  ...ThemeColors,
  light: {
    ...ThemeColors,
    background: '#f7fafa',
    text: '#181c1d',
  },
  dark: {
    ...ThemeColors,
    background: '#181c1d',
    text: '#f7fafa',
    surface: '#2d3132',
    surfaceContainerLowest: '#1e2223',
  },
};

export const Typography = {
  fontFamily: {
    regular: 'Lexend-Regular',
    medium: 'Lexend-Medium',
    semiBold: 'Lexend-SemiBold',
    bold: 'Lexend-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 32,
  },
};

export const BorderRadius = {
  none: 0,
  sm: 8,
  default: 16,
  md: 24,
  lg: 32,
  xl: 48,
  full: 9999,
};

export const Spacing = {
  marginMobile: 20,
  gutter: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 24,
  navHeight: 72,
};

export const Shadows = {
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  level2: {
    shadowColor: '#006d77',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Theme = {
  colors: ThemeColors,
  typography: Typography,
  borderRadius: BorderRadius,
  spacing: Spacing,
  shadows: Shadows,
};

export default Theme;
