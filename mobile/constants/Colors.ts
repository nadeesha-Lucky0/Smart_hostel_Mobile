// Theme Colors - Dark Mode First Design
export const Colors = {
  primary: '#6C63FF',
  primaryDark: '#4A44CC',
  primaryLight: '#8F88FF',
  accent: '#FF6584',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Dark theme base
  bg: '#0F0F1A',
  bgCard: '#1A1A2E',
  bgElevated: '#252540',
  bgInput: '#1E1E35',
  border: '#2D2D50',
  borderLight: '#3D3D60',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#A0A0C0',
  textMuted: '#6060A0',
  textInverse: '#0F0F1A',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#6C63FF', '#4A44CC'],
  gradientAccent: ['#FF6584', '#CC4466'],
  gradientCard: ['#1A1A2E', '#252540'],
  gradientDark: ['#0F0F1A', '#1A1A2E'],

  // Backward-compat aliases for legacy screens
  background: '#0F0F1A',
  surface: '#1A1A2E',
  text: '#F0F0FF',
  roles: {
    admin: '#8B5CF6',
    financial: '#06B6D4',
    security: '#10B981',
    student: '#6C63FF',
    warden: '#F59E0B',
  },
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export default Colors;
