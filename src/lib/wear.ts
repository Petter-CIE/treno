import VardeWear from '../../modules/varde-wear';
import { EXERCISE_BY_ID } from '@/data/exercises';
import { WORKOUT_BY_ID } from '@/data/programs';
import { addDays, fmtDate, today, ymd } from './dates';
import { LANG_TAG, pick, type Key } from './i18n';
import type { Discipline, Lang, LogEntry, LoggedSet, PlanEntry, Settings, Workout } from './types';
import { buildSteps, exName, lastWeightKg, loggableItems, workoutsFor } from './workout';

/**
 * Data exchanged with the Wear OS watch app (see wear/ and modules/varde-wear).
 * Kept compact: the Data Layer limits an item to ~100 KB.
 */
export interface WatchStep {
  k: 'prep' | 'work' | 'rest' | 'manual' | 'amrap';
  s: number;
  t: string;
  d: string;
  ex?: string;
  /** exercise name (manual steps) */
  n?: string;
  r?: number;
  items?: string[];
}
export interface WatchWorkout {
  id: string;
  name: string;
  sub: string;
  disc: Discipline;
  min: number;
  steps: WatchStep[];
}
export interface WatchExercise {
  /** last weight, kg */
  kg: number;
  /** step in the display unit */
  inc: number;
  /** kettlebell sizes owned, kg */
  bells?: number[];
}
export interface WatchPayload {
  v: 1;
  lang: Lang;
  unit: 'kg' | 'lb';
  workouts: WatchWorkout[];
  ex: Record<string, WatchExercise>;
}

/** What the watch sends back for a finished workout. */
export interface WatchLog {
  id: string;
  w: string;
  title: string;
  disc: Discipline;
  start: string;
  end: string;
  dur: number;
  rpe?: number;
  done: boolean;
  sets: { ex: string; reps: number; kg?: number }[];
}

type TFn = (key: Key, vars?: Record<string, string | number>) => string;

const MAX_WORKOUTS = 10;

export function buildWatchPayload(args: { plan: PlanEntry[]; log: LogEntry[]; settings: Settings; lang: Lang; t: TFn }): WatchPayload {
  const { plan, log, settings, lang, t } = args;
  const tag = LANG_TAG[lang];
  const picked: { w: Workout; sub: string }[] = [];
  const seen = new Set<string>();
  const add = (id: string | undefined, sub: string) => {
    const w = id ? WORKOUT_BY_ID[id] : undefined;
    if (!w || seen.has(w.id) || picked.length >= MAX_WORKOUTS) return;
    seen.add(w.id);
    picked.push({ w, sub });
  };

  // planned: today and the next 6 days
  const start = new Date();
  for (let i = 0; i < 7; i++) {
    const day = ymd(addDays(start, i));
    const label = i === 0 ? t('common.today') : fmtDate(day, tag);
    plan.filter((p) => p.date === day).forEach((p) => add(p.workout, label));
  }
  // recently done
  for (const l of log) add(l.workout, fmtDate(l.date, tag));
  // something to start with
  for (const w of workoutsFor(settings).slice(0, 4)) add(w.id, pick(w.focus, lang));

  const ex: Record<string, WatchExercise> = {};
  const imperial = settings.unit === 'imperial';
  const workouts: WatchWorkout[] = picked.map(({ w, sub }) => {
    for (const it of loggableItems(w)) {
      const e = EXERCISE_BY_ID[it.ex];
      if (!e?.weighted || ex[it.ex]) continue;
      ex[it.ex] = {
        kg: lastWeightKg(it.ex, log, settings),
        inc: imperial ? 5 : e.equipment === 'barbell' || e.equipment === 'machine' ? 2.5 : e.equipment === 'dumbbell' ? 1 : 2.5,
        bells: e.equipment === 'kettlebell' && settings.bells.length ? [...settings.bells].sort((a, b) => a - b) : undefined,
      };
    }
    return {
      id: w.id,
      name: pick(w.name, lang),
      sub,
      disc: w.discipline,
      min: w.minutes,
      steps: buildSteps(w, lang, t).map((s) => ({
        k: s.kind,
        s: s.seconds,
        t: s.title,
        d: s.detail,
        ex: s.ex,
        n: s.kind === 'manual' && s.ex ? exName(s.ex, lang) : undefined,
        r: s.reps,
        items: s.items,
      })),
    };
  });

  return { v: 1, lang, unit: imperial ? 'lb' : 'kg', workouts, ex };
}

/** Turn a watch result into a log entry (same shape as the phone's own summary screen). */
export function logFromWatch(raw: WatchLog): (Omit<LogEntry, 'id'> & { id: string }) | null {
  const w = WORKOUT_BY_ID[raw.w];
  if (!w) return null;
  const sets: LoggedSet[] = loggableItems(w).map((i) => {
    const done = raw.sets.filter((s) => s.ex === i.ex);
    if (!done.length) return { ex: i.ex, reps: i.reps, sets: i.sets, seconds: i.seconds };
    const kgs = done.map((s) => s.kg).filter((k): k is number => !!k);
    return {
      ex: i.ex,
      reps: Math.round(done.reduce((a, s) => a + s.reps, 0) / done.length),
      sets: done.length,
      seconds: i.seconds,
      weightKg: kgs.length ? Math.max(...kgs) : undefined,
      detail: done.map((s) => ({ reps: s.reps, kg: s.kg })),
    };
  });
  return {
    id: raw.id,
    date: raw.end ? ymd(new Date(raw.end)) : today(),
    finishedAt: raw.end || new Date().toISOString(),
    workout: w.id,
    discipline: w.discipline,
    title: raw.title || w.id,
    durationSec: Math.max(0, Math.round(raw.dur)),
    sets,
    rpe: raw.rpe,
  };
}

/** The phone side of the watch link; null on iOS, web and Expo Go. */
export const wear = VardeWear;

export function watchSyncOn(settings: Settings) {
  return settings.watchSync !== false;
}

/** Publish the plan to the watch. With sync off the watch gets an empty list. */
export async function sendPlanToWatch(args: Parameters<typeof buildWatchPayload>[0]): Promise<boolean> {
  if (!wear) return false;
  const payload = watchSyncOn(args.settings) ? buildWatchPayload(args) : { ...buildWatchPayload({ ...args, plan: [], log: [] }), workouts: [], ex: {} };
  return wear.setPlan(JSON.stringify(payload)).catch(() => false);
}
