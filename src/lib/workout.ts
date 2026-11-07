import { EXERCISE_BY_ID } from '@/data/exercises';
import { WORKOUTS, WORKOUT_BY_ID } from '@/data/programs';
import { pick, type Key } from './i18n';
import type { Block, BlockItem, Discipline, Lang, LogEntry, Settings, Workout } from './types';

type TFn = (key: Key, vars?: Record<string, string | number>) => string;

export function exName(id: string, lang: Lang) {
  const e = EXERCISE_BY_ID[id];
  return e ? pick(e.name, lang) : id;
}

export function itemText(item: BlockItem, lang: Lang, t: TFn, timed = false) {
  const name = exName(item.ex, lang);
  const ex = EXERCISE_BY_ID[item.ex];
  const side = ex?.unilateral ? ` ${t('block.perSide')}` : '';
  if (item.seconds) return `${name} · ${item.seconds} s${side}`;
  if (item.reps && !timed) return `${item.reps}× ${name}${side}`;
  return name;
}

export function blockTitle(b: Block, t: TFn) {
  switch (b.kind) {
    case 'emom':
      return t('block.emom', { m: b.minutes });
    case 'amrap':
      return t('block.amrap', { m: b.minutes });
    case 'interval':
      return t('block.interval', { r: b.rounds, w: b.work, rest: b.rest });
    case 'sets':
      return t('block.sets', { s: b.sets, rest: b.rest });
    case 'steady':
      return t('block.steady', { m: b.minutes });
  }
}

export interface Step {
  kind: 'prep' | 'work' | 'rest' | 'manual' | 'amrap';
  seconds: number; // 0 for manual
  title: string;
  detail: string;
  ex?: string;
  /** target reps for strength sets (manual steps) */
  reps?: number;
  items?: string[]; // amrap list
  walk?: boolean;
  /** what the voice coach says when the step starts */
  say: string;
}

export function buildSteps(w: Workout, lang: Lang, t: TFn): Step[] {
  const steps: Step[] = [];
  w.blocks.forEach((b, bi) => {
    const first = firstItem(b);
    steps.push({
      kind: 'prep',
      seconds: bi === 0 ? 10 : 15,
      title: itemText(first, lang, t, b.kind === 'interval' || b.kind === 'steady'),
      detail: blockTitle(b, t),
      ex: first.ex,
      say: `${t('timer.ready')}. ${exName(first.ex, lang)}`,
    });
    switch (b.kind) {
      case 'emom':
        for (let m = 0; m < b.minutes; m++) {
          const it = b.items[m % b.items.length];
          steps.push({ kind: 'work', seconds: 60, title: itemText(it, lang, t), detail: t('timer.minute', { i: m + 1, n: b.minutes }), ex: it.ex, say: itemText(it, lang, t).replace('×', '') });
        }
        break;
      case 'amrap':
        steps.push({
          kind: 'amrap',
          seconds: b.minutes * 60,
          title: blockTitle(b, t),
          detail: '',
          items: b.items.map((i) => itemText(i, lang, t)),
          ex: b.items[0]?.ex,
          say: t('timer.voiceGo'),
        });
        break;
      case 'interval':
        for (let r = 0; r < b.rounds; r++) {
          b.items.forEach((it, ii) => {
            const name = exName(it.ex, lang);
            const isRun = b.restLabel === 'walk';
            steps.push({
              kind: 'work',
              seconds: b.work,
              title: name,
              detail: t('timer.round', { i: r + 1, n: b.rounds }),
              ex: it.ex,
              say: isRun ? t('timer.voiceRun') : name,
            });
            const last = r === b.rounds - 1 && ii === b.items.length - 1;
            if (!last && b.rest > 0) {
              const next = b.items[(ii + 1) % b.items.length];
              steps.push({
                kind: 'rest',
                seconds: b.rest,
                title: isRun ? t('timer.walk') : t('timer.rest'),
                detail: `${t('timer.next')}: ${exName(next.ex, lang)}`,
                walk: isRun,
                say: isRun ? t('timer.voiceWalk') : t('timer.voiceRest'),
              });
            }
          });
        }
        break;
      case 'sets':
        b.items.forEach((it, ii) => {
          for (let st = 0; st < b.sets; st++) {
            const timed = !!it.seconds;
            steps.push({
              kind: timed ? 'work' : 'manual',
              seconds: timed ? it.seconds! : 0,
              title: itemText(it, lang, t),
              detail: t('timer.set', { i: st + 1, n: b.sets }),
              ex: it.ex,
              reps: timed ? undefined : it.reps,
              say: `${t('timer.set', { i: st + 1, n: b.sets }).replace('/', '')}. ${itemText(it, lang, t).replace('×', '')}`,
            });
            const last = st === b.sets - 1 && ii === b.items.length - 1;
            if (!last) {
              const nextEx = st === b.sets - 1 ? b.items[ii + 1].ex : it.ex;
              steps.push({ kind: 'rest', seconds: b.rest, title: t('timer.rest'), detail: `${t('timer.next')}: ${exName(nextEx, lang)}`, say: t('timer.voiceRest') });
            }
          }
        });
        break;
      case 'steady':
        b.items.forEach((it) => {
          const mins = b.minutes / b.items.length;
          steps.push({ kind: 'work', seconds: Math.round(mins * 60), title: exName(it.ex, lang), detail: t('block.steady', { m: +mins.toFixed(1) }), ex: it.ex, say: exName(it.ex, lang) });
        });
        break;
    }
  });
  return steps;
}

