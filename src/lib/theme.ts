import type { Discipline } from './types';

/**
 * Nordic palette: fjord night background, snow text, aurora accent,
 * muted nature tones for the disciplines.
 */
export const C = {
  bg: '#0D171E',
  surface: '#14222B',
  surface2: '#1D2F3A',
  border: '#2A3E4A',
  text: '#EEF4F6',
  muted: '#94A9B4',
  faint: '#5E7582',
  accent: '#3FD6B0', // nordlys / aurora
  accentDim: '#12342D',
  onAccent: '#04211A',
  good: '#A6E37A', // birch leaf
  goodDim: '#20331A',
  onGood: '#132208',
  rest: '#7DB8F0', // glacier
  restDim: '#16293A',
  danger: '#FF6B78',
  dangerDim: '#3A1820',
  chartBar: '#2C4554',
  figureFar: '#6D8794',
  prop: '#3B5361',
  backdrop: '#000000AA',
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

export const R = { sm: 10, md: 14, lg: 20, pill: 999 };
