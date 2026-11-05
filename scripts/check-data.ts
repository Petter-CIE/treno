// Sanity check for built-in content: run with `npx tsx scripts/check-data.ts`
import { EXERCISES, EXERCISE_BY_ID } from '../src/data/exercises';
import { PROGRAMS, WORKOUTS, WORKOUT_BY_ID } from '../src/data/programs';
import { ANIMATIONS } from '../src/data/animations';

let errors = 0;
const fail = (m: string) => { errors++; console.error('✗', m); };

const ids = new Set<string>();
for (const e of EXERCISES) {
  if (ids.has(e.id)) fail(`duplicate exercise ${e.id}`);
  ids.add(e.id);
  for (const l of ['cs', 'nb', 'en'] as const) {
    if (!e.name[l] || !e.muscles[l] || !e.cues[l]?.length) fail(`exercise ${e.id} missing ${l}`);
    if (e.cues[l].length !== e.cues.en.length) fail(`exercise ${e.id} cue count ${l}`);
  }
}
for (const w of WORKOUTS) {
  for (const b of w.blocks) for (const i of b.items) if (!EXERCISE_BY_ID[i.ex]) fail(`workout ${w.id} → unknown exercise ${i.ex}`);
  for (const l of ['cs', 'nb', 'en'] as const) if (!w.name[l]) fail(`workout ${w.id} missing name ${l}`);
}
for (const p of PROGRAMS) {
  const all = p.weekly ? p.weekly.flat() : p.sessions;
  if (!all.length) fail(`program ${p.id} has no sessions`);
  for (const s of all) if (!WORKOUT_BY_ID[s]) fail(`program ${p.id} → unknown workout ${s}`);
  if (p.weekly && p.weekly.length !== p.weeks) fail(`program ${p.id} weekly length`);
}
for (const e of EXERCISES) if (!ANIMATIONS[e.id]) fail(`exercise ${e.id} has no animation`);
for (const id of Object.keys(ANIMATIONS)) if (!EXERCISE_BY_ID[id]) fail(`animation ${id} has no exercise`);
console.log(`${EXERCISES.length} exercises, ${WORKOUTS.length} workouts, ${PROGRAMS.length} programs`);
if (errors) process.exit(1);
console.log('✓ content OK');
