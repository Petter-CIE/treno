// Validates translation packs against English: run with `npx tsx scripts/check-locales.ts`
import { DICTS } from '../src/lib/i18n';
import { EXERCISES } from '../src/data/exercises';
import { PROGRAMS, WORKOUTS } from '../src/data/programs';
import { EXTRA_LANGS, LOCALES } from '../src/locales';

const en = DICTS.en;
const ph = (s: string) => (s.match(/\{[a-z]+\}/g) ?? []).sort().join(',');
let errors = 0;
const fail = (m: string) => {
  errors++;
  console.error('✗', m);
};

for (const l of EXTRA_LANGS) {
  const p = LOCALES[l];
  if (!p) {
    fail(`${l}: missing pack`);
    continue;
  }
  for (const k of Object.keys(en) as (keyof typeof en)[]) {
    const v = p.ui[k];
    if (!v) fail(`${l}: ui.${k} missing`);
    else if (ph(v) !== ph(en[k])) fail(`${l}: ui.${k} placeholders ${ph(v)} ≠ ${ph(en[k])}`);
  }
  for (const k of Object.keys(p.ui)) if (!(k in en)) fail(`${l}: unknown ui key ${k}`);
  for (const e of EXERCISES) {
    const t = p.ex[e.id];
    if (!t?.name || !t.muscles) fail(`${l}: ex.${e.id} missing`);
    else if (t.cues.length !== e.cues.en.length) fail(`${l}: ex.${e.id} cues ${t.cues.length} ≠ ${e.cues.en.length}`);
  }
  for (const w of WORKOUTS) if (!p.wo[w.id]?.name) fail(`${l}: wo.${w.id} missing`);
  for (const pr of PROGRAMS) if (!p.pr[pr.id]?.name || !p.pr[pr.id]?.description) fail(`${l}: pr.${pr.id} missing`);
}
if (errors) process.exit(1);
console.log(`✓ ${EXTRA_LANGS.length} languages complete`);
