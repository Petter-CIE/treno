import { getLocales } from 'expo-localization';
import type { Lang } from './types';

export function deviceLang(): Lang {
  for (const l of getLocales()) {
    const code = l.languageCode?.toLowerCase();
    if (code === 'cs' || code === 'sk') return 'cs';
    if (code === 'nb' || code === 'nn' || code === 'no') return 'nb';
    if (code === 'en') return 'en';
  }
  return 'en';
}
