export const lightColors = {
  bg: '#FAFAF7',
  card: '#FFFFFF',
  surface: '#F5F3EE',
  surfaceHover: '#EFECE5',
  green50: '#ECFDF5', green100: '#D1FAE5', green200: '#A7F3D0',
  green400: '#34D399', green500: '#10B981', green600: '#059669', green700: '#047857', green800: '#065F46',
  orange50: '#FFF7ED', orange100: '#FFEDD5', orange400: '#FB923C', orange500: '#F97316',
  red50: '#FEF2F2', red100: '#FEE2E2', red400: '#F87171', red500: '#EF4444',
  amber400: '#FBBF24',
  violet50: '#F5F3FF', violet400: '#A78BFA',
  text: '#1C1917', textSec: '#57534E', textMuted: '#A8A29E', textDim: '#D6D3D1',
  border: '#E7E5E4', borderLight: '#F5F5F4',
};

export const darkColors: typeof lightColors = {
  bg: '#1C1917',
  card: '#292524',
  surface: '#292524',
  surfaceHover: '#3D3835',
  green50: '#052E16', green100: '#064E3B', green200: '#065F46',
  green400: '#34D399', green500: '#10B981', green600: '#34D399', green700: '#6EE7B7', green800: '#A7F3D0',
  orange50: '#431407', orange100: '#7C2D12', orange400: '#FB923C', orange500: '#F97316',
  red50: '#450A0A', red100: '#7F1D1D', red400: '#F87171', red500: '#EF4444',
  amber400: '#FBBF24',
  violet50: '#2E1065', violet400: '#A78BFA',
  text: '#FAFAF7', textSec: '#D6D3D1', textMuted: '#78716C', textDim: '#57534E',
  border: '#44403C', borderLight: '#3D3835',
};

// Default export for backwards compatibility — overridden by ThemeProvider at runtime
export const colors = lightColors;
export const spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999 };
export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
  black: 'DMSans_900Black',
};
