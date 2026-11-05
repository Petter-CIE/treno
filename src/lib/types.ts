export type Lang = 'cs' | 'nb' | 'en';
export type L10n = Record<Lang, string>;

export type Discipline = 'kettlebell' | 'gym' | 'bodyweight' | 'calisthenics' | 'cardio' | 'running' | 'mobility';
export type Muscle = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'fullbody' | 'cardio';
export type Equipment = 'kettlebell' | 'dumbbell' | 'barbell' | 'machine' | 'pullupbar' | 'band' | 'none';
export type Metric = 'reps' | 'time' | 'distance';
export type Level = 1 | 2 | 3;

export interface Exercise {
  id: string;
  name: L10n;
  discipline: Discipline;
  muscle: Muscle;
  equipment: Equipment;
  level: Level;
  metric: Metric;
  /** logs a load (kg) */
  weighted: boolean;
  unilateral?: boolean;
  muscles: L10n;
  cues: Record<Lang, string[]>;
}

export interface BlockItem {
  ex: string;
  reps: number;
  seconds?: number;
}

export type Block =
  | { kind: 'emom'; minutes: number; items: BlockItem[] } // items alternate minute by minute
  | { kind: 'amrap'; minutes: number; items: BlockItem[] }
  | { kind: 'interval'; rounds: number; work: number; rest: number; items: BlockItem[]; restLabel?: 'rest' | 'walk' }
  | { kind: 'sets'; sets: number; rest: number; items: BlockItem[] } // strength sets, manual "done"
  | { kind: 'steady'; minutes: number; items: BlockItem[] }; // continuous cardio / mobility flow

export interface Workout {
  id: string;
  discipline: Discipline;
  name: L10n;
  focus: L10n;
  blocks: Block[];
  minutes: number;
}

export interface Program {
  id: string;
  discipline: Discipline;
  equipment: Equipment[];
  name: L10n;
  description: L10n;
  level: Level;
  weeks: number;
  perWeek: number;
  /** workouts in order; cycles. If weekly is set, week N uses weekly[N-1] instead. */
  sessions: string[];
  weekly?: string[][];
}

export interface PlanEntry {
  id: string;
  date: string; // YYYY-MM-DD
  workout: string;
  programId?: string;
}

export interface LoggedSet {
  ex: string;
  weightKg?: number;
  reps: number;
  sets: number;
  seconds?: number;
}

export interface LogEntry {
  id: string;
  date: string;
  finishedAt: string;
  workout?: string;
  discipline: Discipline;
  title: string;
  durationSec: number;
  rounds?: number;
  distanceKm?: number;
  sets: LoggedSet[];
  rpe?: number;
  note?: string;
}

export interface Settings {
  lang: Lang | 'auto';
  unit: 'metric' | 'imperial';
  disciplines: Discipline[];
  equipment: Equipment[];
  bells: number[]; // kettlebell sizes owned, kg
  voice: boolean;
  sound: boolean;
  weeklyGoal: number;
  reminder: { enabled: boolean; hour: number; minute: number };
  trainingDays: number[]; // 0 = Monday
  onboarded: boolean;
}
