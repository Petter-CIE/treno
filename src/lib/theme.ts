import type { Discipline } from './types';

/**
 * Nordic palette: fjord night background, snow text, aurora accent,
 * muted nature tones for the disciplines.
 */
export const C = {
  bg: '#0A1318',
  surface: '#121E25',
  surface2: '#1A2A33',
  surface3: '#233641',
  border: '#1F313B',
  text: '#F1F6F8',
  muted: '#93A8B3',
  faint: '#5B727E',
  accent: '#43E0B8', // nordlys / aurora
  accent2: '#2FB7D6', // fjord – second gradient stop
  accentDim: '#123A31',
  onAccent: '#032019',
  good: '#A6E37A', // birch leaf
  goodDim: '#20331A',
  onGood: '#132208',
  rest: '#7DB8F0', // glacier
  restDim: '#16293A',
  danger: '#FF6B78',
  dangerDim: '#3A1820',
  chartBar: '#25404D',
  figureFar: '#6D8794',
  prop: '#3B5361',
  backdrop: '#000000B3',
  tabBar: '#132028',
};

export const DISC_COLOR: Record<Discipline, string> = {
  kettlebell: '#E8955E', // copper
  gym: '#E5C46A', // birch gold
  bodyweight: '#A6E37A', // moss
  calisthenics: '#5FC8D9', // glacier water
  cardio: '#F2788C', // lingonberry
  running: '#7DB8F0', // fjord blue
  mobility: '#B7A4F0', // heather
};

export const DISC_ICON: Record<Discipline, string> = {
  kettlebell: 'kettlebell',
  gym: 'dumbbell',
  bodyweight: 'human-handsup',
  calisthenics: 'human-handsdown',
  cardio: 'heart-pulse',
  running: 'run-fast',
  mobility: 'yoga',
};

export const R = { sm: 12, md: 16, lg: 24, pill: 999 };

/** Plus Jakarta Sans – one family per weight (Android ignores fontWeight on custom fonts). */
export const FONT = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Space the floating tab bar takes at the bottom of tab screens. */
export const TAB_SPACE = 104;
