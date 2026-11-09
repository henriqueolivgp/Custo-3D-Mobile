import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#0F141B',
  surface: '#18202B',
  surfaceHi: '#212B39',
  line: '#2A3544',
  text: '#EAF0F7',
  muted: '#8B98AC',
  accent: '#8AA4FF',
  accentInk: '#0B1020',
  price: '#FFD166',
  danger: '#FF6B6B',
  ok: '#5BD6A1',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 22, pill: 999 } as const;

export const typo = {
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2, color: colors.text },
  body: { fontSize: 16, lineHeight: 22, color: colors.text },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.text },
  caption: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  number: { fontVariant: ['tabular-nums'] },
  price: { fontSize: 36, fontWeight: '800', letterSpacing: -0.8, color: colors.price, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;