function firstItem(b: Block): BlockItem {
  return b.items[0] ?? { ex: 'walk', reps: 0 };
}

/** Exercises worth logging (sets / reps / weight) */
export function loggableItems(w: Workout): { ex: string; reps: number; sets: number; seconds?: number }[] {
  const map = new Map<string, { ex: string; reps: number; sets: number; seconds?: number }>();
  for (const b of w.blocks) {
    for (const it of b.items) {
      const prev = map.get(it.ex);
      let sets = 1;
      if (b.kind === 'sets') sets = b.sets;
      else if (b.kind === 'emom') sets = Math.ceil(b.minutes / b.items.length);
      else if (b.kind === 'interval') sets = b.rounds;
      if (prev) prev.sets += sets;
      else map.set(it.ex, { ex: it.ex, reps: it.reps, sets, seconds: it.seconds });
    }
  }
  return [...map.values()];
}

export function workoutHasDistance(w: Workout) {
  return w.discipline === 'running' || w.blocks.some((b) => b.items.some((i) => EXERCISE_BY_ID[i.ex]?.metric === 'distance'));
}

export function workoutEquipment(w: Workout) {
  const eq = new Set<string>();
  for (const b of w.blocks) for (const i of b.items) {
    const e = EXERCISE_BY_ID[i.ex]?.equipment;
    if (e && e !== 'none') eq.add(e);
  }
  return [...eq];
}

/** Workouts matching the user's disciplines (all if none picked). */
export function workoutsFor(settings: Settings): Workout[] {
  const ds = settings.disciplines;
  return WORKOUTS.filter((w) => !ds.length || ds.includes(w.discipline)).filter((w) => !w.id.startsWith('run5k_w') || ds.includes('running'));
}

export function totalSeconds(steps: Step[]) {
  return steps.reduce((a, s) => a + s.seconds, 0);
}

export type CustomMode = 'emom' | 'amrap' | 'interval' | 'steady';

export function customWorkout(mode: CustomMode, opts: { minutes: number; rounds: number; work: number; rest: number; ex: string; reps: number }, discipline: Discipline, t: TFn): Workout {
  const item: BlockItem = { ex: opts.ex, reps: opts.reps };
  let block: Block;
  if (mode === 'emom') block = { kind: 'emom', minutes: opts.minutes, items: [item] };
  else if (mode === 'amrap') block = { kind: 'amrap', minutes: opts.minutes, items: [item] };
  else if (mode === 'steady') block = { kind: 'steady', minutes: opts.minutes, items: [item] };
  else block = { kind: 'interval', rounds: opts.rounds, work: opts.work, rest: opts.rest, items: [item], restLabel: opts.ex === 'jog' || opts.ex === 'run' ? 'walk' : 'rest' };
  const label = blockTitle(block, t);
  return {
    id: 'custom',
    discipline,
    name: { cs: label, nb: label, en: label },
    focus: { cs: '', nb: '', en: '' },
    minutes: 0,
    blocks: [block],
  };
}

/** Log title in the current language (stored title is only a fallback for custom timers). */
export function logTitle(l: { workout?: string; title: string }, lang: Lang) {
  const w = l.workout ? WORKOUT_BY_ID[l.workout] : undefined;
  return w ? pick(w.name, lang) : l.title;
}

/** Last weight used for an exercise, or a sensible starting weight. */
export function lastWeightKg(ex: string, log: LogEntry[], settings: Settings): number {
  for (const l of log) {
    const s = l.sets.find((x) => x.ex === ex && x.weightKg);
    if (s) return s.weightKg!;
  }
  const e = EXERCISE_BY_ID[ex];
  if (e?.equipment === 'kettlebell') return settings.bells[Math.floor(settings.bells.length / 2)] ?? 12;
  if (e?.equipment === 'barbell') return 20;
  return 10;
}
