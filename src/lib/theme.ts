import type { Discipline } from './types';

export const C = {
  bg: '#121110',
  surface: '#1C1A18',
  surface2: '#262320',
  border: '#34302C',
  text: '#F4EFEA',
  muted: '#A39A90',
  faint: '#6E665E',
  accent: '#FF6A2B',
  accentDim: '#3A2216',
  good: '#4ADE80',
  goodDim: '#16301F',
  rest: '#5AA9FF',
  restDim: '#14263A',
  danger: '#FF5A5A',
};

export const DISC_COLOR: Record<Discipline, string> = {
  kettlebell: '#FF6A2B',
  gym: '#F5B83D',
  bodyweight: '#4ADE80',
  calisthenics: '#2DD4BF',
  cardio: '#FF5A8A',
  running: '#5AA9FF',
  mobility: '#B18CFF',
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
