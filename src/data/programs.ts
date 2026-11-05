import type { Block, Program, Workout } from '@/lib/types';

const W = (w: Workout) => w;
const warmWalk: Block = { kind: 'steady', minutes: 5, items: [{ ex: 'walk', reps: 0 }] };
const cooldownWalk: Block = { kind: 'steady', minutes: 5, items: [{ ex: 'walk', reps: 0 }] };

/** run/walk interval week for the 0→5 km program */
const runWeek = (n: number, rounds: number, run: number, walk: number): Workout =>
  W({
    id: `run5k_w${n}`,
    discipline: 'running',
    name: { cs: `Na 5 km – týden ${n}`, nb: `Til 5 km – uke ${n}`, en: `To 5K – week ${n}` },
    focus: {
      cs: `${rounds}× běh ${fmt(run, 'cs')} / chůze ${fmt(walk, 'cs')}`,
      nb: `${rounds}× løp ${fmt(run, 'nb')} / gå ${fmt(walk, 'nb')}`,
      en: `${rounds}× run ${fmt(run, 'en')} / walk ${fmt(walk, 'en')}`,
    },
    minutes: Math.round((rounds * (run + walk)) / 60) + 10,
    blocks: [warmWalk, { kind: 'interval', rounds, work: run, rest: walk, restLabel: 'walk', items: [{ ex: 'jog', reps: 0 }] }, cooldownWalk],
  });

function fmt(sec: number, lang: 'cs' | 'nb' | 'en') {
  if (sec < 60) return `${sec} s`;
  const m = sec / 60;
  const v = Number.isInteger(m) ? `${m}` : m.toFixed(1).replace('.', lang === 'en' ? '.' : ',');
  return `${v} min`;
}

