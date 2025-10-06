export const colors = {
  // Core palette (Tinder-inspired, but brand-appropriate)
  bg: '#0b1020',
  bgAlt: '#11162a',
  card: '#141a31',
  surface: '#1a2140',
  text: '#f8fafc',
  subtext: '#cbd5e1',
  muted: '#8ea0b6',
  // Accents
  accent: '#fe3c72', // primary like/brand accent (pinkish-red)
  accent2: '#7c5cff', // secondary (purple)
  success: '#22c55e',
  danger: '#ef4444',
  info: '#38bdf8',
  chip: '#2a3657',
  border: '#24304f',
  // Overlays
  overlayDark: 'rgba(0,0,0,0.35)',
  overlayDarker: 'rgba(0,0,0,0.5)'
};

export const spacing = (n: number) => n * 8;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const gradients = {
  screen: ['#0b1020', '#141a31', '#0b1020'],
  cta: ['#fe3c72', '#ff5864'],
  like: ['#22c55e', '#34d399'],
  nope: ['#ef4444', '#f97316'],
  super: ['#38bdf8', '#7c5cff'],
};

