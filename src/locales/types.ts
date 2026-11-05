import type { Key } from '@/lib/i18n';

/** Translations for one extra language. Anything missing falls back to English. */
export interface LocalePack {
  /** UI strings – keep {placeholders} exactly */
  ui: Partial<Record<Key, string>>;
  /** exercises by id – cues must have the same number of items as English */
  ex: Record<string, { name: string; muscles: string; cues: string[] }>;
  /** workouts by id */
  wo: Record<string, { name: string; focus: string }>;
  /** programs by id */
  pr: Record<string, { name: string; description: string }>;
}