export const WORKOUTS: Workout[] = [
  // ───────── Kettlebell ─────────
  W({
    id: 'kb_a', discipline: 'kettlebell', minutes: 30,
    name: { cs: 'Kettlebell základy A', nb: 'Kettlebell grunnlag A', en: 'Kettlebell foundations A' },
    focus: { cs: 'Celé tělo, technika', nb: 'Hele kroppen, teknikk', en: 'Full body, technique' },
    blocks: [
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'goblet', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'kbdeadlift', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'kbrow', reps: 8 }] },
      { kind: 'interval', rounds: 6, work: 20, rest: 40, items: [{ ex: 'swing2', reps: 0 }] },
    ],
  }),
  W({
    id: 'kb_b', discipline: 'kettlebell', minutes: 30,
    name: { cs: 'Kettlebell základy B', nb: 'Kettlebell grunnlag B', en: 'Kettlebell foundations B' },
    focus: { cs: 'Švih, tlak, nohy', nb: 'Sving, press, bein', en: 'Swing, press, legs' },
    blocks: [
      { kind: 'sets', sets: 2, rest: 30, items: [{ ex: 'halo', reps: 8 }] },
      { kind: 'emom', minutes: 8, items: [{ ex: 'swing2', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'kbpress', reps: 6 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'lunge', reps: 6 }] },
    ],
  }),
  W({
    id: 'kb_daily', discipline: 'kettlebell', minutes: 25,
    name: { cs: 'Švih + Get-up', nb: 'Sving + Get-up', en: 'Swing + Get-up' },
    focus: { cs: '100 švihů a 10 vstávání', nb: '100 svinger og 10 get-ups', en: '100 swings and 10 get-ups' },
    blocks: [
      { kind: 'sets', sets: 3, rest: 30, items: [{ ex: 'goblet', reps: 5 }] },
      { kind: 'emom', minutes: 10, items: [{ ex: 'swing1', reps: 10 }] },
      { kind: 'emom', minutes: 10, items: [{ ex: 'tgu', reps: 1 }] },
    ],
  }),
  W({
    id: 'kb_emom', discipline: 'kettlebell', minutes: 28,
    name: { cs: 'Kettlebell EMOM 20', nb: 'Kettlebell EMOM 20', en: 'Kettlebell EMOM 20' },
    focus: { cs: 'Kondice, celé tělo', nb: 'Kondisjon, hele kroppen', en: 'Conditioning, full body' },
    blocks: [{ kind: 'emom', minutes: 20, items: [{ ex: 'swing2', reps: 15 }, { ex: 'goblet', reps: 8 }, { ex: 'kbclean', reps: 5 }, { ex: 'kbthruster', reps: 5 }] }],
  }),

  // ───────── Gym ─────────
  W({
    id: 'gym_full_a', discipline: 'gym', minutes: 50,
    name: { cs: 'Fullbody A', nb: 'Helkropp A', en: 'Full body A' },
    focus: { cs: 'Dřep, bench, přítah', nb: 'Knebøy, benk, roing', en: 'Squat, bench, row' },
    blocks: [
      { kind: 'sets', sets: 3, rest: 120, items: [{ ex: 'bbsquat', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 120, items: [{ ex: 'bench', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'cablerow', reps: 10 }] },
      { kind: 'sets', sets: 2, rest: 60, items: [{ ex: 'curl', reps: 12 }] },
      { kind: 'sets', sets: 3, rest: 45, items: [{ ex: 'plank', reps: 0, seconds: 30 }] },
    ],
  }),
  W({
    id: 'gym_full_b', discipline: 'gym', minutes: 50,
    name: { cs: 'Fullbody B', nb: 'Helkropp B', en: 'Full body B' },
    focus: { cs: 'Mrtvý tah, tlak, stahování', nb: 'Markløft, press, nedtrekk', en: 'Deadlift, press, pulldown' },
    blocks: [
      { kind: 'sets', sets: 3, rest: 150, items: [{ ex: 'bbdeadlift', reps: 5 }] },
      { kind: 'sets', sets: 3, rest: 120, items: [{ ex: 'ohp', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'latpull', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'legpress', reps: 12 }] },
      { kind: 'sets', sets: 2, rest: 60, items: [{ ex: 'triceps', reps: 12 }] },
    ],
  }),
  W({
    id: 'gym_push', discipline: 'gym', minutes: 55,
    name: { cs: 'Push – tlaky', nb: 'Push – press', en: 'Push day' },
    focus: { cs: 'Prsa, ramena, triceps', nb: 'Bryst, skuldre, triceps', en: 'Chest, shoulders, triceps' },
    blocks: [
      { kind: 'sets', sets: 4, rest: 120, items: [{ ex: 'bench', reps: 6 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'ohp', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'dbpress', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'lateral', reps: 12 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'triceps', reps: 12 }] },
    ],
  }),
  W({
    id: 'gym_pull', discipline: 'gym', minutes: 55,
    name: { cs: 'Pull – přítahy', nb: 'Pull – trekk', en: 'Pull day' },
    focus: { cs: 'Záda, biceps', nb: 'Rygg, biceps', en: 'Back, biceps' },
    blocks: [
      { kind: 'sets', sets: 3, rest: 150, items: [{ ex: 'bbdeadlift', reps: 5 }] },
      { kind: 'sets', sets: 4, rest: 90, items: [{ ex: 'latpull', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'bbrow', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'dbrow', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'curl', reps: 12 }] },
    ],
  }),
  W({
    id: 'gym_legs', discipline: 'gym', minutes: 55,
    name: { cs: 'Legs – nohy', nb: 'Bein', en: 'Leg day' },
    focus: { cs: 'Stehna, hýždě, hamstringy', nb: 'Lår, sete, hamstrings', en: 'Quads, glutes, hamstrings' },
    blocks: [
      { kind: 'sets', sets: 4, rest: 150, items: [{ ex: 'bbsquat', reps: 6 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'rdl', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'hipthrust', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'legcurl', reps: 12 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'lunge', reps: 10 }] },
    ],
  }),

  // ───────── Bodyweight ─────────
  W({
    id: 'home_full', discipline: 'bodyweight', minutes: 25,
    name: { cs: 'Doma bez vybavení', nb: 'Hjemme uten utstyr', en: 'Home, no equipment' },
    focus: { cs: 'Celé tělo, 4 kola', nb: 'Hele kroppen, 4 runder', en: 'Full body, 4 rounds' },
    blocks: [
      { kind: 'interval', rounds: 4, work: 40, rest: 20, items: [{ ex: 'squat', reps: 0 }, { ex: 'pushup', reps: 0 }, { ex: 'lunge', reps: 0 }, { ex: 'glutebridge', reps: 0 }, { ex: 'plank', reps: 0 }] },
    ],
  }),
  W({
    id: 'home_hiit', discipline: 'bodyweight', minutes: 20,
    name: { cs: 'HIIT bez vybavení', nb: 'HIIT uten utstyr', en: 'No-equipment HIIT' },
    focus: { cs: 'Krátká vysoká intenzita', nb: 'Kort og intens', en: 'Short and intense' },
    blocks: [
      { kind: 'interval', rounds: 3, work: 30, rest: 15, items: [{ ex: 'jacks', reps: 0 }, { ex: 'jumpsquat', reps: 0 }, { ex: 'mountain', reps: 0 }, { ex: 'burpee', reps: 0 }, { ex: 'highknees', reps: 0 }] },
    ],
  }),

  // ───────── Calisthenics ─────────
  W({
    id: 'cali_pull', discipline: 'calisthenics', minutes: 30,
    name: { cs: 'Cesta k shybu', nb: 'Veien til pullup', en: 'Road to the pull-up' },
    focus: { cs: 'Vis, negativy, australské shyby', nb: 'Heng, negative, australske', en: 'Hangs, negatives, rows' },
    blocks: [
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'deadhang', reps: 0, seconds: 30 }] },
      { kind: 'sets', sets: 4, rest: 90, items: [{ ex: 'negpullup', reps: 4 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'invrow', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 45, items: [{ ex: 'hollow', reps: 0, seconds: 20 }] },
    ],
  }),
  W({
    id: 'cali_push', discipline: 'calisthenics', minutes: 30,
    name: { cs: 'Kalistenika – tlaky', nb: 'Calisthenics – press', en: 'Calisthenics push' },
    focus: { cs: 'Kliky, dipy, pike', nb: 'Armhevinger, dips, pike', en: 'Push-ups, dips, pike' },
    blocks: [
      { kind: 'sets', sets: 4, rest: 90, items: [{ ex: 'pushup', reps: 10 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'dip', reps: 6 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'pikepush', reps: 6 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'squat', reps: 15 }] },
    ],
  }),
  W({
    id: 'cali_strength', discipline: 'calisthenics', minutes: 40,
    name: { cs: 'Kalistenika – síla', nb: 'Calisthenics – styrke', en: 'Calisthenics strength' },
    focus: { cs: 'Shyby, dipy, pistole', nb: 'Pullups, dips, pistol', en: 'Pull-ups, dips, pistols' },
    blocks: [
      { kind: 'sets', sets: 5, rest: 120, items: [{ ex: 'pullup', reps: 5 }] },
      { kind: 'sets', sets: 4, rest: 90, items: [{ ex: 'dip', reps: 8 }] },
      { kind: 'sets', sets: 3, rest: 90, items: [{ ex: 'pistol', reps: 5 }] },
      { kind: 'sets', sets: 3, rest: 60, items: [{ ex: 'legraise', reps: 8 }] },
    ],
  }),

  // ───────── Cardio ─────────
  W({
    id: 'tabata', discipline: 'cardio', minutes: 15,
    name: { cs: 'Tabata', nb: 'Tabata', en: 'Tabata' },
    focus: { cs: '8 × 20 s naplno / 10 s pauza, dvakrát', nb: '8 × 20 s fullt / 10 s pause, to ganger', en: '8 × 20 s all-out / 10 s rest, twice' },
    blocks: [
      { kind: 'interval', rounds: 8, work: 20, rest: 10, items: [{ ex: 'jumprope', reps: 0 }] },
      { kind: 'interval', rounds: 8, work: 20, rest: 10, items: [{ ex: 'burpee', reps: 0 }] },
    ],
  }),
  W({
    id: 'bike_int', discipline: 'cardio', minutes: 30,
    name: { cs: 'Intervaly na kole', nb: 'Sykkelintervaller', en: 'Bike intervals' },
    focus: { cs: '6 × 2 min tvrdě', nb: '6 × 2 min hardt', en: '6 × 2 min hard' },
    blocks: [
      { kind: 'steady', minutes: 5, items: [{ ex: 'bike', reps: 0 }] },
      { kind: 'interval', rounds: 6, work: 120, rest: 60, items: [{ ex: 'bike', reps: 0 }] },
      { kind: 'steady', minutes: 5, items: [{ ex: 'bike', reps: 0 }] },
    ],
  }),
  W({
    id: 'row_steady', discipline: 'cardio', minutes: 25,
    name: { cs: 'Veslování 20 min', nb: 'Roing 20 min', en: 'Row 20 min' },
    focus: { cs: 'Klidná vytrvalost', nb: 'Rolig utholdenhet', en: 'Easy endurance' },
    blocks: [{ kind: 'steady', minutes: 20, items: [{ ex: 'rower', reps: 0 }] }],
  }),

  // ───────── Running ─────────
  runWeek(1, 8, 60, 90),
  runWeek(2, 6, 90, 120),
  runWeek(3, 5, 180, 90),
  runWeek(4, 4, 300, 150),
  runWeek(5, 3, 480, 180),
  runWeek(6, 2, 600, 120),
  W({
    id: 'run5k_w7', discipline: 'running', minutes: 35,
    name: { cs: 'Na 5 km – týden 7', nb: 'Til 5 km – uke 7', en: 'To 5K – week 7' },
    focus: { cs: '25 min běhu v kuse', nb: '25 min sammenhengende løping', en: '25 min continuous run' },
    blocks: [warmWalk, { kind: 'steady', minutes: 25, items: [{ ex: 'run', reps: 0 }] }, cooldownWalk],
  }),
  W({
    id: 'run5k_w8', discipline: 'running', minutes: 40,
    name: { cs: 'Na 5 km – týden 8', nb: 'Til 5 km – uke 8', en: 'To 5K – week 8' },
    focus: { cs: '30 min běhu – tvých prvních 5 km', nb: '30 min løping – dine første 5 km', en: '30 min run – your first 5K' },
    blocks: [warmWalk, { kind: 'steady', minutes: 30, items: [{ ex: 'run', reps: 0 }] }, cooldownWalk],
  }),
  W({
    id: 'run_easy', discipline: 'running', minutes: 40,
    name: { cs: 'Lehký běh', nb: 'Rolig tur', en: 'Easy run' },
    focus: { cs: '30 min v tempu, kdy zvládneš mluvit', nb: '30 min i pratetempo', en: '30 min at talking pace' },
    blocks: [warmWalk, { kind: 'steady', minutes: 30, items: [{ ex: 'run', reps: 0 }] }],
  }),
  W({
    id: 'run_sprints', discipline: 'running', minutes: 35,
    name: { cs: 'Běžecké sprinty', nb: 'Løpsdrag', en: 'Running sprints' },
    focus: { cs: '10 × 30 s rychle', nb: '10 × 30 s raskt', en: '10 × 30 s fast' },
    blocks: [
      { kind: 'steady', minutes: 10, items: [{ ex: 'jog', reps: 0 }] },
      { kind: 'interval', rounds: 10, work: 30, rest: 90, restLabel: 'walk', items: [{ ex: 'sprint', reps: 0 }] },
      cooldownWalk,
    ],
  }),

  // ───────── Mobility ─────────
  W({
    id: 'mob_morning', discipline: 'mobility', minutes: 10,
    name: { cs: 'Ranní mobilita', nb: 'Morgenmobilitet', en: 'Morning mobility' },
    focus: { cs: '10 minut pro celé tělo', nb: '10 minutter for hele kroppen', en: '10 minutes, full body' },
    blocks: [
      { kind: 'interval', rounds: 2, work: 45, rest: 15, items: [{ ex: 'catcow', reps: 0 }, { ex: 'worldsgreatest', reps: 0 }, { ex: 'hipflexor', reps: 0 }, { ex: 'shoulderroll', reps: 0 }, { ex: 'childpose', reps: 0 }] },
    ],
  }),
  W({
    id: 'mob_recovery', discipline: 'mobility', minutes: 15,
    name: { cs: 'Protažení po tréninku', nb: 'Tøying etter trening', en: 'Post-workout stretch' },
    focus: { cs: 'Kyčle, hamstringy, záda', nb: 'Hofter, hamstrings, rygg', en: 'Hips, hamstrings, back' },
    blocks: [
      { kind: 'interval', rounds: 1, work: 60, rest: 10, items: [{ ex: 'hipflexor', reps: 0 }, { ex: 'hamstretch', reps: 0 }, { ex: 'worldsgreatest', reps: 0 }, { ex: 'catcow', reps: 0 }, { ex: 'childpose', reps: 0 }] },
    ],
  }),
];

export const WORKOUT_BY_ID: Record<string, Workout> = Object.fromEntries(WORKOUTS.map((w) => [w.id, w]));

export const PROGRAMS: Program[] = [
  {
    id: 'gym_beginner', discipline: 'gym', equipment: ['barbell', 'machine'], level: 1, weeks: 8, perWeek: 3,
    name: { cs: 'Posilovna pro začátečníky', nb: 'Treningssenter for nybegynnere', en: 'Gym for beginners' },
    description: {
      cs: 'Dva celotělové tréninky, které se střídají. Základní cviky, postupné přidávání váhy.',
      nb: 'To helkroppsøkter som veksler. Grunnøvelser og gradvis økning av vekt.',
      en: 'Two alternating full-body sessions. Core lifts with steady progression.',
    },
    sessions: ['gym_full_a', 'gym_full_b'],
  },
  {
    id: 'gym_ppl', discipline: 'gym', equipment: ['barbell', 'dumbbell', 'machine'], level: 2, weeks: 8, perWeek: 3,
    name: { cs: 'Push / Pull / Legs', nb: 'Push / Pull / Bein', en: 'Push / Pull / Legs' },
    description: {
      cs: 'Klasické rozdělení na tlaky, přítahy a nohy. Pro ty, kdo už základy umí.',
      nb: 'Klassisk oppdeling i press, trekk og bein. For deg som kan grunnøvelsene.',
      en: 'The classic split into push, pull and legs. For lifters who know the basics.',
    },
    sessions: ['gym_push', 'gym_pull', 'gym_legs'],
  },
  {
    id: 'home', discipline: 'bodyweight', equipment: [], level: 1, weeks: 4, perWeek: 3,
    name: { cs: 'Doma bez vybavení', nb: 'Hjemme uten utstyr', en: 'Home, no equipment' },
    description: {
      cs: 'Celé tělo jen s vlastní vahou. Stačí kus podlahy a 25 minut.',
      nb: 'Hele kroppen med bare kroppsvekt. Du trenger bare litt gulvplass og 25 minutter.',
      en: 'Full body with just your own weight. A bit of floor and 25 minutes is enough.',
    },
    sessions: ['home_full', 'home_hiit'],
  },
  {
    id: 'pullup', discipline: 'calisthenics', equipment: ['pullupbar'], level: 1, weeks: 6, perWeek: 3,
    name: { cs: 'První shyb', nb: 'Din første pullup', en: 'Your first pull-up' },
    description: {
      cs: 'Vis, negativní shyby a přítahy. Za 6 týdnů zvládneš svůj první čistý shyb.',
      nb: 'Heng, negative pullups og roing. Om 6 uker klarer du din første rene pullup.',
      en: 'Hangs, negatives and rows. In 6 weeks you can do your first strict pull-up.',
    },
    sessions: ['cali_pull', 'cali_push'],
  },
  {
    id: 'cali', discipline: 'calisthenics', equipment: ['pullupbar'], level: 3, weeks: 6, perWeek: 3,
    name: { cs: 'Kalistenika – síla', nb: 'Calisthenics – styrke', en: 'Calisthenics strength' },
    description: {
      cs: 'Shyby, dipy, pistole a zvedání nohou. Pro pokročilé.',
      nb: 'Pullups, dips, pistolknebøy og beinløft. For viderekomne.',
      en: 'Pull-ups, dips, pistol squats and leg raises. For advanced athletes.',
    },
    sessions: ['cali_strength', 'cali_push'],
  },
  {
    id: 'run5k', discipline: 'running', equipment: [], level: 1, weeks: 8, perWeek: 3,
    name: { cs: 'Od nuly na 5 km', nb: 'Fra null til 5 km', en: 'Zero to 5K' },
    description: {
      cs: 'Střídání běhu a chůze. Za 8 týdnů uběhneš 30 minut v kuse. Hlasový trenér ti řekne, kdy běžet a kdy jít.',
      nb: 'Veksling mellom løping og gange. Om 8 uker løper du 30 minutter sammenhengende. Stemmetreneren sier når du skal løpe og gå.',
      en: 'Alternate running and walking. In 8 weeks you run 30 minutes non-stop. The voice coach tells you when to run and walk.',
    },
    sessions: [],
    weekly: Array.from({ length: 8 }, (_, i) => [`run5k_w${i + 1}`]),
  },
  {
    id: 'kb_start', discipline: 'kettlebell', equipment: ['kettlebell'], level: 1, weeks: 4, perWeek: 3,
    name: { cs: 'Kettlebell start', nb: 'Kettlebell start', en: 'Kettlebell start' },
    description: {
      cs: 'Naučíš se švih, goblet dřep, mrtvý tah a přítah. Střídají se tréninky A a B.',
      nb: 'Du lærer sving, goblet knebøy, markløft og roing. A- og B-økter veksler.',
      en: 'Learn the swing, goblet squat, deadlift and row. Sessions A and B alternate.',
    },
    sessions: ['kb_a', 'kb_b'],
  },
  {
    id: 'kb_daily', discipline: 'kettlebell', equipment: ['kettlebell'], level: 2, weeks: 6, perWeek: 5,
    name: { cs: 'Švih + Get-up', nb: 'Sving + Get-up', en: 'Swing + Get-up' },
    description: {
      cs: 'Krátký denní trénink: 100 švihů a 10 tureckých vstávání. Zvyšuj váhu, až to půjde lehce.',
      nb: 'Kort daglig økt: 100 svinger og 10 get-ups. Øk vekten når det føles lett.',
      en: 'Short daily practice: 100 swings and 10 get-ups. Go heavier once it feels easy.',
    },
    sessions: ['kb_daily'],
  },
  {
    id: 'hiit', discipline: 'cardio', equipment: [], level: 2, weeks: 4, perWeek: 3,
    name: { cs: 'HIIT kondice', nb: 'HIIT kondisjon', en: 'HIIT conditioning' },
    description: {
      cs: 'Tabata a HIIT bez vybavení (stačí švihadlo). Hodně potu za krátký čas.',
      nb: 'Tabata og HIIT uten utstyr (et hoppetau holder). Mye svette på kort tid.',
      en: 'Tabata and no-equipment HIIT (a jump rope is enough). A lot of sweat in little time.',
    },
    sessions: ['tabata', 'home_hiit'],
  },
  {
    id: 'mobility', discipline: 'mobility', equipment: [], level: 1, weeks: 4, perWeek: 5,
    name: { cs: 'Ranní mobilita', nb: 'Morgenmobilitet', en: 'Morning mobility' },
    description: {
      cs: '10 minut každé ráno pro pohyblivá záda a kyčle.',
      nb: '10 minutter hver morgen for en smidig rygg og hofter.',
      en: '10 minutes every morning for a mobile back and hips.',
    },
    sessions: ['mob_morning'],
  },
];

export const PROGRAM_BY_ID: Record<string, Program> = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

export function programSessionsForWeek(p: Program, week: number): string[] {
  if (p.weekly) return p.weekly[Math.min(week, p.weekly.length - 1)];
  return p.sessions;
}
